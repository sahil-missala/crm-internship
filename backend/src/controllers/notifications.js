const telegramService = require('../services/telegramService');
const chatbotService = require('../services/chatbotService');

exports.sendTestNotification = async (req, res, next) => {
  try {
    const text = '⚡ <b>Manivtha CRM Connection Test</b>\n\nTelegram API channel is successfully connected. Integration verified!';
    await telegramService.sendMessage(text);
    
    return res.json({
      success: true,
      message: 'Test Telegram notification dispatched successfully'
    });
  } catch (err) {
    next(err);
  }
};

// Handle incoming Telegram messages via Webhook
exports.handleTelegramWebhook = async (req, res, next) => {
  // Always respond 200 OK immediately to Telegram to prevent retry spam
  res.status(200).json({ received: true });
  
  try {
    const { message } = req.body;
    if (message && message.chat && message.chat.id && message.text) {
      const chatId = message.chat.id.toString();
      const text = message.text;
      
      console.log(`[Telegram Webhook] Message from Chat ID ${chatId}: "${text}"`);
      await chatbotService.processMessage('Telegram', chatId, text);
    }
  } catch (err) {
    console.error('[Telegram Webhook Error]:', err.message);
  }
};

// Handle incoming WhatsApp messages from Twilio Sandbox via Webhook
exports.handleWhatsAppWebhook = async (req, res, next) => {
  try {
    const { From, Body } = req.body;
    
    if (From && Body) {
      const fromPhone = From; // format is 'whatsapp:+919876543210'
      const text = Body;
      
      console.log(`[WhatsApp Webhook] Message from Phone ${fromPhone}: "${text}"`);
      await chatbotService.processMessage('WhatsApp', fromPhone, text);
    }
    
    // Respond with empty Twilio Markup (TwiML) to close request
    res.type('text/xml');
    return res.send('<Response></Response>');
  } catch (err) {
    console.error('[WhatsApp Webhook Error]:', err.message);
    res.type('text/xml');
    return res.status(500).send('<Response></Response>');
  }
};

// Check integration status (Protected)
exports.getIntegrationStatus = async (req, res, next) => {
  try {
    const whatsappConfigured = !!(
      process.env.WHATSAPP_ACCOUNT_SID &&
      process.env.WHATSAPP_AUTH_TOKEN &&
      process.env.WHATSAPP_FROM_NUMBER
    );
    
    const telegramConfigured = !!(
      process.env.TELEGRAM_BOT_TOKEN
    );

    return res.json({
      success: true,
      whatsappConfigured,
      telegramConfigured
    });
  } catch (err) {
    next(err);
  }
};
