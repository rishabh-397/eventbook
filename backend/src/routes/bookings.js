const express = require('express');
const router = express.Router();
const { holdSeats } = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

// Must be logged in to hold seats
router.post('/hold', authMiddleware, holdSeats);

module.exports = router;