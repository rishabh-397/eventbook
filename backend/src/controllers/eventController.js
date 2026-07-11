const pool = require('../config/db');

// Create an event with seats in one go (admin only, checked via middleware)
async function createEvent(req, res) {
  const { title, description, venue, eventTime, seatRows, seatsPerRow, price } = req.body;

  if (!title || !eventTime || !seatRows || !seatsPerRow || !price) {
    return res.status(400).json({ error: 'title, eventTime, seatRows, seatsPerRow, and price are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const eventResult = await client.query(
      `INSERT INTO events (title, description, venue, event_time, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [title, description, venue, eventTime, req.user.id]
    );
    const eventId = eventResult.rows[0].id;

    const rowLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let r = 0; r < seatRows; r++) {
      for (let s = 1; s <= seatsPerRow; s++) {
        const seatNumber = `${rowLetters[r]}${s}`;
        await client.query(
          `INSERT INTO seats (event_id, seat_number, price) VALUES ($1, $2, $3)`,
          [eventId, seatNumber, price]
        );
      }
    }

    await client.query('COMMIT');
    return res.status(201).json({ eventId, totalSeats: seatRows * seatsPerRow });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('createEvent error:', err);
    return res.status(500).json({ error: 'Failed to create event' });
  } finally {
    client.release();
  }
}

// List all upcoming events, optionally filtered by a search term
// (matches against event title or venue, case-insensitive)
async function listEvents(req, res) {
  const { search } = req.query;
  try {
    let query = `SELECT id, title, description, venue, event_time
                  FROM events WHERE event_time > NOW()`;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (title ILIKE $${params.length} OR venue ILIKE $${params.length})`;
    }

    query += ` ORDER BY event_time ASC`;

    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  } catch (err) {
    console.error('listEvents error:', err);
    return res.status(500).json({ error: 'Failed to fetch events' });
  }
}

// Get one event with its full seat map
async function getEventWithSeats(req, res) {
  const { id } = req.params;
  try {
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [id]);
    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const seatsResult = await pool.query(
      `SELECT id, seat_number, price, status FROM seats WHERE event_id = $1 ORDER BY seat_number`,
      [id]
    );

    return res.status(200).json({ event: eventResult.rows[0], seats: seatsResult.rows });
  } catch (err) {
    console.error('getEventWithSeats error:', err);
    return res.status(500).json({ error: 'Failed to fetch event' });
  }
}

module.exports = { createEvent, listEvents, getEventWithSeats };