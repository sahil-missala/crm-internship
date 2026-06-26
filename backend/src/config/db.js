const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'crmuser',
  password: process.env.DB_PASSWORD || 'strongpassword',
  database: process.env.DB_NAME || 'manivtha_crm',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test connection
(async () => {
  try {
    const conn = await pool.getConnection();
    console.log('Database connection pool established successfully.');
    conn.release();
  } catch (err) {
    console.error('Error connecting to the database:', err.message);
  }
})();

module.exports = pool;
