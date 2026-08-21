const express = require('express');
const router = express.Router();
const { chatWithAssistant } = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, chatWithAssistant);

module.exports = router;