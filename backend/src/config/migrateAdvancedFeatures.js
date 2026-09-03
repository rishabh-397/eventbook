require('dotenv').config();
const pool = require('./db');

async function migrate() {
  console.log('🔄 Running migrations for Payments, Analytics, and Waitlist...');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Extend payments table
    await client.query(`
      ALTER TABLE payments 
      ADD COLUMN IF NOT EXISTS provider VARCHAR(50) DEFAULT 'stripe_test',
      ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
      ADD COLUMN IF NOT EXISTS provider_order_id TEXT,
      ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
      ADD COLUMN IF NOT EXISTS error_message TEXT
    `);
    console.log('✅ Payments table schema updated');

    // 2. Create waitlist table
    await client.query(`
      CREATE TABLE IF NOT EXISTS waitlist (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        seats_requested INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'waiting', -- 'waiting', 'offered', 'claimed', 'expired'
        reservation_token TEXT,
        offer_expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(event_id, user_id, status)
      )
    `);
    console.log('✅ Waitlist table created');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_waitlist_event_status 
      ON waitlist(event_id, status, created_at)
    `);

    await client.query('COMMIT');
    console.log('🎉 Migrations completed successfully!');
    process.exit(0);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

migrate();
