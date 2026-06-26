const db = require('../config/db');
const { getLeadTemperature } = require('../utils/formatters');
const telegramService = require('../services/telegramService');
const whatsappService = require('../services/whatsappService');

// 1. Create Enquiry (Public)
exports.createEnquiry = async (req, res, next) => {
  const {
    customer_name,
    phone,
    email,
    source,
    trip_type,
    pickup_location,
    drop_location,
    travel_date,
    return_date,
    passengers,
    special_requirements
  } = req.body;

  try {
    const query = `
      INSERT INTO enquiries 
      (customer_name, phone, email, source, trip_type, pickup_location, drop_location, travel_date, return_date, passengers, special_requirements, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')
    `;

    const [result] = await db.execute(query, [
      customer_name,
      phone,
      email || null,
      source,
      trip_type,
      pickup_location,
      drop_location,
      travel_date,
      return_date || null,
      passengers || 1,
      special_requirements || null
    ]);

    const enquiryId = result.insertId;

    // Fetch the newly created enquiry to construct Telegram message
    const [rows] = await db.execute('SELECT * FROM enquiries WHERE id = ?', [enquiryId]);
    const newEnquiry = rows[0];

    // Trigger Telegram notification
    const messageText = telegramService.newEnquiryMessage(newEnquiry);
    await telegramService.sendMessage(messageText);

    // Trigger WhatsApp notification
    const waText = whatsappService.newEnquiryWhatsApp(newEnquiry);
    await whatsappService.sendWhatsAppMessage(waText);

    return res.status(201).json({
      success: true,
      enquiry_id: enquiryId,
      telegram_bot_username: process.env.TELEGRAM_BOT_USERNAME || 'sahilharshagovindcrm_bot',
      whatsapp_sandbox_keyword: process.env.WHATSAPP_SANDBOX_KEYWORD || 'join corridor-member',
      message: 'Enquiry received'
    });

  } catch (err) {
    next(err);
  }
};

// 2. Get Enquiries (Protected)
exports.getEnquiries = async (req, res, next) => {
  const {
    status,
    trip_type,
    source,
    date_from,
    date_to,
    search,
    page = 1,
    limit = 20
  } = req.query;

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const offset = (pageNum - 1) * limitNum;

  try {
    let whereClauses = [];
    let params = [];

    if (status) {
      whereClauses.push('e.status = ?');
      params.push(status);
    }
    if (trip_type) {
      whereClauses.push('e.trip_type = ?');
      params.push(trip_type);
    }
    if (source) {
      whereClauses.push('e.source = ?');
      params.push(source);
    }
    if (date_from) {
      whereClauses.push('e.travel_date >= ?');
      params.push(date_from);
    }
    if (date_to) {
      whereClauses.push('e.travel_date <= ?');
      params.push(date_to);
    }
    if (search) {
      whereClauses.push('(e.customer_name LIKE ? OR e.phone LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    // Count query
    const countQuery = `SELECT COUNT(*) as total FROM enquiries e ${whereSql}`;
    const [countRows] = await db.execute(countQuery, params);
    const total = countRows[0].total;

    // Data query (selects notes count via subquery for lead temperature)
    const dataQuery = `
      SELECT e.*, 
             u.name as assignee_name,
             (SELECT COUNT(*) FROM enquiry_notes WHERE enquiry_id = e.id) as notes_count
      FROM enquiries e
      LEFT JOIN users u ON e.assigned_to = u.id
      ${whereSql}
      ORDER BY e.created_at DESC
      LIMIT ? OFFSET ?
    `;

    // Append limit and offset to parameters
    // mysql2 execute expects limit/offset to be integers or passed directly. 
    // We concatenate limit/offset safely because they are cast to numbers.
    const [dataRows] = await db.query(dataQuery, [...params, limitNum, offset]);

    // Compute dynamic lead temperature for each enquiry
    const data = dataRows.map(row => ({
      ...row,
      lead_temperature: getLeadTemperature(row, row.notes_count)
    }));

    const totalPages = Math.ceil(total / limitNum);

    return res.json({
      success: true,
      data,
      total,
      page: pageNum,
      totalPages
    });

  } catch (err) {
    next(err);
  }
};

// 3. Get Single Enquiry Details (Protected)
exports.getEnquiryById = async (req, res, next) => {
  const { id } = req.params;

  try {
    // 1. Fetch Enquiry
    const [enqRows] = await db.execute(`
      SELECT e.*, u.name as assignee_name 
      FROM enquiries e 
      LEFT JOIN users u ON e.assigned_to = u.id 
      WHERE e.id = ?
    `, [id]);

    if (enqRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    const enquiry = enqRows[0];

    // 2. Fetch Notes
    const [noteRows] = await db.execute(`
      SELECT n.*, u.name as user_name 
      FROM enquiry_notes n 
      LEFT JOIN users u ON n.user_id = u.id 
      WHERE n.enquiry_id = ? 
      ORDER BY n.created_at DESC
    `, [id]);

    // 3. Fetch Status History
    const [historyRows] = await db.execute(`
      SELECT h.*, u.name as user_name 
      FROM enquiry_status_history h 
      LEFT JOIN users u ON h.changed_by = u.id 
      WHERE h.enquiry_id = ? 
      ORDER BY h.changed_at DESC
    `, [id]);

    // Calculate lead temperature
    enquiry.lead_temperature = getLeadTemperature(enquiry, noteRows.length);

    return res.json({
      success: true,
      data: {
        ...enquiry,
        notes: noteRows,
        status_history: historyRows
      }
    });

  } catch (err) {
    next(err);
  }
};

// 4. Update Status (Protected)
exports.updateEnquiryStatus = async (req, res, next) => {
  const { id } = req.params;
  const { status, reason, sendTelegram, sendWhatsApp } = req.body;
  const changedBy = req.user.id;

  if (!status) {
    return res.status(400).json({ success: false, error: 'Status is required' });
  }

  try {
    // Fetch current status and bot identifiers
    const [enqRows] = await db.execute('SELECT status, customer_name, phone, pickup_location, drop_location, travel_date, telegram_chat_id FROM enquiries WHERE id = ?', [id]);
    if (enqRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    const oldStatus = enqRows[0].status;

    if (oldStatus === status) {
      return res.json({ success: true, message: 'Status remains unchanged' });
    }

    // Update status and cancellation reason if cancelled
    if (status === 'Cancelled') {
      await db.execute('UPDATE enquiries SET status = ?, cancellation_reason = ? WHERE id = ?', [status, reason || null, id]);
      
      const noteText = reason ? `[Cancelled] Reason: ${reason}` : `[Cancelled] No reason provided.`;
      await db.execute('INSERT INTO enquiry_notes (enquiry_id, user_id, note) VALUES (?, ?, ?)', [id, changedBy, noteText]);
    } else {
      await db.execute('UPDATE enquiries SET status = ? WHERE id = ?', [status, id]);
    }

    // Insert history record
    await db.execute(`
      INSERT INTO enquiry_status_history (enquiry_id, old_status, new_status, changed_by)
      VALUES (?, ?, ?, ?)
    `, [id, oldStatus, status, changedBy]);

    const dateStr = new Date(enqRows[0].travel_date).toISOString().split('T')[0];

    // Send Telegram alert if Confirmed
    if (status === 'Confirmed') {
      // Admin notifications
      const alertMessage = telegramService.bookingConfirmedMessage(enqRows[0]);
      await telegramService.sendMessage(alertMessage);

      // Send WhatsApp alert to Admin
      const waConfirmMessage = whatsappService.bookingConfirmedWhatsApp(enqRows[0]);
      await whatsappService.sendWhatsAppMessage(waConfirmMessage);

      // Customer notifications
      if (enqRows[0].telegram_chat_id) {
        const customerTelegramMsg = `🎉 <b>Good news! Your travel booking has been CONFIRMED.</b>\n\n` +
          `🗺️ <b>Route:</b> ${enqRows[0].pickup_location} → ${enqRows[0].drop_location}\n` +
          `📅 <b>Travel Date:</b> ${enqRows[0].travel_date}`;
        await telegramService.sendMessage(customerTelegramMsg, enqRows[0].telegram_chat_id);
      }

      if (enqRows[0].phone) {
        const customerWhatsAppMsg = `🎉 *Good news! Your travel booking has been CONFIRMED.*\n\n` +
          `🗺️ *Route:* ${enqRows[0].pickup_location} to ${enqRows[0].drop_location}\n` +
          `📅 *Date:* ${enqRows[0].travel_date}`;
        await whatsappService.sendWhatsAppMessage(customerWhatsAppMsg, enqRows[0].phone);
      }
    }

    // Send alerts if Cancelled
    if (status === 'Cancelled') {
      // Admin notifications
      const alertMessage = `❌ <b>Booking Cancelled - Enquiry #${id}</b>\n👤 <b>Customer:</b> ${enqRows[0].customer_name}\n🗺️ <b>Route:</b> ${enqRows[0].pickup_location} → ${enqRows[0].drop_location}\n📅 <b>Travel Date:</b> ${dateStr}\n✍️ <b>Reason:</b> ${reason || 'None'}`;
      await telegramService.sendMessage(alertMessage);

      const waConfirmMessage = `❌ *Booking Cancelled - Enquiry #${id}*\n*Customer:* ${enqRows[0].customer_name}\n*Route:* ${enqRows[0].pickup_location} to ${enqRows[0].drop_location}\n*Date:* ${dateStr}\n*Reason:* ${reason || 'None'}`;
      await whatsappService.sendWhatsAppMessage(waConfirmMessage);

      // Customer notifications if selected
      if (sendTelegram && enqRows[0].telegram_chat_id) {
        const customerTelegramMsg = `❌ <b>Your travel booking has been CANCELLED.</b>\n\n` +
          `🗺️ <b>Route:</b> ${enqRows[0].pickup_location} → ${enqRows[0].drop_location}\n` +
          `📅 <b>Travel Date:</b> ${dateStr}\n` +
          `✍️ <b>Reason:</b> ${reason || 'Not specified'}`;
        await telegramService.sendMessage(customerTelegramMsg, enqRows[0].telegram_chat_id);
      }

      if (sendWhatsApp && enqRows[0].phone) {
        const customerWhatsAppMsg = `❌ *Your travel booking has been CANCELLED.*\n\n` +
          `🗺️ *Route:* ${enqRows[0].pickup_location} to ${enqRows[0].drop_location}\n` +
          `📅 *Date:* ${dateStr}\n` +
          `*Reason:* ${reason || 'Not specified'}`;
        await whatsappService.sendWhatsAppMessage(customerWhatsAppMsg, enqRows[0].phone);
      }
    }

    return res.json({
      success: true,
      message: 'Status updated successfully',
      old_status: oldStatus,
      new_status: status
    });

  } catch (err) {
    next(err);
  }
};

// 5. Update Follow-up Date (Protected)
exports.updateEnquiryFollowUp = async (req, res, next) => {
  const { id } = req.params;
  const { follow_up_date } = req.body;

  try {
    const [enqRows] = await db.execute('SELECT id FROM enquiries WHERE id = ?', [id]);
    if (enqRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    await db.execute('UPDATE enquiries SET follow_up_date = ? WHERE id = ?', [follow_up_date || null, id]);

    return res.json({
      success: true,
      message: 'Follow-up date updated successfully',
      follow_up_date
    });

  } catch (err) {
    next(err);
  }
};

// 6. Save Note (Protected)
exports.addEnquiryNote = async (req, res, next) => {
  const { id } = req.params;
  const { note } = req.body;
  const userId = req.user.id;

  if (!note) {
    return res.status(400).json({ success: false, error: 'Note content is required' });
  }

  try {
    const [enqRows] = await db.execute('SELECT id FROM enquiries WHERE id = ?', [id]);
    if (enqRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    const [result] = await db.execute(`
      INSERT INTO enquiry_notes (enquiry_id, user_id, note)
      VALUES (?, ?, ?)
    `, [id, userId, note]);

    return res.status(201).json({
      success: true,
      message: 'Note added successfully',
      note_id: result.insertId
    });

  } catch (err) {
    next(err);
  }
};

// 7. Get Follow-ups Today (Protected)
exports.getFollowUpsToday = async (req, res, next) => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];

    // Query followups scheduled for today
    const query = `
      SELECT e.*, 
             u.name as assignee_name,
             (SELECT note FROM enquiry_notes WHERE enquiry_id = e.id ORDER BY created_at DESC LIMIT 1) as last_note,
             (SELECT COUNT(*) FROM enquiry_notes WHERE enquiry_id = e.id) as notes_count
      FROM enquiries e
      LEFT JOIN users u ON e.assigned_to = u.id
      WHERE e.follow_up_date = ? AND e.status IN ('New', 'Contacted')
      ORDER BY e.created_at DESC
    `;

    const [rows] = await db.execute(query, [todayStr]);

    const data = rows.map(row => ({
      ...row,
      lead_temperature: getLeadTemperature(row, row.notes_count)
    }));

    return res.json({
      success: true,
      data
    });

  } catch (err) {
    next(err);
  }
};

// 8. Update Enquiry Details (Protected)
exports.updateEnquiryDetails = async (req, res, next) => {
  const { id } = req.params;
  const {
    customer_name,
    phone,
    email,
    pickup_location,
    drop_location,
    travel_date,
    return_date,
    passengers,
    special_requirements
  } = req.body;

  try {
    const [enqRows] = await db.execute('SELECT id FROM enquiries WHERE id = ?', [id]);
    if (enqRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    const query = `
      UPDATE enquiries 
      SET customer_name = ?,
          phone = ?,
          email = ?,
          pickup_location = ?,
          drop_location = ?,
          travel_date = ?,
          return_date = ?,
          passengers = ?,
          special_requirements = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      customer_name,
      phone,
      email || null,
      pickup_location,
      drop_location,
      travel_date,
      return_date || null,
      passengers || 1,
      special_requirements || null,
      id
    ]);

    return res.json({
      success: true,
      message: 'Enquiry details updated successfully'
    });

  } catch (err) {
    next(err);
  }
};

// 9. Send Direct Message to Customer (Protected)
exports.sendCustomerMessage = async (req, res, next) => {
  const { id } = req.params;
  const { message, platform } = req.body;
  const userId = req.user.id;

  if (!message || !platform) {
    return res.status(400).json({ success: false, error: 'Message and platform are required' });
  }

  try {
    // 1. Fetch Enquiry
    const [enqRows] = await db.execute('SELECT * FROM enquiries WHERE id = ?', [id]);
    if (enqRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }
    const enquiry = enqRows[0];

    // 2. Dispatch depending on platform
    if (platform === 'telegram') {
      if (!enquiry.telegram_chat_id) {
        return res.status(400).json({
          success: false,
          error: 'This customer has not linked their Telegram bot account. Send the start link to the customer first.'
        });
      }
      
      const formattedMessage = `💬 <b>Message from Manivtha Travels:</b>\n\n${message}`;
      await telegramService.sendMessage(formattedMessage, enquiry.telegram_chat_id);
      
      // Log Note
      await db.execute(`
        INSERT INTO enquiry_notes (enquiry_id, user_id, note)
        VALUES (?, ?, ?)
      `, [id, userId, `[Staff -> Telegram]: ${message}`]);

    } else if (platform === 'whatsapp') {
      const formattedMessage = `💬 *Message from Manivtha Travels:*\n\n${message}`;
      await whatsappService.sendWhatsAppMessage(formattedMessage, enquiry.phone);

      // Log Note
      await db.execute(`
        INSERT INTO enquiry_notes (enquiry_id, user_id, note)
        VALUES (?, ?, ?)
      `, [id, userId, `[Staff -> WhatsApp]: ${message}`]);

    } else {
      return res.status(400).json({ success: false, error: 'Unsupported platform (choose telegram or whatsapp)' });
    }

    return res.json({
      success: true,
      message: `Message sent successfully via ${platform}`
    });

  } catch (err) {
    next(err);
  }
};

// 10. Link Telegram Chat ID Manually (Protected)
exports.linkTelegramChatId = async (req, res, next) => {
  const { id } = req.params;
  const { telegram_chat_id } = req.body;

  try {
    const [enqRows] = await db.execute('SELECT id, telegram_chat_id FROM enquiries WHERE id = ?', [id]);
    if (enqRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    const currentChatId = enqRows[0].telegram_chat_id;

    if (!telegram_chat_id) {
      // Unlink
      await db.execute('UPDATE enquiries SET telegram_chat_id = NULL WHERE id = ?', [id]);

      // Insert Note log
      await db.execute(`
        INSERT INTO enquiry_notes (enquiry_id, user_id, note)
        VALUES (?, ?, ?)
      `, [id, req.user.id, `Unlinked Telegram Chat ID (previously: ${currentChatId || 'N/A'})`]);

      return res.json({
        success: true,
        message: 'Telegram Chat ID unlinked successfully'
      });
    }

    // Link
    await db.execute('UPDATE enquiries SET telegram_chat_id = ? WHERE id = ?', [telegram_chat_id, id]);

    // Send verification message
    try {
      const welcomeMsg = `🤝 <b>Account Linked!</b>\n\nYour Telegram account has been linked to Enquiry #${id}. You will receive status updates here!`;
      await telegramService.sendMessage(welcomeMsg, telegram_chat_id);
    } catch (err) {
      console.warn('Could not dispatch verification to Telegram bot:', err.message);
    }

    // Insert Note log
    await db.execute(`
      INSERT INTO enquiry_notes (enquiry_id, user_id, note)
      VALUES (?, ?, ?)
    `, [id, req.user.id, `Linked Telegram Chat ID manually: ${telegram_chat_id}`]);

    return res.json({
      success: true,
      message: 'Telegram Chat ID linked successfully'
    });

  } catch (err) {
    next(err);
  }
};
