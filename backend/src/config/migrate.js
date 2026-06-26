const pool = require('./db');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
  console.log('Running database migrations...');
  let connection;
  try {
    connection = await pool.getConnection();

    // 0. Check if base tables exist. If not, execute schema.sql
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(row => Object.values(row)[0]);

    if (!tableNames.includes('users') || !tableNames.includes('enquiries')) {
      console.log('Base tables missing. Loading and executing schema.sql...');
      const schemaPath = path.join(__dirname, '../../schema.sql');
      const schemaSql = fs.readFileSync(schemaPath, 'utf8');

      // Split queries by semicolon and execute them sequentially
      const queries = schemaSql
        .split(';')
        .map(q => q.trim())
        .filter(q => q.length > 0);

      for (const query of queries) {
        // Skip database use statement or any empty lines
        if (query.toLowerCase().startsWith('use ')) continue;
        await connection.query(query);
      }
      console.log('schema.sql executed successfully. Base tables created.');
    }

    // 1. Check if telegram_chat_id column exists in enquiries
    const [columns] = await connection.query('SHOW COLUMNS FROM enquiries');
    const hasTelegramChatId = columns.some(col => col.Field === 'telegram_chat_id');
    
    if (!hasTelegramChatId) {
      console.log('Migrating: Adding telegram_chat_id column to enquiries...');
      await connection.query('ALTER TABLE enquiries ADD COLUMN telegram_chat_id VARCHAR(50) DEFAULT NULL');
      console.log('telegram_chat_id column added.');
    }

    // 2. Update source ENUM in enquiries table to include 'Telegram'
    // Let's get the detail of the source column
    const sourceCol = columns.find(col => col.Field === 'source');
    if (sourceCol && !sourceCol.Type.includes("'Telegram'")) {
      console.log("Migrating: Updating source ENUM column to include 'Telegram'...");
      await connection.query(`
        ALTER TABLE enquiries 
        MODIFY COLUMN source ENUM('Walk-in','Phone Call','WhatsApp','Telegram','Website','Reference','Other') NOT NULL
      `);
      console.log('source ENUM column updated.');
    }

    // 3. Create bot_sessions table if it doesn't exist
    console.log('Migrating: Ensuring bot_sessions table exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS bot_sessions (
        chat_id VARCHAR(50) PRIMARY KEY,
        platform ENUM('Telegram', 'WhatsApp') NOT NULL,
        current_step VARCHAR(50) NOT NULL,
        collected_data JSON NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB
    `);
    console.log('bot_sessions table check complete.');

    // 4. Check if cancellation_reason column exists in enquiries
    const hasCancellationReason = columns.some(col => col.Field === 'cancellation_reason');
    if (!hasCancellationReason) {
      console.log('Migrating: Adding cancellation_reason column to enquiries...');
      await connection.query('ALTER TABLE enquiries ADD COLUMN cancellation_reason VARCHAR(255) DEFAULT NULL');
      console.log('cancellation_reason column added.');
    }

    console.log('Migrations executed successfully.');

  } catch (err) {
    console.error('Migration failed:', err.message);
  } finally {
    if (connection) connection.release();
  }
}

module.exports = { runMigrations };
