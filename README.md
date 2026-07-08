# EventBook — Seat Booking Platform

A ticket/seat booking system built to demonstrate handling real concurrency
problems (no double-booking under simultaneous requests), real-time seat
updates, and production-style backend design.

## Stack
React · Node.js/Express · PostgreSQL · Redis · Socket.io · Docker

## Local Setup

1. Start Postgres + Redis:
   ```
   docker compose up -d
   ```

2. Backend:
   ```
   cd backend
   cp .env.example .env
   npm install
   psql $DATABASE_URL -f src/config/schema.sql   # create tables
   npm run dev
   ```

3. Frontend (set up in Week 1, not scaffolded yet):
   ```
   cd frontend
   npm create vite@latest . -- --template react
   npm install
   npm run dev
   ```

## What's built so far
- [x] DB schema (users, events, seats, bookings, payments)
- [x] Redis-based distributed locking for seat holds (`bookingController.js`)
- [x] Cron job to auto-release expired holds every 30s
- [x] Socket.io wiring for live seat updates
- [x] Rate limiting on the booking endpoint
- [ ] Auth routes (signup/login/JWT)
- [ ] Event CRUD routes
- [ ] Frontend seat map UI
- [ ] Payment mock flow
- [ ] Load testing with k6
- [ ] CI/CD + deployment

## Roadmap
- **Week 1:** Auth, event CRUD, basic seat map UI, connect frontend to backend
- **Week 2:** Wire up the booking hold/confirm flow end-to-end, test concurrency manually with two browser tabs
- **Week 3:** Socket.io live updates on frontend, Redis caching for event reads, k6 load test
- **Week 4:** Dockerize both services, CI/CD via GitHub Actions, deploy, write up architecture decisions

## Key design decisions (for interview talking points)
- **Redis SET NX for locking** instead of a plain DB UPDATE, because Redis
  operations are atomic and single-threaded — eliminates the race condition
  where two requests both read "available" before either writes "held".
- **Hold + expiry pattern** (not instant booking) mirrors real ticketing
  systems — seats are reserved for 5 minutes to allow payment, then auto-released.
- **Cron sweep as a backstop** to Redis TTL, so Postgres never drifts out of
  sync with the actual lock state even if the app restarts.
