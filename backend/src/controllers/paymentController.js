const pool = require('../config/db');
const { redisClient } = require('../config/redis');
const crypto = require('crypto');
const { sendBookingConfirmation } = require('../config/email');

const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'whsec_test_eventbook_secret_key_2026';

/**
 * Creates a payment order / session for a held booking
 */
async function createPaymentOrder(req, res) {
  const { bookingId } = req.body;
  const userId = req.user.id;

  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId is required' });
  }

  const client = await pool.connect();
  try {
    const bookingRes = await client.query(
      `SELECT b.*, e.title as event_title, e.venue, e.event_time 
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );

    if (bookingRes.rows.length === 0) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];

    if (booking.status === 'confirmed') {
      return res.status(400).json({ error: 'Booking is already confirmed' });
    }

    if (booking.status === 'expired' || new Date(booking.hold_expires_at) <= new Date()) {
      return res.status(410).json({ error: 'Hold has expired. Please select seats again.' });
    }

    // Get held seats & calculate total
    const seatsRes = await client.query(
      `SELECT s.id, s.seat_number, s.price 
       FROM booking_seats bs 
       JOIN seats s ON s.id = bs.seat_id 
       WHERE bs.booking_id = $1`,
      [bookingId]
    );

    const totalAmount = seatsRes.rows.reduce((sum, s) => sum + Number(s.price), 0);
    const orderId = `ord_test_${crypto.randomBytes(10).toString('hex')}`;
    const clientSecret = `pi_test_${crypto.randomBytes(16).toString('hex')}_secret_${crypto.randomBytes(8).toString('hex')}`;

    // Upsert payment row
    await client.query(
      `INSERT INTO payments (booking_id, amount, status, provider, provider_order_id, currency)
       VALUES ($1, $2, 'pending', 'stripe_test', $3, 'INR')
       ON CONFLICT DO NOTHING`,
      [bookingId, totalAmount, orderId]
    );

    return res.status(200).json({
      orderId,
      clientSecret,
      amount: totalAmount,
      currency: 'INR',
      bookingId,
      expiresAt: booking.hold_expires_at,
      event: {
        title: booking.event_title,
        venue: booking.venue,
        eventTime: booking.event_time,
      },
      seats: seatsRes.rows.map(s => s.seat_number)
    });
  } catch (err) {
    console.error('createPaymentOrder error:', err);
    return res.status(500).json({ error: 'Failed to create payment order' });
  } finally {
    client.release();
  }
}

/**
 * Verifies payment and executes the Saga confirmation
 */
async function verifyPayment(req, res) {
  const { bookingId, orderId, paymentMethod, testCardNumber } = req.body;
  const userId = req.user.id;

  if (!bookingId) {
    return res.status(400).json({ error: 'bookingId is required' });
  }

  // Simulate gateway failure if test card ends with 0000 or specific decline code
  if (testCardNumber && testCardNumber.endsWith('0000')) {
    return res.status(402).json({
      error: 'Card declined: Insufficient funds or card disabled for online transactions.'
    });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const bookingRes = await client.query(
      `SELECT b.*, e.title as event_title, e.venue, e.event_time 
       FROM bookings b
       JOIN events e ON e.id = b.event_id
       WHERE b.id = $1 AND b.user_id = $2`,
      [bookingId, userId]
    );

    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Booking not found' });
    }

    const booking = bookingRes.rows[0];

    // Idempotent replay if already confirmed
    if (booking.status === 'confirmed') {
      await client.query('COMMIT');
      return res.status(200).json({
        success: true,
        bookingId,
        status: 'confirmed',
        message: 'Payment already processed and booking confirmed.'
      });
    }

    if (booking.status === 'expired' || new Date(booking.hold_expires_at) <= new Date()) {
      await client.query('ROLLBACK');
      return res.status(410).json({ error: 'Hold expired before payment could complete' });
    }

    const seatsRes = await client.query(
      `SELECT s.id, s.seat_number, s.price 
       FROM booking_seats bs 
       JOIN seats s ON s.id = bs.seat_id 
       WHERE bs.booking_id = $1`,
      [bookingId]
    );

    const seatIds = seatsRes.rows.map(s => s.id);
    const seatNumbers = seatsRes.rows.map(s => s.seat_number);
    const totalAmount = seatsRes.rows.reduce((sum, s) => sum + Number(s.price), 0);
    const paymentId = `pay_test_${crypto.randomBytes(12).toString('hex')}`;

    // 1. Mark booking confirmed
    await client.query(
      `UPDATE bookings SET status = 'confirmed' WHERE id = $1`,
      [bookingId]
    );

    // 2. Mark seats booked
    await client.query(
      `UPDATE seats SET status = 'booked' WHERE id = ANY($1)`,
      [seatIds]
    );

    // 3. Update payment record
    await client.query(
      `UPDATE payments 
       SET status = 'success', 
           provider_payment_id = $1,
           provider_order_id = COALESCE($2, provider_order_id)
       WHERE booking_id = $3`,
      [paymentId, orderId || null, bookingId]
    );

    // 4. Fetch user details for confirmation email
    const userRes = await client.query(`SELECT name, email FROM users WHERE id = $1`, [userId]);
    const user = userRes.rows[0];

    await client.query('COMMIT');

    // 5. Release Redis locks
    for (const seatId of seatIds) {
      await redisClient.del(`seat_lock:${seatId}`);
    }

    // 6. Real-time broadcast to all viewers
    const io = req.app.get('io');
    if (io) {
      io.to(`event:${booking.event_id}`).emit('seats_booked', { seatIds });
    }

    // 7. Send confirmation email asynchronously
    sendBookingConfirmation({
      toEmail: user.email,
      toName: user.name,
      eventTitle: booking.event_title,
      venue: booking.venue,
      eventTime: booking.event_time,
      seatNumbers,
      amount: totalAmount,
      bookingId
    });

    return res.status(200).json({
      success: true,
      bookingId,
      paymentId,
      amount: totalAmount,
      status: 'confirmed',
      seatNumbers
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('verifyPayment error:', err);
    return res.status(500).json({ error: 'Payment processing failed' });
  } finally {
    client.release();
  }
}

/**
 * Webhook handler for asynchronous payment gateway events
 */
async function handleWebhook(req, res) {
  const signature = req.headers['x-webhook-signature'] || req.headers['stripe-signature'];
  const payload = req.body;

  // Verify HMAC-SHA256 signature
  if (signature) {
    const computedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    if (signature !== computedSignature && !signature.includes(computedSignature)) {
      console.warn('⚠️ Webhook signature mismatch');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }
  }

  const eventType = payload.type || payload.event;
  const bookingId = payload.data?.bookingId || payload.data?.object?.metadata?.bookingId;

  console.log(`🔔 Received payment webhook: ${eventType} for booking: ${bookingId}`);

  if (eventType === 'payment.succeeded' || eventType === 'payment_intent.succeeded') {
    if (bookingId) {
      // Confirm booking asynchronously if not already confirmed
      try {
        await pool.query(
          `UPDATE bookings SET status = 'confirmed' WHERE id = $1 AND status = 'pending'`,
          [bookingId]
        );
        await pool.query(
          `UPDATE payments SET status = 'success' WHERE booking_id = $1`,
          [bookingId]
        );
      } catch (e) {
        console.error('Webhook async confirm error:', e);
      }
    }
  }

  return res.status(200).json({ received: true });
}

module.exports = {
  createPaymentOrder,
  verifyPayment,
  handleWebhook
};
