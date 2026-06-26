const express = require('express');
const cors = require('cors');
const errorHandler = require('./src/middleware/errorHandler');

// Import routes
const authRoutes = require('./src/routes/auth');
const enquiriesRoutes = require('./src/routes/enquiries');
const bookingsRoutes = require('./src/routes/bookings');
const dashboardRoutes = require('./src/routes/dashboard');
const notificationsRoutes = require('./src/routes/notifications');

const app = express();

// Configure CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5175',
  credentials: true
}));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
  });
}

// Bind API routes
app.use('/api/auth', authRoutes);
app.use('/api/enquiries', enquiriesRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationsRoutes);

// Base route test
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date() });
});

// Mount global error handler (Must be placed after all routes)
app.use(errorHandler);

module.exports = app;
