const db = require('../config/db');
const { formatInvoiceNumber } = require('../utils/formatters');

// 1. Create Booking (Protected)
exports.createBooking = async (req, res, next) => {
  const {
    enquiry_id,
    vehicle_type,
    driver_name,
    driver_phone,
    pickup_datetime,
    total_amount,
    advance_paid,
    notes
  } = req.body;

  const userId = req.user.id; // Logged-in executive or admin

  if (!enquiry_id) {
    return res.status(400).json({ success: false, error: 'Enquiry ID is required' });
  }

  const conn = await db.getConnection();

  try {
    await conn.beginTransaction();

    // A. Check if enquiry exists
    const [enqRows] = await conn.execute('SELECT status, customer_name, phone, pickup_location, drop_location, travel_date FROM enquiries WHERE id = ?', [enquiry_id]);
    if (enqRows.length === 0) {
      await conn.rollback();
      return res.status(404).json({ success: false, error: 'Enquiry not found' });
    }

    const enquiry = enqRows[0];
    const oldStatus = enquiry.status;

    // B. Create Booking entry
    const bookingQuery = `
      INSERT INTO bookings 
      (enquiry_id, vehicle_type, driver_name, driver_phone, pickup_datetime, total_amount, advance_paid, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [bookingResult] = await conn.execute(bookingQuery, [
      enquiry_id,
      vehicle_type || null,
      driver_name || null,
      driver_phone || null,
      pickup_datetime || null,
      total_amount || 0.00,
      advance_paid || 0.00,
      notes || null
    ]);

    const bookingId = bookingResult.insertId;

    // C. Update Enquiry status to 'Confirmed'
    await conn.execute('UPDATE enquiries SET status = "Confirmed" WHERE id = ?', [enquiry_id]);

    // D. Log history
    if (oldStatus !== 'Confirmed') {
      await conn.execute(`
        INSERT INTO enquiry_status_history (enquiry_id, old_status, new_status, changed_by)
        VALUES (?, ?, ?, ?)
      `, [enquiry_id, oldStatus, 'Confirmed', userId]);
    }

    // E. Generate invoice number
    const invoiceNumber = formatInvoiceNumber(bookingId);

    await conn.commit();

    return res.status(201).json({
      success: true,
      booking_id: bookingId,
      invoice_number: invoiceNumber,
      message: 'Booking confirmed and invoice generated successfully'
    });

  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
};

// 2. Get Bookings list (Protected)
exports.getBookings = async (req, res, next) => {
  try {
    const query = `
      SELECT b.*, 
             e.customer_name, 
             e.phone as customer_phone,
             e.pickup_location,
             e.drop_location,
             e.travel_date
      FROM bookings b
      LEFT JOIN enquiries e ON b.enquiry_id = e.id
      ORDER BY b.created_at DESC
    `;

    const [rows] = await db.execute(query);

    const data = rows.map(row => ({
      ...row,
      invoice_number: formatInvoiceNumber(row.id, row.created_at)
    }));

    return res.json({
      success: true,
      data
    });

  } catch (err) {
    next(err);
  }
};

// 3. Fetch Single Invoice Details (Protected)
exports.getInvoice = async (req, res, next) => {
  const { id } = req.params; // bookingId

  try {
    const query = `
      SELECT b.*, 
             e.customer_name, 
             e.phone as customer_phone,
             e.email as customer_email,
             e.pickup_location,
             e.drop_location,
             e.travel_date,
             e.return_date,
             e.trip_type,
             e.passengers,
             e.special_requirements
      FROM bookings b
      LEFT JOIN enquiries e ON b.enquiry_id = e.id
      WHERE b.id = ?
    `;

    const [rows] = await db.execute(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking / Invoice not found' });
    }

    const invoiceData = rows[0];
    invoiceData.invoice_number = formatInvoiceNumber(invoiceData.id, invoiceData.created_at);

    return res.json({
      success: true,
      data: invoiceData
    });

  } catch (err) {
    next(err);
  }
};

// 4. Update Booking (Protected)
exports.updateBooking = async (req, res, next) => {
  const { id } = req.params; // bookingId
  const {
    vehicle_type,
    driver_name,
    driver_phone,
    pickup_datetime,
    total_amount,
    advance_paid,
    payment_status,
    notes
  } = req.body;

  try {
    // Check if booking exists and fetch its current data
    const [rows] = await db.execute('SELECT * FROM bookings WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Booking not found' });
    }

    const existing = rows[0];
    const updatedVehicleType = vehicle_type !== undefined ? vehicle_type : existing.vehicle_type;
    const updatedDriverName = driver_name !== undefined ? driver_name : existing.driver_name;
    const updatedDriverPhone = driver_phone !== undefined ? driver_phone : existing.driver_phone;
    const updatedPickupDatetime = pickup_datetime !== undefined ? pickup_datetime : existing.pickup_datetime;
    const updatedTotalAmount = total_amount !== undefined ? total_amount : existing.total_amount;
    const updatedAdvancePaid = advance_paid !== undefined ? advance_paid : existing.advance_paid;
    const updatedPaymentStatus = payment_status !== undefined ? payment_status : existing.payment_status;
    const updatedNotes = notes !== undefined ? notes : existing.notes;

    const query = `
      UPDATE bookings 
      SET vehicle_type = ?, 
          driver_name = ?, 
          driver_phone = ?, 
          pickup_datetime = ?, 
          total_amount = ?, 
          advance_paid = ?, 
          payment_status = ?, 
          notes = ?
      WHERE id = ?
    `;

    await db.execute(query, [
      updatedVehicleType,
      updatedDriverName,
      updatedDriverPhone,
      updatedPickupDatetime,
      updatedTotalAmount,
      updatedAdvancePaid,
      updatedPaymentStatus,
      updatedNotes,
      id
    ]);

    return res.json({
      success: true,
      message: 'Booking details updated successfully'
    });

  } catch (err) {
    next(err);
  }
};
