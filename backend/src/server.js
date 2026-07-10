require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const rateLimit = require('express-rate-limit');

const { connectRedis } = require('./config/redis');
const { startExpiredHoldsJob } = require('./jobs/releaseExpiredHolds');

const app = express();
const server = http.createServer(app);

// Allow localhost for dev, plus your deployed frontend URL (set via env var once deployed)
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL, // e.g. https://eventbook.vercel.app
].filter(Boolean);

const io = new Server(server, { cors: { origin: allowedOrigins } });

app.set('io', io); // so controllers can emit events via req.app.get('io')
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Rate limit the booking endpoint specifically - protects against bots
// hammering seat holds during a popular event drop.
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10, // 10 hold attempts per minute per IP
  message: { error: 'Too many booking attempts, slow down' },
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/bookings', bookingLimiter, require('./routes/bookings'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Socket.io: clients join a room per event to get live seat updates
io.on('connection', (socket) => {
  socket.on('join_event', (eventId) => {
    socket.join(`event:${eventId}`);
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await connectRedis();
  startExpiredHoldsJob(io);
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();