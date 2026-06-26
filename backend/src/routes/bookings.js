const express = require('express');
const router = express.Router();
const bookingsController = require('../controllers/bookings');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, bookingsController.createBooking);
router.get('/', authMiddleware, bookingsController.getBookings);
router.get('/:id/invoice', authMiddleware, bookingsController.getInvoice);
router.patch('/:id', authMiddleware, bookingsController.updateBooking);

module.exports = router;
