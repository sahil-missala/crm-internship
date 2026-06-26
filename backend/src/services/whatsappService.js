const axios = require('axios');
require('dotenv').config();

const accountSid = process.env.WHATSAPP_ACCOUNT_SID || '';
const authToken = process.env.WHATSAPP_AUTH_TOKEN || '';
const from = process.env.WHATSAPP_FROM_NUMBER || '';
const to = process.env.WHATSAPP_TO_NUMBER || '';

const isConfigured = !!(accountSid && authToken && from && to);

async function sendWhatsAppMessage(text, toOverride = null) {
  const targetTo = toOverride || to;

  if (!accountSid || !authToken || !from || !targetTo) {
    console.log('--- WHATSAPP NOTIFICATION (MOCKED) ---');
    console.log(`To: ${targetTo || 'N/A'}`);
    console.log(`Message: ${text}`);
    console.log('--------------------------------------');
    return;
  }

  // Twilio standard messages endpoint
  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
  
  // Format basic auth token
  const auth = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

  // Format to/from to match Twilio guidelines
  const formattedTo = targetTo.startsWith('whatsapp:') ? targetTo : `whatsapp:${targetTo}`;
  const formattedFrom = from.startsWith('whatsapp:') ? from : `whatsapp:${from}`;

  const params = new URLSearchParams();
  params.append('To', formattedTo);
  params.append('From', formattedFrom);
  params.append('Body', text);

  try {
    const response = await axios.post(url, params, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log(`WhatsApp notification dispatched successfully to ${targetTo}, SID:`, response.data.sid);
  } catch (err) {
    console.error(`WhatsApp API dispatch to ${targetTo} failed:`, err.response?.data || err.message);
  }
}

function newEnquiryWhatsApp(enquiry) {
  return `🚗 *New Enquiry Received - Manivtha CRM*

👤 *Customer:* ${enquiry.customer_name}
📞 *Phone:* ${enquiry.phone}
🗺️ *Route:* ${enquiry.pickup_location} to ${enquiry.drop_location}
📅 *Travel Date:* ${enquiry.travel_date}
🔖 *Trip Type:* ${enquiry.trip_type}
📌 *Source:* ${enquiry.source}

Login to CRM to follow up.`;
}

function bookingConfirmedWhatsApp(enquiry) {
  return `✅ *Booking Confirmed! - Manivtha CRM*

👤 *Customer:* ${enquiry.customer_name} (${enquiry.phone})
🗺️ *Route:* ${enquiry.pickup_location} to ${enquiry.drop_location}
📅 *Date:* ${enquiry.travel_date}`;
}

module.exports = {
  sendWhatsAppMessage,
  newEnquiryWhatsApp,
  bookingConfirmedWhatsApp,
  isConfigured
};
