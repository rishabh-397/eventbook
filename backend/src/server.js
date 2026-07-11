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

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.FRONTEND_URL,
].filter(Boolean);

const io = new Server(server, { cors: { origin: allowedOrigins } });

app.set('io', io);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// NOTE: max temporarily raised to 1000 for load testing concurrency behavior.
// Revert to 10 before deploying to production.
const bookingLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many booking attempts, slow down' },
});

const eventViewers = new Map();

function broadcastViewerCount(eventId) {
  const count = eventViewers.get(eventId)?.size || 0;
  io.to(`event:${eventId}`).emit('viewer_count', { count });
}

app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/bookings', bookingLimiter, require('./routes/bookings'));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

io.on('connection', (socket) => {
  let currentEventId = null;

  socket.on('join_event', (eventId) => {
    socket.join(`event:${eventId}`);
    currentEventId = eventId;

    if (!eventViewers.has(eventId)) eventViewers.set(eventId, new Set());
    eventViewers.get(eventId).add(socket.id);

    broadcastViewerCount(eventId);
  });

  socket.on('disconnect', () => {
    if (currentEventId && eventViewers.has(currentEventId)) {
      eventViewers.get(currentEventId).delete(socket.id);
      broadcastViewerCount(currentEventId);
    }
  });
});

const PORT = process.env.PORT || 4000;

async function start() {
  await connectRedis();
  startExpiredHoldsJob(io);
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

start();