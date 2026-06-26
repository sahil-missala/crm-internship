const db = require('../config/db');
const telegramService = require('./telegramService');

/**
 * Checks for follow-ups due today and logs/notifies about them.
 */
async function checkFollowUps() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const query = `
      SELECT id, customer_name, phone, follow_up_date 
      FROM enquiries 
      WHERE follow_up_date = ? AND status IN ('New', 'Contacted')
    `;
    const [rows] = await db.query(query, [today]);
    
    if (rows.length > 0) {
      console.log(`[ReminderService] Found ${rows.length} follow-up(s) scheduled for today.`);
      
      // Optionally notify team via Telegram of the daily count
      const summaryText = `📅 <b>Daily Follow-up Reminder</b>\n\nThere are <b>${rows.length}</b> customer follow-ups scheduled for today (${today}).\n\n<i>Log in to the portal to review.</i>`;
      await telegramService.sendMessage(summaryText);
    } else {
      console.log('[ReminderService] No follow-ups scheduled for today.');
    }
  } catch (err) {
    console.error('[ReminderService] Error running follow-up checks:', err.message);
  }
}

// Start daily checker (runs every 24 hours)
function startScheduler() {
  console.log('[ReminderService] Initializing daily follow-up checker scheduler.');
  // Run 10 seconds after startup
  setTimeout(checkFollowUps, 10000);
  
  // Set interval to repeat every 24 hours
  setInterval(checkFollowUps, 24 * 60 * 60 * 1000);
}

module.exports = {
  startScheduler,
  checkFollowUps
};
