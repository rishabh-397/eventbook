require('dotenv').config();
const pool = require('./db');

// Realistic sample events across different categories
const events = [
  { title: 'Coldplay: Music of the Spheres Tour', venue: 'DY Patil Stadium, Mumbai', daysFromNow: 45, price: 3500 },
  { title: 'AR Rahman Live in Concert', venue: 'Jawaharlal Nehru Stadium, Delhi', daysFromNow: 20, price: 2800 },
  { title: 'Arijit Singh — Unplugged', venue: 'Phoenix Arena, Bangalore', daysFromNow: 30, price: 2200 },
  { title: 'Stand-Up Comedy Night ft. Zakir Khan', venue: 'The Habitat, Mumbai', daysFromNow: 10, price: 900 },
  { title: 'IPL Final 2026', venue: 'Narendra Modi Stadium, Ahmedabad', daysFromNow: 60, price: 5000 },
  { title: 'Sunburn Festival', venue: 'Vagator Beach, Goa', daysFromNow: 90, price: 4000 },
  { title: 'Diljit Dosanjh: Dil-Luminati Tour', venue: 'Gachibowli Stadium, Hyderabad', daysFromNow: 25, price: 3000 },
  { title: 'The Local Train — Live', venue: 'Hard Rock Cafe, Pune', daysFromNow: 15, price: 1200 },
  { title: 'NH7 Weekender', venue: 'Mahalaxmi Lawns, Pune', daysFromNow: 75, price: 3200 },
  { title: 'Prateek Kuhad — Acoustic Evening', venue: 'Blue Frog, Mumbai', daysFromNow: 12, price: 1500 },
  { title: 'Broadway Musical: The Lion King', venue: 'NCPA, Mumbai', daysFromNow: 40, price: 2500 },
  { title: 'Comic Con India', venue: 'Bombay Exhibition Centre', daysFromNow: 55, price: 800 },
  { title: 'Zakir Hussain — Tabla Recital', venue: 'Siri Fort Auditorium, Delhi', daysFromNow: 35, price: 1800 },
  { title: 'Sunidhi Chauhan Live', venue: 'EKA Arena, Ahmedabad', daysFromNow: 22, price: 2000 },
  { title: 'Kabir Singh Fan Fest', venue: 'YMCA Grounds, Chennai', daysFromNow: 18, price: 700 },
  { title: 'Vir Das: Netflix Special Taping', venue: 'Canvas Laugh Club, Mumbai', daysFromNow: 8, price: 1600 },
  { title: 'Ranveer Allahbadia Podcast Live', venue: 'Jio World Garden, Mumbai', daysFromNow: 28, price: 1100 },
  { title: 'Classical Fusion Night', venue: 'Nehru Centre, Mumbai', daysFromNow: 33, price: 1300 },
  { title: 'Rock On Reunion Tour', venue: 'Andheri Sports Complex, Mumbai', daysFromNow: 48, price: 2600 },
  { title: 'New Year EDM Night', venue: 'Kingdom of Dreams, Gurugram', daysFromNow: 100, price: 3800 },
];

async function seed() {
  console.log('Seeding events...');

  // Find an admin user to attribute events to (uses your existing test admin)
  const adminResult = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (adminResult.rows.length === 0) {
    console.error('No admin user found. Create one first (set role=admin on a user).');
    process.exit(1);
  }
  const adminId = adminResult.rows[0].id;

  for (const ev of events) {
    const eventTime = new Date(Date.now() + ev.daysFromNow * 24 * 60 * 60 * 1000);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const eventResult = await client.query(
        `INSERT INTO events (title, description, venue, event_time, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [ev.title, `Live event at ${ev.venue}`, ev.venue, eventTime, adminId]
      );
      const eventId = eventResult.rows[0].id;

      // 5 rows x 10 seats = 50 seats per event, same as before
      const rowLetters = 'ABCDE';
      for (let r = 0; r < rowLetters.length; r++) {
        for (let s = 1; s <= 10; s++) {
          await client.query(
            `INSERT INTO seats (event_id, seat_number, price) VALUES ($1, $2, $3)`,
            [eventId, `${rowLetters[r]}${s}`, ev.price]
          );
        }
      }

      await client.query('COMMIT');
      console.log(`✓ Created: ${ev.title}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✗ Failed: ${ev.title}`, err.message);
    } finally {
      client.release();
    }
  }

  console.log('Done seeding!');
  process.exit(0);
}

seed();