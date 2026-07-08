const cron = require('node-cron');
const pool = require('../config/db');
const { redisClient } = require('../config/redis');

/**
 * Runs every 30 seconds. Finds bookings whose 5-minute hold has expired
 * without payment, releases the seats back to 'available', and clears
 * any leftover Redis locks (in case the natural TTL hasn't fired yet).
 *
 * Why a cron job instead of relying purely on Redis TTL expiry?
 * Redis TTL only clears the *lock* - it doesn't know about Postgres
 * booking/seat rows, so we still need a sweep to keep the DB consistent
 * with reality. This is the standard pattern for "soft hold" systems.
 */
function startExpiredHoldsJob(io) {
  cron.schedule('*/30 * * * * *', async () => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const expired = await client.query(
        `SELECT id, event_id FROM bookings
         WHERE status = 'pending' AND hold_expires_at < NOW()`
      );

      for (const booking of expired.rows) {
        const seatsResult = await client.query(
          `SELECT seat_id FROM booking_seats WHERE booking_id = $1`,
          [booking.id]
        );
        const seatIds = seatsResult.rows.map((r) => r.seat_id);

        await client.query(
          `UPDATE seats SET status = 'available' WHERE id = ANY($1)`,
          [seatIds]
        );
        await client.query(
          `UPDATE bookings SET status = 'expired' WHERE id = $1`,
          [booking.id]
        );

        for (const seatId of seatIds) {
          await redisClient.del(`seat_lock:${seatId}`);
        }

        io.to(`event:${booking.event_id}`).emit('seats_released', { seatIds });
      }

      await client.query('COMMIT');
      if (expired.rows.length > 0) {
        console.log(`Released ${expired.rows.length} expired booking(s)`);
      }
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('releaseExpiredHolds job error:', err);
    } finally {
      client.release();
    }
  });
}

module.exports = { startExpiredHoldsJob };
