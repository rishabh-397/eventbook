const pool = require('../config/db');
const { redisClient } = require('../config/redis');
const crypto = require('crypto');

/**
 * Join waitlist for a sold-out event
 */
async function joinWaitlist(req, res) {
  const { id: eventId } = req.params;
  const userId = req.user.id;
  const { seatsRequested = 1 } = req.body;

  const client = await pool.connect();
  try {
    // Check if event exists
    const eventRes = await client.query('SELECT title FROM events WHERE id = $1', [eventId]);
    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check available seats count
    const seatsRes = await client.query(
      `SELECT COUNT(*) as available FROM seats WHERE event_id = $1 AND status = 'available'`,
      [eventId]
    );

    const available = Number(seatsRes.rows[0].available);
    if (available > 0) {
      return res.status(400).json({ 
        error: `Seats are currently available (${available} left). Please book directly from the seat map.` 
      });
    }

    // Check existing active waitlist entry
    const existing = await client.query(
      `SELECT * FROM waitlist 
       WHERE event_id = $1 AND user_id = $2 AND status IN ('waiting', 'offered')`,
      [eventId, userId]
    );

    if (existing.rows.length > 0) {
      const entry = existing.rows[0];
      const posRes = await client.query(
        `SELECT COUNT(*) as position FROM waitlist 
         WHERE event_id = $1 AND status = 'waiting' AND created_at <= $2`,
        [eventId, entry.created_at]
      );
      return res.status(200).json({
        message: 'You are already on the waitlist',
        position: Number(posRes.rows[0].position),
        status: entry.status,
        offerExpiresAt: entry.offer_expires_at
      });
    }

    // Insert new waitlist row
    const insertRes = await client.query(
      `INSERT INTO waitlist (event_id, user_id, seats_requested, status)
       VALUES ($1, $2, $3, 'waiting') RETURNING id, created_at`,
      [eventId, userId, Math.min(Math.max(Number(seatsRequested), 1), 4)]
    );

    // Calculate queue position
    const posRes = await client.query(
      `SELECT COUNT(*) as position FROM waitlist 
       WHERE event_id = $1 AND status = 'waiting' AND created_at <= $2`,
      [eventId, insertRes.rows[0].created_at]
    );

    return res.status(201).json({
      message: 'Successfully joined waitlist',
      position: Number(posRes.rows[0].position),
      seatsRequested
    });
  } catch (err) {
    console.error('joinWaitlist error:', err);
    return res.status(500).json({ error: 'Failed to join waitlist' });
  } finally {
    client.release();
  }
}

/**
 * Get current waitlist status for the authenticated user on an event
 */
async function getWaitlistStatus(req, res) {
  const { id: eventId } = req.params;
  const userId = req.user.id;

  try {
    const entryRes = await pool.query(
      `SELECT w.*, e.title as event_title 
       FROM waitlist w
       JOIN events e ON e.id = w.event_id
       WHERE w.event_id = $1 AND w.user_id = $2 AND w.status IN ('waiting', 'offered')
       ORDER BY w.created_at DESC LIMIT 1`,
      [eventId, userId]
    );

    if (entryRes.rows.length === 0) {
      // Return total queue size even if user not in queue
      const countRes = await pool.query(
        `SELECT COUNT(*) as total_waiting FROM waitlist WHERE event_id = $1 AND status = 'waiting'`,
        [eventId]
      );
      return res.status(200).json({
        inWaitlist: false,
        totalWaiting: Number(countRes.rows[0].total_waiting)
      });
    }

    const entry = entryRes.rows[0];

    // Check if offer has expired
    if (entry.status === 'offered' && new Date(entry.offer_expires_at) <= new Date()) {
      await pool.query(`UPDATE waitlist SET status = 'expired' WHERE id = $1`, [entry.id]);
      return res.status(200).json({ inWaitlist: false, offerExpired: true });
    }

    const posRes = await pool.query(
      `SELECT COUNT(*) as position FROM waitlist 
       WHERE event_id = $1 AND status = 'waiting' AND created_at <= $2`,
      [eventId, entry.created_at]
    );

    return res.status(200).json({
      inWaitlist: true,
      status: entry.status,
      position: Number(posRes.rows[0].position),
      offerExpiresAt: entry.offer_expires_at,
      reservationToken: entry.reservation_token
    });
  } catch (err) {
    console.error('getWaitlistStatus error:', err);
    return res.status(500).json({ error: 'Failed to fetch waitlist status' });
  }
}

/**
 * Claim an active waitlist offer and convert to a checkout booking
 */
async function claimWaitlistOffer(req, res) {
  const { id: eventId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const entryRes = await client.query(
      `SELECT * FROM waitlist 
       WHERE event_id = $1 AND user_id = $2 AND status = 'offered' AND offer_expires_at > NOW()`,
      [eventId, userId]
    );

    if (entryRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'No active waitlist offer found or offer has expired.' });
    }

    const entry = entryRes.rows[0];

    // Find available seats for this event
    const seatRes = await client.query(
      `SELECT id, seat_number, price FROM seats 
       WHERE event_id = $1 AND status = 'available' 
       ORDER BY seat_number ASC LIMIT $2 FOR UPDATE`,
      [eventId, entry.seats_requested || 1]
    );

    if (seatRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Seat is no longer available.' });
    }

    const seatIds = seatRes.rows.map(s => s.id);
    const holdDuration = 300; // 5 min
    const expiresAt = new Date(Date.now() + holdDuration * 1000);

    // Create booking
    const bookingRes = await client.query(
      `INSERT INTO bookings (user_id, event_id, status, hold_expires_at, idempotency_key)
       VALUES ($1, $2, 'pending', $3, $4) RETURNING id`,
      [userId, eventId, expiresAt, `waitlist_${entry.id}`]
    );

    const bookingId = bookingRes.rows[0].id;

    // Link booking seats & set seats status to held
    for (const seatId of seatIds) {
      await client.query(
        `INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1, $2)`,
        [bookingId, seatId]
      );
      await client.query(
        `UPDATE seats SET status = 'held' WHERE id = $1`,
        [seatId]
      );
      // Lock in Redis
      await redisClient.set(`seat_lock:${seatId}`, `booking:${bookingId}`, {
        NX: true,
        EX: holdDuration
      });
    }

    // Mark waitlist entry as claimed
    await client.query(
      `UPDATE waitlist SET status = 'claimed' WHERE id = $1`,
      [entry.id]
    );

    await client.query('COMMIT');

    // Notify other viewers
    const io = req.app.get('io');
    if (io) {
      io.to(`event:${eventId}`).emit('seats_held', { seatIds });
    }

    return res.status(200).json({
      success: true,
      bookingId,
      expiresAt,
      seatNumbers: seatRes.rows.map(s => s.seat_number)
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('claimWaitlistOffer error:', err);
    return res.status(500).json({ error: 'Failed to claim waitlist offer' });
  } finally {
    client.release();
  }
}

/**
 * Helper called when seats are released from an expired hold or cancellation.
 * Hands off the newly freed seats to the #1 waiting user.
 */
async function offerFreedSeatsToWaitlist(eventId, io) {
  try {
    // Find next user waiting in line
    const nextRes = await pool.query(
      `SELECT w.*, u.name, u.email, e.title as event_title
       FROM waitlist w
       JOIN users u ON u.id = w.user_id
       JOIN events e ON e.id = w.event_id
       WHERE w.event_id = $1 AND w.status = 'waiting'
       ORDER BY w.created_at ASC LIMIT 1`,
      [eventId]
    );

    if (nextRes.rows.length === 0) return;

    const nextUser = nextRes.rows[0];
    const reservationToken = `res_wl_${crypto.randomBytes(12).toString('hex')}`;
    const offerExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min window

    await pool.query(
      `UPDATE waitlist 
       SET status = 'offered', 
           reservation_token = $1, 
           offer_expires_at = $2 
       WHERE id = $3`,
      [reservationToken, offerExpiresAt, nextUser.id]
    );

    console.log(`🎟️ Offered waitlist seat to user ${nextUser.email} for event "${nextUser.event_title}"`);

    // Broadcast notification to event room or specific user
    if (io) {
      io.to(`event:${eventId}`).emit('waitlist_opportunity', {
        userId: nextUser.user_id,
        eventId,
        offerExpiresAt
      });
    }
  } catch (err) {
    console.error('offerFreedSeatsToWaitlist error:', err);
  }
}

module.exports = {
  joinWaitlist,
  getWaitlistStatus,
  claimWaitlistOffer,
  offerFreedSeatsToWaitlist
};
