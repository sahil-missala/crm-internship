const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const chatbotService = require('../services/chatbotService');
const db = require('../config/db');

async function runTests() {
  console.log('==================================================');
  console.log('   RUNNING CHATBOT STATE MACHINE INTEGRATION TEST  ');
  console.log('==================================================');

  const testChatId = 'TEST_USER_999';
  const testWhatsAppPhone = 'whatsapp:+19998887777';

  try {
    // 0. Ensure test environment is ready (reset session if exists)
    await db.execute('DELETE FROM bot_sessions WHERE chat_id = ?', [testChatId]);
    await db.execute('DELETE FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log('✔ Cleaned up stale test sessions.');

    // --- TEST 1: TELEGRAM LINK ENQUIRY WEB CONTEXT ---
    console.log('\n--- TEST 1: Telegram Webhook Account Linking ---');
    
    // Seed a mock enquiry to link
    const [insertRes] = await db.execute(`
      INSERT INTO enquiries (customer_name, phone, source, trip_type, pickup_location, drop_location, travel_date, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, ['Alice Web-User', '9991112222', 'Website', 'One-Way Drop', 'Whitefield', 'Airport', '2026-08-01', 'New']);
    
    const mockEnquiryId = insertRes.insertId;
    console.log(`Created mock web enquiry with ID: #${mockEnquiryId}`);

    // Process linking message
    console.log(`Simulating user sending command: "/start enq_${mockEnquiryId}"`);
    await chatbotService.processMessage('Telegram', testChatId, `/start enq_${mockEnquiryId}`);

    // Verify it updated the database
    const [enqRows] = await db.execute('SELECT telegram_chat_id FROM enquiries WHERE id = ?', [mockEnquiryId]);
    if (enqRows[0].telegram_chat_id === testChatId) {
      console.log('✔ SUCCESS: telegram_chat_id correctly updated in enquiries table!');
    } else {
      console.error('❌ FAILURE: telegram_chat_id was not linked correctly.');
    }

    // Clean up mock enquiry
    await db.execute('DELETE FROM enquiries WHERE id = ?', [mockEnquiryId]);


    // --- TEST 2: WHATSAPP CHATBOT DETAILS COLLECTION ---
    console.log('\n--- TEST 2: WhatsApp Chatbot Step-by-Step Collection ---');

    // Step 1: Send initial greeting
    console.log('Simulating Message 1: "Hi" -> Expect Welcome and Name prompt');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, 'Hi');
    
    let [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Current Step: ${session[0]?.current_step}`);

    // Step 2: Provide Name
    console.log('Simulating Message 2: "Bob WhatsApp" -> Expect Trip Type prompt');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, 'Bob WhatsApp');
    
    [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Current Step: ${session[0]?.current_step}`);
    console.log(`Collected Data:`, session[0]?.collected_data);

    // Step 3: Provide Trip Type choice (e.g. 2 - Round Trip)
    console.log('Simulating Message 3: "2" (Round Trip) -> Expect Pickup prompt');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, '2');
    
    [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Current Step: ${session[0]?.current_step}`);

    // Step 4: Provide Pickup
    console.log('Simulating Message 4: "Bengaluru Railway Station" -> Expect Drop prompt');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, 'Bengaluru Railway Station');
    
    [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Current Step: ${session[0]?.current_step}`);

    // Step 5: Provide Drop
    console.log('Simulating Message 5: "Mysore Palace" -> Expect Travel Date prompt');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, 'Mysore Palace');
    
    [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Current Step: ${session[0]?.current_step}`);

    // Step 6: Provide Travel Date
    console.log('Simulating Message 6: "2026-07-20" -> Expect Return Date prompt (since Round Trip)');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, '2026-07-20');
    
    [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Current Step: ${session[0]?.current_step}`);

    // Step 7: Provide Return Date
    console.log('Simulating Message 7: "2026-07-25" -> Expect Passengers prompt');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, '2026-07-25');
    
    [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Current Step: ${session[0]?.current_step}`);

    // Step 8: Provide Passenger Count
    console.log('Simulating Message 8: "5" -> Expect Special Requirements prompt');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, '5');
    
    [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Current Step: ${session[0]?.current_step}`);

    // Step 9: Provide Special Requirements
    console.log('Simulating Message 9: "none" -> Expect Summary and Confirm prompt');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, 'none');
    
    [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Current Step: ${session[0]?.current_step}`);

    // Step 10: Confirm Enquiry
    console.log('Simulating Message 10: "CONFIRM" -> Expect Session Delete and DB Insertion');
    await chatbotService.processMessage('WhatsApp', testWhatsAppPhone, 'CONFIRM');
    
    [session] = await db.execute('SELECT * FROM bot_sessions WHERE chat_id = ?', [testWhatsAppPhone]);
    console.log(`Session Cleared (should be empty):`, session.length === 0 ? 'Yes' : 'No');

    // Verify enquiry was inserted
    const [newEnquiries] = await db.execute(
      "SELECT * FROM enquiries WHERE customer_name = ? AND source = 'WhatsApp' ORDER BY id DESC LIMIT 1",
      ['Bob WhatsApp']
    );
    
    if (newEnquiries.length > 0) {
      console.log('✔ SUCCESS: Bot-collected enquiry successfully saved in DB!');
      console.log(newEnquiries[0]);
      
      // Clean up test entry
      await db.execute('DELETE FROM enquiries WHERE id = ?', [newEnquiries[0].id]);
      console.log('✔ Cleaned up mock chatbot enquiry.');
    } else {
      console.error('❌ FAILURE: Chatbot enquiry was not saved to database.');
    }

  } catch (err) {
    console.error('❌ Integration Test encountered an error:', err);
  } finally {
    await db.end();
    console.log('\nDatabase connection closed. Test run finished.');
  }
}

runTests();
