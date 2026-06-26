const express = require('express');
const router = express.Router();
const enquiriesController = require('../controllers/enquiries');
const authMiddleware = require('../middleware/auth');
const { validateEnquiry } = require('../middleware/validate');

// Public route for customer enquiry submission
router.post('/', validateEnquiry, enquiriesController.createEnquiry);

// Protected routes (require JWT verification)
router.get('/', authMiddleware, enquiriesController.getEnquiries);
router.get('/followups/today', authMiddleware, enquiriesController.getFollowUpsToday);
router.get('/:id', authMiddleware, enquiriesController.getEnquiryById);
router.patch('/:id/status', authMiddleware, enquiriesController.updateEnquiryStatus);
router.patch('/:id/followup', authMiddleware, enquiriesController.updateEnquiryFollowUp);
router.post('/:id/notes', authMiddleware, enquiriesController.addEnquiryNote);
router.patch('/:id', authMiddleware, enquiriesController.updateEnquiryDetails);
router.post('/:id/message', authMiddleware, enquiriesController.sendCustomerMessage);
router.patch('/:id/telegram', authMiddleware, enquiriesController.linkTelegramChatId);

module.exports = router;
