-- EventBook Database Schema
-- Run this to set up your Postgres database

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'user', -- 'user' or 'admin'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS events (
  id SERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  venue VARCHAR(200),
  event_time TIMESTAMP NOT NULL,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  image_url TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS seats (
  id SERIAL PRIMARY KEY,
  event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
  seat_number VARCHAR(10) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'available', -- 'available', 'held', 'booked'
  version INTEGER DEFAULT 0,
  UNIQUE(event_id, seat_number)
);
CREATE INDEX IF NOT EXISTS idx_seats_event ON seats(event_id);
CREATE INDEX IF NOT EXISTS idx_seats_status ON seats(status);

CREATE TABLE IF NOT EXISTS bookings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  event_id INTEGER REFERENCES events(id),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'confirmed', 'expired', 'cancelled'
  hold_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_bookings_expiry ON bookings(hold_expires_at) WHERE status = 'pending';

CREATE TABLE IF NOT EXISTS booking_seats (
  booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id INTEGER REFERENCES seats(id),
  PRIMARY KEY (booking_id, seat_id)
);

CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  booking_id INTEGER REFERENCES bookings(id),
  amount DECIMAL(10,2),
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'success', 'failed'
  provider VARCHAR(50) DEFAULT 'stripe_test',
  provider_payment_id TEXT,
  provider_order_id TEXT,
  currency VARCHAR(10) DEFAULT 'INR',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

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
);
CREATE INDEX IF NOT EXISTS idx_waitlist_event_status ON waitlist(event_id, status, created_at);

