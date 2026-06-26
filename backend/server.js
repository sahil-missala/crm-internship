const app = require('./app');
const reminderService = require('./src/services/reminderService');
const { runMigrations } = require('./src/config/migrate');
require('dotenv').config();

const PORT = process.env.PORT || 5050;

async function startServer() {
  // Run migrations first
  await runMigrations();

  const server = app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(` Manivtha CRM Backend Server Running     `);
    console.log(` Port: ${PORT}                            `);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'} `);
    console.log(`=========================================`);
    
    // Start the background follow-up scheduler
    reminderService.startScheduler();

    // Start background Telegram polling for local development fallback
    const chatbotService = require('./src/services/chatbotService');
    const telegramService = require('./src/services/telegramService');
    telegramService.startPolling(chatbotService.processMessage);
  });

  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM signal received. Shutting down gracefully...');
    const telegramService = require('./src/services/telegramService');
    telegramService.stopPolling();
    server.close(() => {
      console.log('Backend HTTP server closed.');
      process.exit(0);
    });
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
