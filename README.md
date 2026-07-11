# EventBook — Seat Booking Platform

A full-stack ticket booking platform built to demonstrate real concurrency
handling (zero double-booking under simultaneous requests), real-time seat
updates, and production-style backend design — not just a CRUD app.

## Stack
React · Node.js/Express · PostgreSQL (Neon) · Redis (Upstash) · Socket.io · k6

## Features
- **Auth** — JWT-based signup/login, admin role support
- **Event browsing** — search/filter by title or venue
- **Seat map** — curved venue-style layout with live availability, real-time updates via Socket.io
- **Booking flow** — hold seats (5 min) → mock payment checkout → confirm → email confirmation
- **Concurrency-safe locking** — Redis distributed locks prevent double-booking, even under simultaneous requests (see Load Testing below)
- **My Bookings** — booking history per user
- **Admin dashboard** — create events, view booking/revenue stats per event
- **Live viewer presence** — "🔥 X viewing now" indicator per event, powered by Socket.io connection tracking
- **Theming** — user-selectable accent color, persisted in localStorage
- **Auto-expiry** — background cron job releases unpaid holds after 5 minutes

## Local Setup

1. Backend:

cd backend
cp .env.example .env   # fill in your DATABASE_URL, REDIS_URL, JWT_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD
npm install
psql $DATABASE_URL -f src/config/schema.sql   # create tables
npm run dev

2. Frontend:

cd frontend
npm install
npm run dev

3. Open `http://localhost:5173`

## Load Testing

Tested with [k6](https://k6.io) by firing 50 concurrent requests at the
**same seat** simultaneously — the exact race condition the Redis locking
is designed to prevent.

k6 run loadtest.js

**Results:**
| Metric | Value |
|---|---|
| Concurrent requests | 50 |
| Successful bookings | 1 |
| Clean conflicts (409) | 49 |
| Double-bookings | **0** |
| Server errors (5xx) | **0** |
| Avg response time | 82ms |
| p95 response time | 82ms |

Exactly one request wins the seat; every other request is cleanly
rejected with a `409`, with zero double-bookings and zero server errors
under full concurrent load.

## Key Design Decisions

- **Redis `SET NX` for seat locking** instead of a plain DB `UPDATE` —
  Redis operations are atomic and single-threaded, eliminating the race
  condition where two requests both read "available" before either writes
  "held."
- **Hold + expiry pattern** (not instant booking) mirrors real ticketing
  systems — seats are reserved for 5 minutes to allow payment, then
  auto-released.
- **Cron sweep as a backstop** to Redis TTL, so Postgres never drifts out
  of sync with lock state even if the app restarts mid-hold.
- **Rate limiting** on the booking endpoint (10 requests/min/IP) to
  protect against bot abuse during high-demand ticket drops.
- **Mock payment gateway** — built as a realistic checkout UI rather than
  integrating a live payment processor, to avoid requiring business KYC
  verification for a portfolio project; the booking/payment state machine
  itself (hold → pay → confirm) is fully real.

## What's Next
- [ ] Deployment (Render + Vercel)
- [ ] CI/CD via GitHub Actions