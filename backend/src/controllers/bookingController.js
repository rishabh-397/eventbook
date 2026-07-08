const pool = require('../config/db');
const { redisClient } = require('../config/redis');
const crypto = require('crypto');

const HOLD_DURATION_SECONDS = 300; // 5 minute hold, like real ticketing sites

/**
 * HOLD SEATS — the core concurrency-critical endpoint.
 *
 * Strategy: distributed lock per seat using Redis SET with NX (only set if
 * not exists) and an expiry (EX). This guarantees only one request can
 * "win" a given seat, even if two users click the same seat in the same
 * millisecond. Redis operations are single-threaded, so SET NX is atomic —
 * no race condition is possible here, unlike a naive
 * "check status, then update status" pattern in plain SQL.
 *
 * Why Redis lock over a DB row lock (SELECT ... FOR UPDATE)?
 * - Faster: in-memory, no DB round trip/transaction overhead per attempt
 * - Auto-expiry: if the app crashes mid-booking, the lock self-releases
 * - Scales better under bursty load (e.g. ticket-drop scenarios)
 * Trade-off: adds an extra moving part (Redis) and needs careful handling
 * if Redis itself goes down (documented in README as a known limitation).
 */
async function holdSeats(req, res) {
  const { eventId, seatIds } = req.body; // seatIds: array of seat IDs
  const userId = req.user.id; // from auth middleware
  const lockToken = crypto.randomUUID(); // unique per request, prevents releasing someone else's lock

  const acquiredLocks = [];

  try {
    // Try to acquire a lock for every requested seat.
    for (const seatId of seatIds) {
      const lockKey = `seat_lock:${seatId}`;
      // NX = only set if key doesn't exist, EX = auto-expire after N seconds
      const result = await redisClient.set(lockKey, lockToken, {
        NX: true,
        EX: HOLD_DURATION_SECONDS,
      });

      if (result === null) {
        // Someone else already holds this seat — roll back any locks
        // we already grabbed in this request, then fail cleanly.
        await releaseLocks(acquiredLocks, lockToken);
        return res.status(409).json({
          error: `Seat ${seatId} is already held by another user`,
        });
      }
      acquiredLocks.push(seatId);
    }

    // Locks acquired in Redis — now create the pending booking in Postgres.
    // This is the source of truth; Redis lock is just the traffic gate.
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const expiresAt = new Date(Date.now() + HOLD_DURATION_SECONDS * 1000);
      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, event_id, status, hold_expires_at)
         VALUES ($1, $2, 'pending', $3) RETURNING id`,
        [userId, eventId, expiresAt]
      );
      const bookingId = bookingResult.rows[0].id;

      for (const seatId of seatIds) {
        await client.query(
          `INSERT INTO booking_seats (booking_id, seat_id) VALUES ($1, $2)`,
          [bookingId, seatId]
        );
        await client.query(
          `UPDATE seats SET status = 'held' WHERE id = $1`,
          [seatId]
        );
      }

      await client.query('COMMIT');

      // Notify everyone else viewing this event that these seats just
      // became unavailable, in real time (Socket.io, wired in server.js)
      req.app.get('io').to(`event:${eventId}`).emit('seats_held', { seatIds });

      return res.status(200).json({ bookingId, expiresAt, lockToken });
    } catch (dbErr) {
      await client.query('ROLLBACK');
      await releaseLocks(acquiredLocks, lockToken);
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('holdSeats error:', err);
    return res.status(500).json({ error: 'Failed to hold seats' });
  }
}

/**
 * CONFIRM BOOKING — mock payment success.
 * Marks the booking + seats as permanently booked, releases the Redis lock
 * (no longer needed once truly booked), and creates a payment record.
 */
async function confirmBooking(req, res) {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      `SELECT * FROM bookings WHERE id = $1 AND user_id = $2`,
      [bookingId, userId]
    );
    const booking = bookingResult.rows[0];

    if (!booking) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Booking is already ${booking.status}` });
    }
    if (new Date(booking.hold_expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(410).json({ error: 'Hold has expired, please book again' });
    }

    const seatsResult = await client.query(
      `SELECT seat_id FROM booking_seats WHERE booking_id = $1`,
      [bookingId]
    );
    const seatIds = seatsResult.rows.map((r) => r.seat_id);

    await client.query(`UPDATE seats SET status = 'booked' WHERE id = ANY($1)`, [seatIds]);
    await client.query(`UPDATE bookings SET status = 'confirmed' WHERE id = $1`, [bookingId]);

    const priceResult = await client.query(
      `SELECT SUM(price) as total FROM seats WHERE id = ANY($1)`,
      [seatIds]
    );
    const totalAmount = priceResult.rows[0].total;

    await client.query(
      `INSERT INTO payments (booking_id, amount, status) VALUES ($1, $2, 'success')`,
      [bookingId, totalAmount]
    );

    await client.query('COMMIT');

    // Locks are no longer needed - seat is permanently booked now
    for (const seatId of seatIds) {
      await redisClient.del(`seat_lock:${seatId}`);
    }

    req.app.get('io').to(`event:${booking.event_id}`).emit('seats_booked', { seatIds });

    return res.status(200).json({ bookingId, status: 'confirmed', amount: totalAmount });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('confirmBooking error:', err);
    return res.status(500).json({ error: 'Failed to confirm booking' });
  } finally {
    client.release();
  }
}

/**
 * CANCEL BOOKING — user changes their mind before confirming/paying.
 * Releases seats back to available and clears the Redis lock immediately,
 * rather than waiting for the cron job to catch the expiry.
 */
async function cancelBooking(req, res) {
  const { bookingId } = req.params;
  const userId = req.user.id;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingResult = await client.query(
      `SELECT * FROM bookings WHERE id = $1 AND user_id = $2`,
      [bookingId, userId]
    );
    const booking = bookingResult.rows[0];

    if (!booking) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: `Cannot cancel a booking that is ${booking.status}` });
    }

    const seatsResult = await client.query(
      `SELECT seat_id FROM booking_seats WHERE booking_id = $1`,
      [bookingId]
    );
    const seatIds = seatsResult.rows.map((r) => r.seat_id);

    await client.query(`UPDATE seats SET status = 'available' WHERE id = ANY($1)`, [seatIds]);
    await client.query(`UPDATE bookings SET status = 'cancelled' WHERE id = $1`, [bookingId]);

    await client.query('COMMIT');

    for (const seatId of seatIds) {
      await redisClient.del(`seat_lock:${seatId}`);
    }

    req.app.get('io').to(`event:${booking.event_id}`).emit('seats_released', { seatIds });

    return res.status(200).json({ bookingId, status: 'cancelled' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('cancelBooking error:', err);
    return res.status(500).json({ error: 'Failed to cancel booking' });
  } finally {
    client.release();
  }
}

// Release Redis locks — only releases locks this request actually owns
// (checked via lockToken) so we never release someone else's valid lock.
async function releaseLocks(seatIds, lockToken) {
  for (const seatId of seatIds) {
    const lockKey = `seat_lock:${seatId}`;
    const currentValue = await redisClient.get(lockKey);
    if (currentValue === lockToken) {
      await redisClient.del(lockKey);
    }
  }
}

module.exports = { holdSeats, releaseLocks, confirmBooking, cancelBooking };