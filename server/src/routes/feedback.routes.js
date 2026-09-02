const express = require('express');
const { createFeedback } = require('../controllers/feedback.controller');
const { authMiddleware } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/role.middleware');

const router = express.Router();

router.post('/', authMiddleware, requireRole(['student']), createFeedback);

module.exports = router;
