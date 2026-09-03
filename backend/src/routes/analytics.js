const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');
const { 
  getAdminAnalytics, 
  getEventAnalytics, 
  getEventAiInsights 
} = require('../controllers/analyticsController');

// Admin-only platform overview
router.get('/admin/overview', authMiddleware, adminMiddleware, getAdminAnalytics);

// Event-specific analytics & AI insights
router.get('/event/:id', authMiddleware, adminMiddleware, getEventAnalytics);
router.get('/event/:id/ai-insights', authMiddleware, adminMiddleware, getEventAiInsights);

module.exports = router;
