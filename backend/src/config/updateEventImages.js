require('dotenv').config();
const pool = require('./db');
const { getBestImageForEvent } = require('../services/imageService');

async function updateAllEventImages() {
  console.log('🔄 Starting event images update across all database events...');

  try {
    const res = await pool.query('SELECT id, title, venue, description, image_url FROM events ORDER BY id ASC');
    console.log(`Found ${res.rows.length} total events in database.`);

    let updatedCount = 0;
    let alreadyHadImage = 0;

    for (const ev of res.rows) {
      const bestImg = getBestImageForEvent(ev.title, ev.venue, ev.description);
      
      // Update the event with the best matched high-resolution poster
      await pool.query(
        'UPDATE events SET image_url = $1 WHERE id = $2',
        [bestImg, ev.id]
      );
      updatedCount++;

      if (updatedCount % 50 === 0) {
        console.log(`  ...updated ${updatedCount} / ${res.rows.length} events`);
      }
    }

    console.log(`\n✅ Successfully updated ${updatedCount} events with high-resolution poster image links!`);

    // Verify
    const check = await pool.query(`
      SELECT 
        COUNT(*) as total, 
        COUNT(image_url) as with_images,
        COUNT(DISTINCT image_url) as distinct_images
      FROM events
    `);
    console.log('📊 Verification Result:', check.rows[0]);

    // Show a sample of updated events
    const sample = await pool.query(`
      SELECT id, title, image_url 
      FROM events 
      ORDER BY id ASC 
      LIMIT 8
    `);
    console.log('\n🎨 Sample Updated Events:');
    sample.rows.forEach(r => {
      console.log(`- [ID ${r.id}] ${r.title} => ${r.image_url.slice(0, 60)}...`);
    });

    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating event images:', err);
    process.exit(1);
  }
}

updateAllEventImages();
