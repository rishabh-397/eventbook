require('dotenv').config();
const pool = require('./db');

const eventTypes = [
  { prefix: 'Live in Concert' },
  { prefix: 'World Tour' },
  { prefix: 'Unplugged' },
  { prefix: 'Stand-Up Comedy Night' },
  { prefix: 'Comedy Special' },
  { prefix: 'Theatre Production' },
  { prefix: 'Dance Recital' },
  { prefix: 'Classical Music Evening' },
  { prefix: 'Film Screening' },
  { prefix: 'Poetry Slam' },
  { prefix: 'Sports Championship' },
  { prefix: 'Fan Convention' },
  { prefix: 'Food & Music Festival' },
  { prefix: 'DJ Night' },
  { prefix: 'Cultural Fest' },
];

const artists = [
  'Coldplay', 'AR Rahman', 'Arijit Singh', 'Zakir Khan', 'Diljit Dosanjh',
  'Prateek Kuhad', 'Sunidhi Chauhan', 'Vir Das', 'Zakir Hussain', 'Shreya Ghoshal',
  'Anirudh Ravichander', 'Ritviz', 'Nucleya', 'Papon', 'KK Tribute',
  'Local Train', 'When Chai Met Toast', 'Parikrama', 'Indian Ocean', 'Euphoria',
  'Kailash Kher', 'Sonu Nigam', 'Shankar Mahadevan', 'Amit Trivedi', 'Jubin Nautiyal',
  'Neha Kakkar', 'Badshah', 'Divine', 'Raftaar', 'Ranveer Allahbadia',
];

// 40+ Indian cities, each with a generic venue name generated below
const cities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad', 'Chennai', 'Pune',
  'Goa', 'Gurugram', 'Kolkata', 'Jaipur', 'Lucknow', 'Chandigarh', 'Indore',
  'Bhopal', 'Nagpur', 'Surat', 'Kochi', 'Coimbatore', 'Visakhapatnam',
  'Patna', 'Ranchi', 'Bhubaneswar', 'Guwahati', 'Dehradun', 'Amritsar',
  'Ludhiana', 'Nashik', 'Vadodara', 'Rajkot', 'Mysuru', 'Thiruvananthapuram',
  'Jodhpur', 'Udaipur', 'Agra', 'Varanasi', 'Shimla', 'Manali', 'Pondicherry',
  'Noida', 'Faridabad', 'Raipur', 'Siliguri',
];

const venueTypes = [
  'Stadium', 'Arena', 'Convention Center', 'Auditorium', 'Amphitheatre',
  'Sports Complex', 'Exhibition Grounds', 'Cultural Centre', 'Club', 'Grounds',
];

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDateUntil2030() {
  const now = Date.now();
  const end2030 = new Date('2030-12-31T23:59:59Z').getTime();
  const randomTime = now + Math.random() * (end2030 - now);
  return new Date(randomTime);
}

function generateEvents(count) {
  const events = [];
  const usedKeys = new Set();

  while (events.length < count) {
    const type = randomFrom(eventTypes);
    const artist = randomFrom(artists);
    const city = randomFrom(cities);
    const venueType = randomFrom(venueTypes);
    const venueName = `${city} ${venueType}`;
    const title = `${artist}: ${type.prefix}`;

    const key = `${title}-${venueName}-${events.length}`;
    if (usedKeys.has(key)) continue;
    usedKeys.add(key);

    events.push({
      title,
      venue: `${venueName}, ${city}`,
      eventTime: randomDateUntil2030(),
      price: [500, 800, 1200, 1500, 2000, 2500, 3000, 3500, 4000, 5000][Math.floor(Math.random() * 10)],
    });
  }

  return events;
}

async function seed() {
  console.log('Seeding 200 additional events across 40+ cities (spread through 2030)...');

  const adminResult = await pool.query(`SELECT id FROM users WHERE role = 'admin' LIMIT 1`);
  if (adminResult.rows.length === 0) {
    console.error('No admin user found. Create one first (set role=admin on a user).');
    process.exit(1);
  }
  const adminId = adminResult.rows[0].id;

  const events = generateEvents(100);
  let successCount = 0;

  for (const ev of events) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const eventResult = await client.query(
        `INSERT INTO events (title, description, venue, event_time, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [ev.title, `Live event at ${ev.venue}`, ev.venue, ev.eventTime, adminId]
      );
      const eventId = eventResult.rows[0].id;

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
      successCount++;
      if (successCount % 25 === 0) console.log(`  ...${successCount} events created so far`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`✗ Failed: ${ev.title}`, err.message);
    } finally {
      client.release();
    }
  }

  console.log(`Done! Created ${successCount} new events across 40+ cities, dated up to Dec 2030.`);
  process.exit(0);
}

seed();