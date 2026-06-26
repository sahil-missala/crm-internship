const axios = require('axios');
const telegramConfig = require('../config/telegram');
const { getLeadTemperature } = require('../utils/formatters');

async function sendMessage(text, chatIdOverride = null) {
  const chatId = chatIdOverride || telegramConfig.chatId;
  
  if (!telegramConfig.botToken || !chatId) {
    console.log('--- TELEGRAM NOTIFICATION (MOCKED) ---');
    console.log(`To Chat ID: ${chatId || 'N/A'}`);
    console.log(text.replace(/<[^>]*>/g, '')); // Strips HTML tags for clean console logs
    console.log('--------------------------------------');
    return;
  }

  const TELEGRAM_API = `https://api.telegram.org/bot${telegramConfig.botToken}`;
  try {
    await axios.post(`${TELEGRAM_API}/sendMessage`, {
      chat_id: chatId,
      text,
      parse_mode: 'HTML'
    });
    console.log(`Telegram notification dispatched successfully to ${chatId}.`);
  } catch (err) {
    console.error(`Telegram notification dispatch to ${chatId} failed:`, err.message);
  }
}

function newEnquiryMessage(enquiry) {
  const temp = getLeadTemperature(enquiry, 0);
  const tempEmoji = temp === 'Hot' ? '🔥 HOT' : temp === 'Warm' ? '☀️ WARM' : '❄️ COLD';
  return `🚗 <b>New Enquiry Received</b>

👤 <b>${enquiry.customer_name}</b>
📞 ${enquiry.phone}
🗺️ ${enquiry.pickup_location} → ${enquiry.drop_location}
📅 Travel Date: ${enquiry.travel_date}
🔖 Type: ${enquiry.trip_type}
📌 Source: ${enquiry.source}
🌡️ Lead Priority: <b>${tempEmoji}</b>

<i>Login to CRM to follow up.</i>`;
}

function bookingConfirmedMessage(enquiry) {
  return `✅ <b>Booking Confirmed!</b>

👤 <b>${enquiry.customer_name}</b> — ${enquiry.phone}
🗺️ ${enquiry.pickup_location} → ${enquiry.drop_location}
📅 Travel Date: ${enquiry.travel_date}`;
}

module.exports = {
  sendMessage,
  newEnquiryMessage,
  bookingConfirmedMessage,
  startPolling,
  stopPolling
};

let pollingIntervalId = null;
let lastUpdateId = 0;

function startPolling(processMessageCallback) {
  if (!telegramConfig.botToken) {
    console.log('Telegram Bot Token not configured. Polling skipped.');
    return;
  }

  console.log('==================================================');
  console.log(' Starting Telegram Bot Polling Fallback (Local Dev) ');
  console.log('==================================================');
  
  if (pollingIntervalId) clearInterval(pollingIntervalId);

  pollingIntervalId = setInterval(async () => {
    try {
      const TELEGRAM_API = `https://api.telegram.org/bot${telegramConfig.botToken}`;
      const response = await axios.get(`${TELEGRAM_API}/getUpdates`, {
        params: {
          offset: lastUpdateId + 1,
          timeout: 0
        }
      });

      const updates = response.data.result || [];
      for (const update of updates) {
        lastUpdateId = update.update_id;
        
        if (update.message) {
          const message = update.message;
          if (message.chat && message.chat.id && message.text) {
            const chatId = message.chat.id.toString();
            const text = message.text;
            
            console.log(`[Telegram Poll Webhook-Fallback] Msg: "${text}" from Chat: ${chatId}`);
            await processMessageCallback('Telegram', chatId, text);
          }
        }
      }
    } catch (err) {
      if (err.code !== 'ENOTFOUND' && err.code !== 'ECONNREFUSED') {
        console.error('[Telegram Polling Error]:', err.message);
      }
    }
  }, 3000); // Check updates every 3 seconds
}

function stopPolling() {
  if (pollingIntervalId) {
    clearInterval(pollingIntervalId);
    pollingIntervalId = null;
    console.log('Telegram Bot Polling Fallback stopped.');
  }
}
