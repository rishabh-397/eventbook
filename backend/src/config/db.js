const { Pool } = require('pg');
require('dotenv').config();

// Connection pool - reused across requests instead of opening a new
// connection each time. This matters at scale and is a good interview
// talking point (connection pooling, max connections, etc.)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // max connections in pool
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle Postgres client', err);
  process.exit(-1);
});

module.exports = pool;
