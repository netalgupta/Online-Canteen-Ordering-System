const express = require('express');
const { getAvailableSlots } = require('../controllers/slots.controller');

const router = express.Router();

router.get('/available', getAvailableSlots);

module.exports = router;
