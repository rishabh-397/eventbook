const express = require('express');

const router = express.Router();

const {
  holdSeats,
  confirmBooking,
  cancelBooking,
  getMyBookings,
  getRecommendations,
  validateTicket
} = require('../controllers/bookingController');

const authMiddleware = require('../middleware/authMiddleware');

router.get('/mine', authMiddleware, getMyBookings);
router.get('/recommendations', authMiddleware, getRecommendations);
router.post('/hold', authMiddleware, holdSeats);
router.post('/:bookingId/confirm', authMiddleware, confirmBooking);
router.post('/:bookingId/cancel', authMiddleware, cancelBooking);
router.post('/validate', authMiddleware, validateTicket);

module.exports = router;