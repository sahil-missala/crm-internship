const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard');
const authMiddleware = require('../middleware/auth');

router.get('/stats', authMiddleware, dashboardController.getStats);

module.exports = router;
