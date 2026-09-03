const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { 
  createPaymentOrder, 
  verifyPayment, 
  handleWebhook 
} = require('../controllers/paymentController');

// User authenticated routes
router.post('/create-order', authMiddleware, createPaymentOrder);
router.post('/verify', authMiddleware, verifyPayment);

// Gateway webhook endpoint (no auth token, uses cryptographic signature verification)
router.post('/webhook', handleWebhook);

module.exports = router;
