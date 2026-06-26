const express = require('express');
const router = express.Router();
const notificationsController = require('../controllers/notifications');
const authMiddleware = require('../middleware/auth');

router.post('/telegram/test', authMiddleware, notificationsController.sendTestNotification);
router.get('/status', authMiddleware, notificationsController.getIntegrationStatus);

// Public webhooks for external messaging platforms
router.post('/telegram/webhook', notificationsController.handleTelegramWebhook);
router.post('/whatsapp/webhook', notificationsController.handleWhatsAppWebhook);

module.exports = router;
