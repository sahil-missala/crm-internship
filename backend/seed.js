const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function seed() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'crmuser',
    password: process.env.DB_PASSWORD || 'strongpassword',
    database: process.env.DB_NAME || 'manivtha_crm',
    port: parseInt(process.env.DB_PORT || '3306')
  });

  console.log('Successfully connected to the database.');

  try {
    // 1. Clear tables (optional but useful for reset/fresh seed)
    console.log('Clearing old seed data if it exists...');
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');
    await connection.query('TRUNCATE TABLE bookings');
    await connection.query('TRUNCATE TABLE enquiry_status_history');
    await connection.query('TRUNCATE TABLE enquiry_notes');
    await connection.query('TRUNCATE TABLE enquiries');
    await connection.query('TRUNCATE TABLE users');
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    // 2. Insert Users
    console.log('Seeding users...');
    const adminHash = await bcrypt.hash('admin123', 10);
    const staffHash = await bcrypt.hash('staff123', 10);

    const [adminResult] = await connection.execute(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Manivtha Admin', 'admin@manivtha.com', adminHash, 'admin']
    );

    const [staffResult] = await connection.execute(
      `INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)`,
      ['Booking Executive Sahil', 'staff@manivtha.com', staffHash, 'executive']
    );

    const adminId = adminResult.insertId;
    const staffId = staffResult.insertId;

    console.log(`Users seeded successfully: Admin (ID: ${adminId}), Executive (ID: ${staffId}).`);

    // 3. Insert 5 enquiries spread across status values
    console.log('Seeding enquiries...');
    const todayStr = new Date().toISOString().split('T')[0];
    const threeDaysLater = new Date();
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    const threeDaysLaterStr = threeDaysLater.toISOString().split('T')[0];

    const tenDaysLater = new Date();
    tenDaysLater.setDate(tenDaysLater.getDate() + 10);
    const tenDaysLaterStr = tenDaysLater.toISOString().split('T')[0];

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const pastDateStr = pastDate.toISOString().split('T')[0];

    // Enquiry 1: Status "New", Source "Website", Travel Date soon (Hot Lead - dynamic)
    const [enq1] = await connection.execute(
      `INSERT INTO enquiries (customer_name, phone, email, source, trip_type, pickup_location, drop_location, travel_date, return_date, passengers, special_requirements, status, follow_up_date, assigned_to) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['John Doe', '9876543210', 'john@example.com', 'Website', 'Airport Transfer', 'Majestic Metro Station, Bangalore', 'Kempegowda International Airport', threeDaysLaterStr, null, 2, 'Need clean sedan, luggage boot space', 'New', null, null]
    );

    // Enquiry 2: Status "Contacted", Source "WhatsApp", Travel Date close, Has Note (Hot Lead)
    const [enq2] = await connection.execute(
      `INSERT INTO enquiries (customer_name, phone, email, source, trip_type, pickup_location, drop_location, travel_date, return_date, passengers, special_requirements, status, follow_up_date, assigned_to) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Priya Sharma', '9123456789', 'priya@example.com', 'WhatsApp', 'Round Trip', 'Indiranagar, Bangalore', 'Ooty Hill Station', threeDaysLaterStr, tenDaysLaterStr, 6, 'Prefer Innova Crysta, senior citizens traveling', 'Contacted', todayStr, staffId]
    );

    // Create a note for Enquiry 2
    await connection.execute(
      `INSERT INTO enquiry_notes (enquiry_id, user_id, note) VALUES (?, ?, ?)`,
      [enq2.insertId, staffId, 'Spoke over phone. Customer requested pricing detail for Innova vs Ertiga. Follow up today.']
    );
    await connection.execute(
      `INSERT INTO enquiry_status_history (enquiry_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`,
      [enq2.insertId, 'New', 'Contacted', staffId]
    );

    // Enquiry 3: Status "Confirmed", Source "Phone Call", Travel Date far (Warm/Cold, Booking created)
    const [enq3] = await connection.execute(
      `INSERT INTO enquiries (customer_name, phone, email, source, trip_type, pickup_location, drop_location, travel_date, return_date, passengers, special_requirements, status, follow_up_date, assigned_to) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Rohan Verma', '8877665544', 'rohan@example.com', 'Phone Call', 'One-Way Drop', 'Whitefield, Bangalore', 'Mysore Palace', tenDaysLaterStr, null, 4, 'Need driver fluent in English/Hindi', 'Confirmed', null, staffId]
    );

    await connection.execute(
      `INSERT INTO enquiry_notes (enquiry_id, user_id, note) VALUES (?, ?, ?)`,
      [enq3.insertId, staffId, 'Enquiry confirmed. Booking details logged. Advance payment received.']
    );
    await connection.execute(
      `INSERT INTO enquiry_status_history (enquiry_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`,
      [enq3.insertId, 'New', 'Confirmed', staffId]
    );

    // Create booking for Enquiry 3
    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings (enquiry_id, vehicle_type, driver_name, driver_phone, pickup_datetime, total_amount, advance_paid, payment_status, notes) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [enq3.insertId, 'Toyota Innova Crysta', 'Ramesh Kumar', '9845012345', `${tenDaysLaterStr} 06:00:00`, 8500.00, 2000.00, 'Partial', 'Confirmed sedan service. Driver assigned.']
    );

    // Enquiry 4: Status "Completed", Source "Walk-in", Travel Date past (Cold Lead)
    const [enq4] = await connection.execute(
      `INSERT INTO enquiries (customer_name, phone, email, source, trip_type, pickup_location, drop_location, travel_date, return_date, passengers, special_requirements, status, follow_up_date, assigned_to) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['Anjali Gupta', '9988776655', 'anjali@example.com', 'Walk-in', 'Hill Station', 'Koramangala, Bangalore', 'Coorg resort', pastDateStr, pastDateStr, 5, 'Hill station experience trip', 'Completed', null, adminId]
    );
    await connection.execute(
      `INSERT INTO enquiry_status_history (enquiry_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`,
      [enq4.insertId, 'New', 'Completed', adminId]
    );

    // Enquiry 5: Status "Cancelled", Source "Website", Travel Date in future (Cold Lead)
    const [enq5] = await connection.execute(
      `INSERT INTO enquiries (customer_name, phone, email, source, trip_type, pickup_location, drop_location, travel_date, return_date, passengers, special_requirements, status, follow_up_date, assigned_to) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ['David Miller', '9000111222', 'david@example.com', 'Website', 'Custom', 'Bangalore', 'Hampi ruins tour', tenDaysLaterStr, null, 1, 'Solo traveler travel guide assistance', 'Cancelled', null, adminId]
    );

    await connection.execute(
      `INSERT INTO enquiry_notes (enquiry_id, user_id, note) VALUES (?, ?, ?)`,
      [enq5.insertId, adminId, 'Customer cancelled because their flight was rescheduled.']
    );
    await connection.execute(
      `INSERT INTO enquiry_status_history (enquiry_id, old_status, new_status, changed_by) VALUES (?, ?, ?, ?)`,
      [enq5.insertId, 'New', 'Cancelled', adminId]
    );

    console.log('Enquiries and Notes seeded successfully.');

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await connection.end();
    console.log('Database connection closed.');
  }
}

seed();
