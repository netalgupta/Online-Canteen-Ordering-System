const express = require('express');
const { 
  getAnalyticsOverview, 
  getAnalyticsHourly, 
  getAnalyticsPopularItems, 
  getAnalyticsPerformance, 
  getUsers, 
  updateUser, 
  getSettings, 
  updateSettings,
  getFeedback
} = require('../controllers/admin.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

router.use(authMiddleware, requireRole(['admin']));

router.get('/analytics/overview', getAnalyticsOverview);
router.get('/analytics/hourly', getAnalyticsHourly);
router.get('/analytics/popular-items', getAnalyticsPopularItems);
router.get('/analytics/performance', getAnalyticsPerformance);
router.get('/users', getUsers);
router.patch('/users/:id', updateUser);
router.get('/settings', getSettings);
router.put('/settings', updateSettings);
router.get('/feedback', getFeedback);

module.exports = router;
