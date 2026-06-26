const db = require('../config/db');
const telegramService = require('./telegramService');
const whatsappService = require('./whatsappService');

// Customizable web link to the online enquiry form
const ENQUIRY_FORM_URL = process.env.ENQUIRY_FORM_URL || 'http://localhost:5175/enquiry';

// Trip Type mapping choices
const TRIP_TYPES = {
  '1': 'One-Way Drop',
  '2': 'Round Trip',
  '3': 'Airport Transfer',
  '4': 'Outstation',
  '5': 'Hill Station',
  '6': 'Custom'
};

// Send reply depending on platform
async function sendPlatformReply(platform, chatIdOrPhone, text) {
  if (platform === 'Telegram') {
    await telegramService.sendMessage(text, chatIdOrPhone);
  } else {
    await whatsappService.sendWhatsAppMessage(text, chatIdOrPhone);
  }
}

// State Machine logic
async function processMessage(platform, chatIdOrPhone, incomingText) {
  const text = incomingText.trim();
  const lowerText = text.toLowerCase();

  // Handle /enquiry link command
  const isEnquiryLinkCommand = ['/enquiry', '/enquire', 'enquiry', 'enquire'].includes(lowerText);
  if (isEnquiryLinkCommand) {
    const linkMsg = platform === 'Telegram'
      ? `📝 <b>Submit your booking enquiry:</b>\n\nPlease fill out the booking form on our website:\n${ENQUIRY_FORM_URL}`
      : `📝 *Submit your booking enquiry:*\n\nPlease fill out the booking form on our website:\n${ENQUIRY_FORM_URL}`;
    await sendPlatformReply(platform, chatIdOrPhone, linkMsg);
    return;
  }

  // Handle status / /status checkup command
  if (lowerText === 'status' || lowerText === '/status') {
    try {
      let query = '';
      let param = '';
      if (platform === 'Telegram') {
        query = "SELECT id, trip_type, pickup_location, drop_location, travel_date, status FROM enquiries WHERE telegram_chat_id = ? AND (status != 'Cancelled' OR updated_at >= NOW() - INTERVAL 1 DAY) ORDER BY created_at DESC";
        param = chatIdOrPhone;
      } else {
        const cleanPhone = chatIdOrPhone.replace('whatsapp:', '').replace('+', '');
        query = "SELECT id, trip_type, pickup_location, drop_location, travel_date, status FROM enquiries WHERE phone = ? AND (status != 'Cancelled' OR updated_at >= NOW() - INTERVAL 1 DAY) ORDER BY created_at DESC";
        param = cleanPhone;
      }

      const [enqRows] = await db.execute(query, [param]);

      if (enqRows.length === 0) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          platform === 'Telegram'
            ? '❌ <b>No enquiries found.</b>\n\nYou do not have any enquiries linked to this account yet. Type anything to start a new enquiry!'
            : '❌ *No enquiries found.*\n\nYou do not have any enquiries linked to this account yet. Type anything to start a new enquiry!'
        );
        return;
      }

      let statusMsg = platform === 'Telegram'
        ? `🔍 <b>Your Booking Enquiries:</b>\n\n`
        : `🔍 *Your Booking Enquiries:*\n\n`;

      enqRows.forEach(enq => {
        const dateStr = new Date(enq.travel_date).toISOString().split('T')[0];
        statusMsg += platform === 'Telegram'
          ? `• <b>Enquiry #${enq.id}</b> (${enq.trip_type})\n` +
            `  🗺️ Route: ${enq.pickup_location} → ${enq.drop_location}\n` +
            `  📅 Date: ${dateStr}\n` +
            `  ⚡ Status: <b>${enq.status}</b>\n\n`
          : `• *Enquiry #${enq.id}* (${enq.trip_type})\n` +
            `  Route: ${enq.pickup_location} to ${enq.drop_location}\n` +
            `  Date: ${dateStr}\n` +
            `  Status: *${enq.status}*\n\n`;
      });

      // Check if they have an active creation session in progress
      const [sessionRows] = await db.execute(
        'SELECT current_step FROM bot_sessions WHERE chat_id = ? AND platform = ?',
        [chatIdOrPhone, platform]
      );
      if (sessionRows.length > 0) {
        statusMsg += platform === 'Telegram'
          ? `<i>Note: You have an active request in progress. Please reply to continue your request or type <b>cancel</b> to discard it.</i>`
          : `_Note: You have an active request in progress. Please reply to continue your request or type *cancel* to discard it._`;
      }

      await sendPlatformReply(platform, chatIdOrPhone, statusMsg);
      return;
    } catch (err) {
      console.error('Error fetching status in bot:', err.message);
      await sendPlatformReply(platform, chatIdOrPhone, '❌ Error checking status. Please try again later.');
      return;
    }
  }

  // 1. Check if session exists in DB
  const [sessionRows] = await db.execute(
    'SELECT * FROM bot_sessions WHERE chat_id = ? AND platform = ?',
    [chatIdOrPhone, platform]
  );

  // Handle cancellation triggers
  const isCancelTrigger = lowerText === '/cancel' || lowerText === 'cancel booking' || lowerText === 'cancel trip' || (lowerText === 'cancel' && sessionRows.length === 0);
  if (isCancelTrigger) {
    // Delete any existing session first
    await db.execute('DELETE FROM bot_sessions WHERE chat_id = ?', [chatIdOrPhone]);
    
    // Find active enquiries (status IN ('New', 'Contacted', 'Confirmed'))
    let query = '';
    let param = '';
    if (platform === 'Telegram') {
      query = "SELECT id, trip_type, pickup_location, drop_location, travel_date FROM enquiries WHERE telegram_chat_id = ? AND status IN ('New', 'Contacted', 'Confirmed') ORDER BY created_at DESC";
      param = chatIdOrPhone;
    } else {
      const cleanPhone = chatIdOrPhone.replace('whatsapp:', '').replace('+', '');
      query = "SELECT id, trip_type, pickup_location, drop_location, travel_date FROM enquiries WHERE phone = ? AND status IN ('New', 'Contacted', 'Confirmed') ORDER BY created_at DESC";
      param = cleanPhone;
    }
    
    try {
      const [activeEnquiries] = await db.execute(query, [param]);
      
      if (activeEnquiries.length === 0) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          platform === 'Telegram'
            ? '❌ <b>You do not have any active bookings or enquiries to cancel.</b>'
            : '❌ *You do not have any active bookings or enquiries to cancel.*'
        );
        return;
      }
      
      if (activeEnquiries.length === 1) {
        const enq = activeEnquiries[0];
        const travelDateStr = new Date(enq.travel_date).toISOString().split('T')[0];
        
        // Create session
        const sessionData = {
          cancel_enquiry_id: enq.id,
          pickup: enq.pickup_location,
          drop: enq.drop_location,
          date: travelDateStr
        };
        await db.execute(
          'INSERT INTO bot_sessions (chat_id, platform, current_step, collected_data) VALUES (?, ?, ?, ?)',
          [chatIdOrPhone, platform, 'CANCEL_CONFIRM', JSON.stringify(sessionData)]
        );
        
        const confirmMsg = platform === 'Telegram'
          ? `⚠️ <b>Cancel Booking Request</b>\n\n` +
            `Are you sure you want to cancel your booking <b>#${enq.id}</b> from <b>${enq.pickup_location}</b> to <b>${enq.drop_location}</b> on <b>${travelDateStr}</b>?\n\n` +
            `Reply with <b>YES</b> to confirm cancellation, or <b>NO</b> to abort.`
          : `⚠️ *Cancel Booking Request*\n\n` +
            `Are you sure you want to cancel your booking *#${enq.id}* from *${enq.pickup_location}* to *${enq.drop_location}* on *${travelDateStr}*?\n\n` +
            `Reply with *YES* to confirm cancellation, or *NO* to abort.`;
        await sendPlatformReply(platform, chatIdOrPhone, confirmMsg);
        return;
      }
      
      // If activeEnquiries.length > 1
      const enquiryIds = activeEnquiries.map(e => e.id);
      const sessionData = {
        active_enquiry_ids: enquiryIds
      };
      await db.execute(
        'INSERT INTO bot_sessions (chat_id, platform, current_step, collected_data) VALUES (?, ?, ?, ?)',
        [chatIdOrPhone, platform, 'CANCEL_SELECT', JSON.stringify(sessionData)]
      );
      
      let selectMsg = platform === 'Telegram'
        ? `⚠️ <b>Multiple Active Bookings Found</b>\n\n` +
          `Please reply with the option number (1, 2, etc.) to select the booking you wish to cancel:\n\n`
        : `⚠️ *Multiple Active Bookings Found*\n\n` +
          `Please reply with the option number (1, 2, etc.) to select the booking you wish to cancel:\n\n`;
          
      activeEnquiries.forEach((enq, idx) => {
        const travelDateStr = new Date(enq.travel_date).toISOString().split('T')[0];
        selectMsg += platform === 'Telegram'
          ? `<b>${idx + 1}. Enquiry #${enq.id}</b> (${enq.trip_type})\n` +
            `   Route: ${enq.pickup_location} → ${enq.drop_location}\n` +
            `   Date: ${travelDateStr}\n\n`
          : `*${idx + 1}. Enquiry #${enq.id}* (${enq.trip_type})\n` +
            `   Route: ${enq.pickup_location} to ${enq.drop_location}\n` +
            `   Date: ${travelDateStr}\n\n`;
      });
      
      selectMsg += platform === 'Telegram'
        ? `Reply with the number to select, or type <b>cancel</b> to abort.`
        : `Reply with the number to select, or type *cancel* to abort.`;
        
      await sendPlatformReply(platform, chatIdOrPhone, selectMsg);
      return;
    } catch (err) {
      console.error('Error starting cancel request flow:', err.message);
      await sendPlatformReply(platform, chatIdOrPhone, '❌ Internal error starting cancellation. Please try again.');
      return;
    }
  }

  // 2. If NO active session
  if (sessionRows.length === 0) {
    // Check for start linking code in Telegram
    if (platform === 'Telegram' && text.startsWith('/start enq_')) {
      const enquiryId = text.split('enq_')[1];
      if (enquiryId && !isNaN(enquiryId)) {
        try {
          const [enqRows] = await db.execute('SELECT customer_name FROM enquiries WHERE id = ?', [enquiryId]);
          if (enqRows.length > 0) {
            // Link chat ID
            await db.execute('UPDATE enquiries SET telegram_chat_id = ? WHERE id = ?', [chatIdOrPhone, enquiryId]);
            await sendPlatformReply(
              platform,
              chatIdOrPhone,
              `✅ <b>Account Linked!</b>\n\nThank you, <b>${enqRows[0].customer_name}</b>. Your Telegram account is now connected to Enquiry #${enquiryId}. You will receive updates here whenever the booking status changes.`
            );
            return;
          }
        } catch (err) {
          console.error('Error linking Telegram account:', err.message);
        }
      }
      await sendPlatformReply(platform, chatIdOrPhone, '⚠️ Enquiry reference not found. Let us create a new one instead.');
    }

    // Check if the user is already linked to an active enquiry
    let activeEnqQuery = '';
    let activeEnqParam = '';
    if (platform === 'Telegram') {
      activeEnqQuery = "SELECT id FROM enquiries WHERE telegram_chat_id = ? AND status IN ('New', 'Contacted', 'Confirmed') ORDER BY created_at DESC LIMIT 1";
      activeEnqParam = chatIdOrPhone;
    } else {
      const cleanPhone = chatIdOrPhone.replace('whatsapp:', '').replace('+', '');
      activeEnqQuery = "SELECT id FROM enquiries WHERE phone = ? AND status IN ('New', 'Contacted', 'Confirmed') ORDER BY created_at DESC LIMIT 1";
      activeEnqParam = cleanPhone;
    }

    const [activeEnqRows] = await db.execute(activeEnqQuery, [activeEnqParam]);
    const isExplicitCreateCommand = ['enquire', '/enquire', 'new', '/new'].includes(lowerText);

    if (activeEnqRows.length > 0 && !isExplicitCreateCommand) {
      const activeEnquiryId = activeEnqRows[0].id;
      
      // Save customer message as a CRM Note
      const logNote = `[Customer -> ${platform}]: ${text}`;
      await db.execute(
        'INSERT INTO enquiry_notes (enquiry_id, user_id, note) VALUES (?, NULL, ?)',
        [activeEnquiryId, logNote]
      );

      const replyMsg = platform === 'Telegram'
        ? `📥 <b>Message forwarded to our team.</b>\n\n` +
          `We have received your update regarding Enquiry #${activeEnquiryId}.\n\n` +
          `• Type <b>status</b> to check details.\n` +
          `• Type <b>enquire</b> to submit a new booking request.`
        : `📥 *Message forwarded to our team.*\n\n` +
          `We have received your update regarding Enquiry #${activeEnquiryId}.\n\n` +
          `• Type *status* to check details.\n` +
          `• Type *enquire* to submit a new booking request.`;

      await sendPlatformReply(platform, chatIdOrPhone, replyMsg);
      return;
    }

    // Start new chatbot session
    const initialData = {};
    if (platform === 'WhatsApp') {
      const cleanPhone = chatIdOrPhone.replace('whatsapp:', '').replace('+', '');
      initialData.phone = cleanPhone;
    }

    await db.execute(
      'INSERT INTO bot_sessions (chat_id, platform, current_step, collected_data) VALUES (?, ?, ?, ?)',
      [chatIdOrPhone, platform, 'NAME', JSON.stringify(initialData)]
    );

    const welcomeMsg = platform === 'Telegram'
      ? `🚗 <b>Welcome to Manivtha Tours & Travels!</b>\n\nI can help you submit a booking enquiry directly here.\n\nTo get started, what is your <b>Full Name</b>?`
      : `🚗 *Welcome to Manivtha Tours & Travels!*\n\nI can help you submit a booking enquiry directly here.\n\nTo get started, what is your *Full Name*?`;
      
    await sendPlatformReply(platform, chatIdOrPhone, welcomeMsg);
    return;
  }

  // 3. IF active session exists
  const session = sessionRows[0];
  const currentStep = session.current_step;
  const collectedData = typeof session.collected_data === 'string'
    ? JSON.parse(session.collected_data)
    : session.collected_data;

  // Global Cancel command
  if (lowerText === 'cancel') {
    await db.execute('DELETE FROM bot_sessions WHERE chat_id = ?', [chatIdOrPhone]);
    const cancelMsg = platform === 'Telegram'
      ? '❌ Enquiry request cancelled. Send any message to start a new request.'
      : '❌ Enquiry request cancelled. Send any message to start a new request.';
    await sendPlatformReply(platform, chatIdOrPhone, cancelMsg);
    return;
  }

  switch (currentStep) {
    case 'NAME': {
      collectedData.customer_name = text;
      
      if (platform === 'Telegram') {
        // Move to PHONE step for Telegram users
        await db.execute(
          'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
          ['PHONE', JSON.stringify(collectedData), chatIdOrPhone]
        );
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          `Thanks, <b>${text}</b>!\n\nWhat is your <b>Phone Number</b> (10-digit mobile)?`
        );
      } else {
        // For WhatsApp, we already have their phone, move directly to TRIP_TYPE
        await db.execute(
          'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
          ['TRIP_TYPE', JSON.stringify(collectedData), chatIdOrPhone]
        );
        
        const choicesMsg = `Thanks, *${text}*!\n\n` +
          `Please select your *Trip Type* by replying with the number (1-6):\n` +
          `1. One-Way Drop\n` +
          `2. Round Trip\n` +
          `3. Airport Transfer\n` +
          `4. Outstation\n` +
          `5. Hill Station\n` +
          `6. Custom`;
        await sendPlatformReply(platform, chatIdOrPhone, choicesMsg);
      }
      break;
    }

    case 'PHONE': {
      // Validate phone is 10 digits
      const digitsOnly = text.replace(/\D/g, '');
      if (digitsOnly.length !== 10) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          platform === 'Telegram'
            ? '⚠️ Phone number must be exactly 10 digits. Please try again:'
            : '⚠️ Phone number must be exactly 10 digits. Please try again:'
        );
        return;
      }

      collectedData.phone = digitsOnly;
      await db.execute(
        'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
        ['TRIP_TYPE', JSON.stringify(collectedData), chatIdOrPhone]
      );

      const choicesMsg = platform === 'Telegram'
        ? `Got it! Please select your <b>Trip Type</b> by replying with the option number (1-6):\n\n` +
          `1. One-Way Drop\n` +
          `2. Round Trip\n` +
          `3. Airport Transfer\n` +
          `4. Outstation\n` +
          `5. Hill Station\n` +
          `6. Custom`
        : `Got it! Please select your *Trip Type* by replying with the option number (1-6):\n\n` +
          `1. One-Way Drop\n` +
          `2. Round Trip\n` +
          `3. Airport Transfer\n` +
          `4. Outstation\n` +
          `5. Hill Station\n` +
          `6. Custom`;
      await sendPlatformReply(platform, chatIdOrPhone, choicesMsg);
      break;
    }

    case 'TRIP_TYPE': {
      const choice = text;
      let selectedType = TRIP_TYPES[choice];

      // If user typed the name directly
      if (!selectedType) {
        const matchingVal = Object.values(TRIP_TYPES).find(
          val => val.toLowerCase() === choice.toLowerCase()
        );
        if (matchingVal) selectedType = matchingVal;
      }

      if (!selectedType) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          '⚠️ Invalid choice. Please enter a number from 1 to 6 representing your trip category.'
        );
        return;
      }

      collectedData.trip_type = selectedType;
      await db.execute(
        'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
        ['PICKUP', JSON.stringify(collectedData), chatIdOrPhone]
      );

      const pickupMsg = platform === 'Telegram'
        ? `Selected: <b>${selectedType}</b>.\n\nWhat is your <b>Pickup Location</b> address/landmark?`
        : `Selected: *${selectedType}*.\n\nWhat is your *Pickup Location* address/landmark?`;
      await sendPlatformReply(platform, chatIdOrPhone, pickupMsg);
      break;
    }

    case 'PICKUP': {
      collectedData.pickup_location = text;
      await db.execute(
        'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
        ['DROP', JSON.stringify(collectedData), chatIdOrPhone]
      );

      const dropMsg = platform === 'Telegram'
        ? 'Great. What is your destination/<b>Drop Location</b> address?'
        : 'Great. What is your destination/*Drop Location* address?';
      await sendPlatformReply(platform, chatIdOrPhone, dropMsg);
      break;
    }

    case 'DROP': {
      collectedData.drop_location = text;
      await db.execute(
        'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
        ['TRAVEL_DATE', JSON.stringify(collectedData), chatIdOrPhone]
      );

      const dateMsg = platform === 'Telegram'
        ? 'Got it. What is your <b>Travel Date</b>? (Please reply in YYYY-MM-DD format, e.g., 2026-07-15)'
        : 'Got it. What is your *Travel Date*? (Please reply in YYYY-MM-DD format, e.g., 2026-07-15)';
      await sendPlatformReply(platform, chatIdOrPhone, dateMsg);
      break;
    }

    case 'TRAVEL_DATE': {
      // Validate date YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(text)) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          '⚠️ Please use the YYYY-MM-DD format for the travel date.'
        );
        return;
      }

      const parsedDate = new Date(text);
      if (isNaN(parsedDate.getTime())) {
        await sendPlatformReply(platform, chatIdOrPhone, '⚠️ Invalid date. Please enter a real date.');
        return;
      }

      const todayStr = new Date().toISOString().split('T')[0];
      if (text < todayStr) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          '⚠️ Travel date cannot be in the past. Please enter a valid date:'
        );
        return;
      }

      collectedData.travel_date = text;

      if (collectedData.trip_type === 'Round Trip') {
        await db.execute(
          'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
          ['RETURN_DATE', JSON.stringify(collectedData), chatIdOrPhone]
        );
        const returnMsg = platform === 'Telegram'
          ? 'Since this is a Round Trip, what is your <b>Return Date</b>? (YYYY-MM-DD format)'
          : 'Since this is a Round Trip, what is your *Return Date*? (YYYY-MM-DD format)';
        await sendPlatformReply(platform, chatIdOrPhone, returnMsg);
      } else {
        await db.execute(
          'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
          ['PASSENGERS', JSON.stringify(collectedData), chatIdOrPhone]
        );
        const passMsg = platform === 'Telegram'
          ? 'How many <b>passengers</b> will be travelling? (Please reply with a number between 1 and 20)'
          : 'How many *passengers* will be travelling? (Please reply with a number between 1 and 20)';
        await sendPlatformReply(platform, chatIdOrPhone, passMsg);
      }
      break;
    }

    case 'RETURN_DATE': {
      // Validate date YYYY-MM-DD
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(text)) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          '⚠️ Please use the YYYY-MM-DD format for the return date.'
        );
        return;
      }

      if (text < collectedData.travel_date) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          `⚠️ Return date cannot be before travel date (${collectedData.travel_date}). Please enter a valid return date:`
        );
        return;
      }

      collectedData.return_date = text;
      await db.execute(
        'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
        ['PASSENGERS', JSON.stringify(collectedData), chatIdOrPhone]
      );

      const passMsg = platform === 'Telegram'
        ? 'How many <b>passengers</b> will be travelling? (Please reply with a number between 1 and 20)'
        : 'How many *passengers* will be travelling? (Please reply with a number between 1 and 20)';
      await sendPlatformReply(platform, chatIdOrPhone, passMsg);
      break;
    }

    case 'PASSENGERS': {
      const num = parseInt(text);
      if (isNaN(num) || num < 1 || num > 20) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          '⚠️ Number of passengers must be a whole number between 1 and 20.'
        );
        return;
      }

      collectedData.passengers = num;
      await db.execute(
        'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
        ['SPECIAL_REQUIREMENTS', JSON.stringify(collectedData), chatIdOrPhone]
      );

      const specMsg = platform === 'Telegram'
        ? `Almost done! Do you have any <b>Special Requirements</b>? (e.g. choice of SUV, baby seat, extra luggage space, or reply <b>none</b> to skip)`
        : `Almost done! Do you have any *Special Requirements*? (e.g. choice of SUV, baby seat, extra luggage space, or reply *none* to skip)`;
      await sendPlatformReply(platform, chatIdOrPhone, specMsg);
      break;
    }

    case 'SPECIAL_REQUIREMENTS': {
      collectedData.special_requirements = lowerText === 'none' ? null : text;
      await db.execute(
        'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
        ['CONFIRM', JSON.stringify(collectedData), chatIdOrPhone]
      );

      // Construct a confirmation message
      const isRound = collectedData.trip_type === 'Round Trip';
      
      const summaryText = platform === 'Telegram'
        ? `📝 <b>Please verify your details:</b>\n\n` +
          `👤 <b>Name:</b> ${collectedData.customer_name}\n` +
          `📞 <b>Phone:</b> ${collectedData.phone}\n` +
          `🚗 <b>Trip:</b> ${collectedData.trip_type}\n` +
          `📍 <b>Pickup:</b> ${collectedData.pickup_location}\n` +
          `📍 <b>Drop:</b> ${collectedData.drop_location}\n` +
          `📅 <b>Travel Date:</b> ${collectedData.travel_date}\n` +
          (isRound ? `📅 <b>Return Date:</b> ${collectedData.return_date}\n` : '') +
          `👥 <b>Passengers:</b> ${collectedData.passengers}\n` +
          `✍️ <b>Notes:</b> ${collectedData.special_requirements || 'None'}\n\n` +
          `Reply <b>CONFIRM</b> to submit this enquiry, or reply <b>CANCEL</b> to discard.`
        : `📝 *Please verify your details:*\n\n` +
          `👤 *Name:* ${collectedData.customer_name}\n` +
          `📞 *Phone:* ${collectedData.phone}\n` +
          `🚗 *Trip:* ${collectedData.trip_type}\n` +
          `📍 *Pickup:* ${collectedData.pickup_location}\n` +
          `📍 *Drop:* ${collectedData.drop_location}\n` +
          `📅 *Travel Date:* ${collectedData.travel_date}\n` +
          (isRound ? `📅 *Return Date:* ${collectedData.return_date}\n` : '') +
          `👥 *Passengers:* ${collectedData.passengers}\n` +
          `✍️ *Notes:* ${collectedData.special_requirements || 'None'}\n\n` +
          `Reply *CONFIRM* to submit this enquiry, or reply *CANCEL* to discard.`;

      await sendPlatformReply(platform, chatIdOrPhone, summaryText);
      break;
    }

    case 'CONFIRM': {
      if (lowerText === 'confirm') {
        try {
          // Insert into database
          const query = `
            INSERT INTO enquiries 
            (customer_name, phone, source, trip_type, pickup_location, drop_location, travel_date, return_date, passengers, special_requirements, status, telegram_chat_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?)
          `;

          const telegramChatIdVal = platform === 'Telegram' ? chatIdOrPhone : null;

          const [result] = await db.execute(query, [
            collectedData.customer_name,
            collectedData.phone,
            platform, // 'Telegram' or 'WhatsApp'
            collectedData.trip_type,
            collectedData.pickup_location,
            collectedData.drop_location,
            collectedData.travel_date,
            collectedData.return_date || null,
            collectedData.passengers,
            collectedData.special_requirements || null,
            telegramChatIdVal
          ]);

          const enquiryId = result.insertId;

          // Delete session from DB
          await db.execute('DELETE FROM bot_sessions WHERE chat_id = ?', [chatIdOrPhone]);

          // Fetch the inserted record for alerts
          const [rows] = await db.execute('SELECT * FROM enquiries WHERE id = ?', [enquiryId]);
          const newEnquiry = rows[0];

          // Trigger notifications to ADMIN channel
          const messageText = telegramService.newEnquiryMessage(newEnquiry);
          await telegramService.sendMessage(messageText);

          const waText = whatsappService.newEnquiryWhatsApp(newEnquiry);
          await whatsappService.sendWhatsAppMessage(waText);

          // Reply to user
          const successMsg = platform === 'Telegram'
            ? `✅ <b>Enquiry Submitted Successfully!</b>\n\nYour Booking Enquiry ID is <b>#${enquiryId}</b>.\n\nOur coordinator will check details and contact you shortly. Thank you!`
            : `✅ *Enquiry Submitted Successfully!*\n\nYour Booking Enquiry ID is *#${enquiryId}*.\n\nOur coordinator will check details and contact you shortly. Thank you!`;

          await sendPlatformReply(platform, chatIdOrPhone, successMsg);

        } catch (err) {
          console.error('Error saving bot enquiry:', err.message);
          await sendPlatformReply(
            platform,
            chatIdOrPhone,
            '❌ There was an internal error submitting your enquiry. Please try again later.'
          );
        }
      } else {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          platform === 'Telegram'
            ? '⚠️ Please reply with <b>CONFIRM</b> to complete the submission, or <b>CANCEL</b> to discard.'
            : '⚠️ Please reply with *CONFIRM* to complete the submission, or *CANCEL* to discard.'
        );
      }
      break;
    }

    case 'CANCEL_SELECT': {
      const optionIndex = parseInt(text) - 1;
      const activeEnquiryIds = collectedData.active_enquiry_ids;
      
      if (isNaN(optionIndex) || optionIndex < 0 || optionIndex >= activeEnquiryIds.length) {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          platform === 'Telegram'
            ? `⚠️ <b>Invalid selection.</b> Please reply with a valid option number (1 to ${activeEnquiryIds.length}):`
            : `⚠️ *Invalid selection.* Please reply with a valid option number (1 to ${activeEnquiryIds.length}):`
        );
        return;
      }
      
      const selectedEnquiryId = activeEnquiryIds[optionIndex];
      
      try {
        const [enqRows] = await db.execute('SELECT id, pickup_location, drop_location, travel_date FROM enquiries WHERE id = ?', [selectedEnquiryId]);
        if (enqRows.length === 0) {
          await db.execute('DELETE FROM bot_sessions WHERE chat_id = ?', [chatIdOrPhone]);
          await sendPlatformReply(platform, chatIdOrPhone, '❌ Booking not found. Request aborted.');
          return;
        }
        
        const enq = enqRows[0];
        const travelDateStr = new Date(enq.travel_date).toISOString().split('T')[0];
        
        const nextData = {
          cancel_enquiry_id: enq.id,
          pickup: enq.pickup_location,
          drop: enq.drop_location,
          date: travelDateStr
        };
        
        await db.execute(
          'UPDATE bot_sessions SET current_step = ?, collected_data = ? WHERE chat_id = ?',
          ['CANCEL_CONFIRM', JSON.stringify(nextData), chatIdOrPhone]
        );
        
        const confirmMsg = platform === 'Telegram'
          ? `⚠️ <b>Confirm Cancellation</b>\n\n` +
            `Are you sure you want to cancel your booking <b>#${enq.id}</b> from <b>${enq.pickup_location}</b> to <b>${enq.drop_location}</b> on <b>${travelDateStr}</b>?\n\n` +
            `Reply with <b>YES</b> to confirm cancellation, or <b>NO</b> to abort.`
          : `⚠️ *Confirm Cancellation*\n\n` +
            `Are you sure you want to cancel your booking *#${enq.id}* from *${enq.pickup_location}* to *${enq.drop_location}* on *${travelDateStr}*?\n\n` +
            `Reply with *YES* to confirm cancellation, or *NO* to abort.`;
            
        await sendPlatformReply(platform, chatIdOrPhone, confirmMsg);
      } catch (err) {
        console.error('Error in CANCEL_SELECT:', err.message);
        await sendPlatformReply(platform, chatIdOrPhone, '❌ Internal error. Please try again.');
      }
      break;
    }
    
    case 'CANCEL_CONFIRM': {
      if (lowerText === 'yes') {
        const enquiryId = collectedData.cancel_enquiry_id;
        try {
          const [enqRows] = await db.execute('SELECT customer_name, pickup_location, drop_location, travel_date FROM enquiries WHERE id = ?', [enquiryId]);
          
          await db.execute(
            "UPDATE enquiries SET status = 'Cancelled', cancellation_reason = 'Cancelled by customer via chatbot' WHERE id = ?",
            [enquiryId]
          );
          
          await db.execute('DELETE FROM bot_sessions WHERE chat_id = ?', [chatIdOrPhone]);
          
          await db.execute(
            "INSERT INTO enquiry_status_history (enquiry_id, old_status, new_status) VALUES (?, 'Confirmed', 'Cancelled')",
            [enquiryId]
          );
          
          const timelineNote = `[Cancelled]: Customer cancelled booking via ${platform} Bot.`;
          await db.execute(
            'INSERT INTO enquiry_notes (enquiry_id, user_id, note) VALUES (?, NULL, ?)',
            [enquiryId, timelineNote]
          );
          
          const customerMsg = platform === 'Telegram'
            ? `❌ <b>Booking Cancelled</b>\n\nYour booking <b>#${enquiryId}</b> has been successfully cancelled.`
            : `❌ *Booking Cancelled*\n\nYour booking *#${enquiryId}* has been successfully cancelled.`;
          await sendPlatformReply(platform, chatIdOrPhone, customerMsg);
          
          if (enqRows.length > 0) {
            const dateStr = new Date(enqRows[0].travel_date).toISOString().split('T')[0];
            const adminMsg = `❌ <b>Customer Cancelled Booking via Bot - Enquiry #${enquiryId}</b>\n` +
              `👤 <b>Customer:</b> ${enqRows[0].customer_name}\n` +
              `🗺️ <b>Route:</b> ${enqRows[0].pickup_location} → ${enqRows[0].drop_location}\n` +
              `📅 <b>Travel Date:</b> ${dateStr}\n` +
              `✍️ <b>Reason:</b> Cancelled by customer via chatbot`;
            await telegramService.sendMessage(adminMsg);
            
            const adminWAMsg = `❌ *Customer Cancelled Booking via Bot - Enquiry #${enquiryId}*\n` +
              `*Customer:* ${enqRows[0].customer_name}\n` +
              `*Route:* ${enqRows[0].pickup_location} to ${enqRows[0].drop_location}\n` +
              `*Date:* ${dateStr}\n` +
              `*Reason:* Cancelled by customer via chatbot`;
            await whatsappService.sendWhatsAppMessage(adminWAMsg);
          }
        } catch (err) {
          console.error('Error processing cancellation confirmation:', err.message);
          await sendPlatformReply(platform, chatIdOrPhone, '❌ Failed to process cancellation. Please try again.');
        }
      } else if (lowerText === 'no') {
        await db.execute('DELETE FROM bot_sessions WHERE chat_id = ?', [chatIdOrPhone]);
        const abortMsg = platform === 'Telegram'
          ? '❌ Cancellation request aborted.'
          : '❌ Cancellation request aborted.';
        await sendPlatformReply(platform, chatIdOrPhone, abortMsg);
      } else {
        await sendPlatformReply(
          platform,
          chatIdOrPhone,
          platform === 'Telegram'
            ? '⚠️ Please reply with <b>YES</b> to confirm cancellation, or <b>NO</b> to abort.'
            : '⚠️ Please reply with *YES* to confirm cancellation, or *NO* to abort.'
        );
      }
      break;
    }

    default:
      // Fallback
      await db.execute('DELETE FROM bot_sessions WHERE chat_id = ?', [chatIdOrPhone]);
      await sendPlatformReply(
        platform,
        chatIdOrPhone,
        'Something went wrong. Let us start over. Send any message.'
      );
      break;
  }
}

module.exports = {
  processMessage
};
