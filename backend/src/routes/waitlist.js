const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  joinWaitlist, 
  getWaitlistStatus, 
  claimWaitlistOffer 
} = require('../controllers/waitlistController');

router.post('/:id/join', authMiddleware, joinWaitlist);
router.get('/:id/status', authMiddleware, getWaitlistStatus);
router.post('/:id/claim', authMiddleware, claimWaitlistOffer);

module.exports = router;
