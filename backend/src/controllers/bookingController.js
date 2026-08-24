const pool = require('../config/db');
const { redisClient } = require('../config/redis');
const crypto = require('crypto');
const { sendBookingConfirmation } = require('../config/email');
const genAI = require('../config/ai');

const HOLD_DURATION_SECONDS = 300; // 5 minute hold, like real ticketing sites

/**
 * HOLD SEATS — the core concurrency-critical endpoint.
 * Uses Redis SET NX (atomic) as a distributed lock so two users can never
 * both successfully hold the same seat, even under simultaneous requests.
 */
async function holdSeats(req, res) {
  const { eventId, seatIds } = req.body;
  const userId = req.user.id;
  const idempotencyKey = req.headers['idempotency-key'];

  if (!idempotencyKey) {
    return res.status(400).json({ error: 'Idempotency-Key header is required' });
  }

  const client = await pool.connect();

  try {
    // Check for existing idempotent request
    const existingResult = await client.query(
      `SELECT id, hold_expires_at FROM bookings WHERE idempotency_key = $1 AND user_id = $2`,
      [idempotencyKey, userId]
    );

    if (existingResult.rows.length > 0) {
      return res.status(200).json({
        bookingId: existingResult.rows[0].id,
        expiresAt: existingResult.rows[0].hold_expires_at,
        lockToken: 'idempotent-replay',
      });
    }

    const lockToken = crypto.randomUUID();
    const acquiredLocks = [];

    try {
      for (const seatId of seatIds) {
        const lockKey = `seat_lock:${seatId}`;
        const result = await redisClient.set(lockKey, lockToken, {
          NX: true,
          EX: HOLD_DURATION_SECONDS,
        });

        if (result === null) {
          await releaseLocks(acquiredLocks, lockToken);
          return res.status(409).json({
            error: `Seat ${seatId} is already held by another user`,
          });
        }
        acquiredLocks.push(seatId);
      }

      await client.query('BEGIN');

      const expiresAt = new Date(Date.now() + HOLD_DURATION_SECONDS * 1000);

      const bookingResult = await client.query(
        `INSERT INTO bookings (user_id, event_id, status, hold_expires_at, idempotency_key)
         VALUES ($1, $2, 'pending', $3, $4) RETURNING id`,
        [userId, eventId, expiresAt, idempotencyKey]
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

      req.app.get('io').to(`event:${eventId}`).emit('seats_held', { seatIds });

      return res.status(200).json({
        bookingId,
        expiresAt,
        lockToken,
      });
    } catch (dbErr) {
      await client.query('ROLLBACK');
      await releaseLocks(acquiredLocks, lockToken);
      throw dbErr;
    }
  } catch (err) {
    console.error('holdSeats error:', err);
    return res.status(500).json({ error: 'Failed to hold seats' });
  } finally {
    client.release();
  }
}

/**
 * CONFIRM BOOKING — mock payment success.
 * Marks the booking + seats as permanently booked, releases the Redis lock,
 * creates a payment record, and sends a confirmation email.
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
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    if (booking.status === 'confirmed') {
      await client.query('ROLLBACK');
      return res.status(200).json({
        bookingId,
        status: 'confirmed',
        message: 'Booking was already confirmed (idempotent replay)',
      });
    }

    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Booking is already ${booking.status}`,
      });
    }

    if (new Date(booking.hold_expires_at) < new Date()) {
      await client.query('ROLLBACK');
      return res.status(410).json({
        error: 'Hold has expired, please book again',
      });
    }

    const seatsResult = await client.query(
      `SELECT id, seat_number, price FROM seats WHERE id IN
       (SELECT seat_id FROM booking_seats WHERE booking_id = $1)`,
      [bookingId]
    );

    const seatIds = seatsResult.rows.map((r) => r.id);
    const seatNumbers = seatsResult.rows.map((r) => r.seat_number);

    await client.query(
      `UPDATE seats SET status = 'booked' WHERE id = ANY($1)`,
      [seatIds]
    );

    await client.query(
      `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
      [bookingId]
    );

    const totalAmount = seatsResult.rows.reduce(
      (sum, s) => sum + Number(s.price),
      0
    );

    await client.query(
      `INSERT INTO payments (booking_id, amount, status)
       VALUES ($1, $2, 'success')`,
      [bookingId, totalAmount]
    );

    const userResult = await client.query(
      `SELECT name, email FROM users WHERE id = $1`,
      [userId]
    );

    const eventResult = await client.query(
      `SELECT title, venue, event_time FROM events WHERE id = $1`,
      [booking.event_id]
    );

    const user = userResult.rows[0];
    const eventDetails = eventResult.rows[0];

    await client.query('COMMIT');

    for (const seatId of seatIds) {
      await redisClient.del(`seat_lock:${seatId}`);
    }

    req.app
      .get('io')
      .to(`event:${booking.event_id}`)
      .emit('seats_booked', { seatIds });

    sendBookingConfirmation({
      toEmail: user.email,
      toName: user.name,
      eventTitle: eventDetails.title,
      venue: eventDetails.venue,
      eventTime: eventDetails.event_time,
      seatNumbers,
      amount: totalAmount,
      bookingId,
    });

    return res.status(200).json({
      bookingId,
      status: 'confirmed',
      amount: totalAmount,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('confirmBooking error:', err);

    return res.status(500).json({
      error: 'Failed to confirm booking',
    });
  } finally {
    client.release();
  }
}

/**
 * CANCEL BOOKING — user changes their mind before confirming/paying.
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
      return res.status(404).json({
        error: 'Booking not found',
      });
    }

    if (booking.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: `Cannot cancel a booking that is ${booking.status}`,
      });
    }

    const seatsResult = await client.query(
      `SELECT seat_id FROM booking_seats WHERE booking_id = $1`,
      [bookingId]
    );

    const seatIds = seatsResult.rows.map((r) => r.seat_id);

    await client.query(
      `UPDATE seats SET status = 'available' WHERE id = ANY($1)`,
      [seatIds]
    );

    await client.query(
      `UPDATE bookings SET status = 'cancelled' WHERE id = $1`,
      [bookingId]
    );

    await client.query('COMMIT');

    for (const seatId of seatIds) {
      await redisClient.del(`seat_lock:${seatId}`);
    }

    req.app
      .get('io')
      .to(`event:${booking.event_id}`)
      .emit('seats_released', { seatIds });

    return res.status(200).json({
      bookingId,
      status: 'cancelled',
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('cancelBooking error:', err);

    return res.status(500).json({
      error: 'Failed to cancel booking',
    });
  } finally {
    client.release();
  }
}

/**
 * GET USER'S BOOKINGS — for the "My Bookings" page.
 * Returns all bookings for the logged-in user with event + seat details.
 */
async function getMyBookings(req, res) {
  const userId = req.user.id;

  try {
    const result = await pool.query(
      `SELECT
         b.id AS booking_id, b.status, b.hold_expires_at, b.created_at,
         e.title AS event_title, e.venue, e.event_time,
         ARRAY_AGG(s.seat_number ORDER BY s.seat_number) AS seat_numbers,
         SUM(s.price) AS total_amount
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       JOIN booking_seats bs ON bs.booking_id = b.id
       JOIN seats s ON s.id = bs.seat_id
       WHERE b.user_id = $1
       GROUP BY b.id, e.title, e.venue, e.event_time
       ORDER BY b.created_at DESC`,
      [userId]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('getMyBookings error:', err);

    return res.status(500).json({
      error: 'Failed to fetch bookings',
    });
  }
}

/**
 * AI-powered recommendations: looks at what the user has booked before,
 * asks Gemini to suggest which upcoming events (from the real catalog)
 * they'd likely enjoy, and why. Grounded in actual DB data - the model
 * picks from a provided list rather than inventing events.
 */
async function getRecommendations(req, res) {
  const userId = req.user.id;

  try {
    const historyResult = await pool.query(
      `SELECT DISTINCT ON (e.title, e.venue) e.title, e.venue, b.created_at
       FROM bookings b
       JOIN events e ON b.event_id = e.id
       WHERE b.user_id = $1 AND b.status = 'confirmed'
       ORDER BY e.title, e.venue, b.created_at DESC
       LIMIT 10`,
      [userId]
    );

    // No booking history yet - nothing meaningful to recommend from
    if (historyResult.rows.length === 0) {
      return res.status(200).json({
        recommendations: [],
      });
    }

    const upcomingResult = await pool.query(`
      SELECT id, title, venue, event_time
      FROM events
      WHERE event_time > NOW()
      ORDER BY event_time ASC
      LIMIT 100
    `);

    const historyText = historyResult.rows
      .map((h) => `"${h.title}" at ${h.venue}`)
      .join(', ');

    const catalogText = upcomingResult.rows
      .map((e) => `ID ${e.id}: "${e.title}" at ${e.venue}`)
      .join('\n');

    const model = genAI.getGenerativeModel({
      model: 'gemini-3.6-flash',
    });

    const prompt = `A user has previously booked: ${historyText}.

From this catalog of upcoming events, pick up to 4 the user would most likely enjoy, based on similar genre/artist/vibe. Return ONLY a JSON array of event IDs, nothing else, e.g. [3,17,42]. If nothing fits well, return [].

Catalog:
${catalogText}`;

    const result = await model.generateContent(prompt);

    const raw = result.response
      .text()
      .replace(/```json|```/g, '')
      .trim();

    const recommendedIds = JSON.parse(raw);

    if (
      !Array.isArray(recommendedIds) ||
      recommendedIds.length === 0
    ) {
      return res.status(200).json({
        recommendations: [],
      });
    }

    const recommended = upcomingResult.rows.filter((e) =>
      recommendedIds.includes(e.id)
    );

    return res.status(200).json({
      recommendations: recommended,
    });
  } catch (err) {
    console.error('getRecommendations error:', err);

    return res.status(200).json({
      recommendations: [],
    });
  }
}

// Release Redis locks — only releases locks this request actually owns
async function releaseLocks(seatIds, lockToken) {
  for (const seatId of seatIds) {
    const lockKey = `seat_lock:${seatId}`;
    const currentValue = await redisClient.get(lockKey);

    if (currentValue === lockToken) {
      await redisClient.del(lockKey);
    }
  }
}

async function validateTicket(req, res) {
  const { bookingId } = req.body;
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Only admins can validate tickets' });
  }

  try {
    const result = await pool.query(
      `UPDATE bookings 
       SET scanned_at = NOW() 
       WHERE id = $1 AND status = 'confirmed' AND scanned_at IS NULL
       RETURNING id`,
      [bookingId]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Ticket invalid, already scanned, or not confirmed' });
    }

    return res.status(200).json({ message: 'Ticket validated successfully' });
  } catch (err) {
    console.error('validateTicket error:', err);
    return res.status(500).json({ error: 'Failed to validate ticket' });
  }
}

module.exports = {
  holdSeats,
  releaseLocks,
  confirmBooking,
  cancelBooking,
  getMyBookings,
  getRecommendations,
  validateTicket,
};