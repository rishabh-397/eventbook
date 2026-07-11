const express = require('express');
const router = express.Router();
const { createEvent, listEvents, getEventWithSeats, getAdminEventsSummary } = require('../controllers/eventController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/', listEvents);
router.get('/admin/summary', authMiddleware, adminMiddleware, getAdminEventsSummary);
router.get('/:id', getEventWithSeats);
router.post('/', authMiddleware, adminMiddleware, createEvent);

module.exports = router;