require('dotenv').config();
const pool = require('./db');

// Approximate coordinates for each city used in your seed data.
// Real-world accuracy isn't critical here - these just need to be
// "close enough" to put a correct pin on the map for demo purposes.
const cityCoordinates = {
  'Mumbai': [19.0760, 72.8777],
  'Delhi': [28.7041, 77.1025],
  'Bangalore': [12.9716, 77.5946],
  'Hyderabad': [17.3850, 78.4867],
  'Ahmedabad': [23.0225, 72.5714],
  'Chennai': [13.0827, 80.2707],
  'Pune': [18.5204, 73.8567],
  'Goa': [15.2993, 74.1240],
  'Gurugram': [28.4595, 77.0266],
  'Kolkata': [22.5726, 88.3639],
  'Jaipur': [26.9124, 75.7873],
  'Lucknow': [26.8467, 80.9462],
  'Chandigarh': [30.7333, 76.7794],
  'Indore': [22.7196, 75.8577],
  'Bhopal': [23.2599, 77.4126],
  'Nagpur': [21.1458, 79.0882],
  'Surat': [21.1702, 72.8311],
  'Kochi': [9.9312, 76.2673],
  'Coimbatore': [11.0168, 76.9558],
  'Visakhapatnam': [17.6868, 83.2185],
  'Patna': [25.5941, 85.1376],
  'Ranchi': [23.3441, 85.3096],
  'Bhubaneswar': [20.2961, 85.8245],
  'Guwahati': [26.1445, 91.7362],
  'Dehradun': [30.3165, 78.0322],
  'Amritsar': [31.6340, 74.8723],
  'Ludhiana': [30.9010, 75.8573],
  'Nashik': [19.9975, 73.7898],
  'Vadodara': [22.3072, 73.1812],
  'Rajkot': [22.3039, 70.8022],
  'Mysuru': [12.2958, 76.6394],
  'Thiruvananthapuram': [8.5241, 76.9366],
  'Jodhpur': [26.2389, 73.0243],
  'Udaipur': [24.5854, 73.7125],
  'Agra': [27.1767, 78.0081],
  'Varanasi': [25.3176, 82.9739],
  'Shimla': [31.1048, 77.1734],
  'Manali': [32.2432, 77.1892],
  'Pondicherry': [11.9416, 79.8083],
  'Noida': [28.5355, 77.3910],
  'Faridabad': [28.4089, 77.3178],
  'Raipur': [21.2514, 81.6296],
  'Siliguri': [26.7271, 88.3953],
};

async function addLocations() {
  console.log('Adding coordinates to existing events based on city in venue...');

  const eventsResult = await pool.query(`SELECT id, venue FROM events WHERE latitude IS NULL`);
  console.log(`Found ${eventsResult.rows.length} events without coordinates.`);

  let updated = 0;
  let skipped = 0;

  for (const event of eventsResult.rows) {
    // venue format is "VenueName, City" - match the city part against our list
    const matchedCity = Object.keys(cityCoordinates).find((city) =>
      event.venue.includes(city)
    );

    if (!matchedCity) {
      skipped++;
      continue;
    }

    const [lat, lng] = cityCoordinates[matchedCity];
    // Add a tiny random offset so events in the same city don't all stack
    // on the exact same pin - purely cosmetic for the map display
    const jitterLat = lat + (Math.random() - 0.5) * 0.05;
    const jitterLng = lng + (Math.random() - 0.5) * 0.05;

    await pool.query(
      `UPDATE events SET latitude = $1, longitude = $2 WHERE id = $3`,
      [jitterLat, jitterLng, event.id]
    );
    updated++;

    if (updated % 50 === 0) console.log(`  ...${updated} updated so far`);
  }

  console.log(`Done! Updated ${updated} events, skipped ${skipped} (no matching city found).`);
  process.exit(0);
}

addLocations();