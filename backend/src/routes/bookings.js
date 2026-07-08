const express = require('express');
const router = express.Router();
const { holdSeats, confirmBooking, cancelBooking } = require('../controllers/bookingController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/hold', authMiddleware, holdSeats);
router.post('/:bookingId/confirm', authMiddleware, confirmBooking);
router.post('/:bookingId/cancel', authMiddleware, cancelBooking);

module.exports = router;