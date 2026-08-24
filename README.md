# EventBook — Enterprise Seat Booking Platform

A full-stack, production-grade ticket booking platform built to demonstrate real concurrency handling, real-time architecture, AI-powered features, advanced UI/UX design, and enterprise-level engineering patterns — not just a CRUD app.

## Live Demo
- **App:** https://eventbook-pi.vercel.app
- **API:** https://eventbook-backend.onrender.com
- **GitHub:** https://github.com/rishabh-397/eventbook

> ⚠️ The backend is on Render's free tier — the first request after idle may take 30–60s to wake up.

---

## Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite, Tailwind CSS v4, Framer Motion, Lucide React |
| **Backend** | Node.js, Express.js, Socket.io |
| **Database** | PostgreSQL (Neon — serverless) |
| **Cache / Locking** | Redis (Upstash — serverless) |
| **AI** | Google Gemini API (gemini-3.6-flash) |
| **Email** | Brevo (transactional HTTP API) |
| **Deployment** | Vercel (frontend) · Render (backend) |
| **Testing** | k6 (load testing) |

---

## Features

### 🎨 Advanced UI/UX (Production-Grade Design)
- **Glassmorphism Design System** — custom CSS `glass-card` and `glass-panel` utilities with backdrop blur, layered transparency, and ambient glow
- **Bento Grid Layout** — featured events span multiple grid columns, creating a modern editorial layout
- **Framer Motion Animations** — page transitions, staggered list entries, spring-physics floating action bar, and AnimatePresence for route changes
- **Skeleton Loaders** — shimmer placeholders replace plain "loading..." text across all async pages
- **Custom Theme System** — user-selectable accent colors (gold, blue, purple, rose), persisted in localStorage
- **Ticket Stub Design** — "My Bookings" uses CSS masks for a perforated-edge ticket appearance with QR code integration

### ⚡ Real-Time Architecture
- **Live Seat Map** — Socket.io broadcasts seat state changes (held/booked/released) to all connected browsers instantly — no polling
- **Viewer Presence** — "X viewing now" live counter per event powered by Socket.io room tracking
- **Socket Reconnect Recovery** — client re-fetches seat state on reconnect, ensuring no stale data after a network drop
- **Distributed Redis Locks** — atomic `SET NX` prevents any two users from holding the same seat simultaneously, even under 50 concurrent requests

### 🔁 Booking Reliability
- **Idempotent Booking API** — every `POST /bookings/hold` requires an `Idempotency-Key` header; replayed requests return the original response instead of creating duplicate bookings
- **Idempotent Confirm** — re-confirming an already-confirmed booking returns `200 OK` (safe replay) instead of erroring
- **Hold + Expiry Pattern** — seats are reserved for 5 minutes during checkout; a cron job releases unpaid holds and keeps Postgres in sync with Redis TTL
- **Booking Saga State Machine** — hold → pay → confirm → notify with explicit status transitions and clean rollback on failure

### 🤖 AI-Powered (Google Gemini)
- **AI Chatbot Assistant** — answers natural-language questions about events, grounded in real DB data (RAG-lite: query results injected as context, not hallucinated)
- **Natural Language Search** — free-text queries like *"comedy shows under ₹1000 in Delhi"* parsed into structured SQL filters by the LLM
- **AI Recommendations** — personalized "Recommended For You" section suggests upcoming events based on each user's booking history
- **Graceful Quota Handling** — 429 rate-limit errors return a friendly in-chat message instead of crashing

### 👥 Group Booking
- **Adjacent Seat Auto-Selection** — users choose a group size (2–5) and click "Auto-Select"; an algorithm scans rows for the first run of consecutive available seats and selects them instantly
- **Idempotency Key Rotation** — the key resets automatically whenever the seat selection changes, preventing stale holds

### 🎫 QR Ticket Validation
- **Admin Scanner View** — dedicated `/admin/scanner` page for event staff to validate tickets at the door
- **One-Time Scan Protection** — scanning a ticket sets `scanned_at` in the DB; re-scanning the same ticket returns an error, preventing duplicate entry
- **QR Code Integration** — booking confirmation QR codes encode the booking ID and are scannable by the admin scanner

### 💰 Dynamic Pricing Engine
- **Real-Time Surge Pricing** — seat prices rise automatically as occupancy increases:
  - 0–50% full → base price
  - 50–80% full → 1.2× multiplier
  - 80–95% full → 1.5× multiplier
  - 95%+ full → 2× multiplier
- **Price Locked at Hold Time** — the multiplier is computed live, but a seat's charged price is locked from the DB when held, ensuring consistency during payment

### 🔐 Security & Reliability
- **JWT Authentication** — secure token-based auth with role support (`user` / `admin`)
- **Rate Limiting** — booking endpoint is capped at 10 requests/min/IP to protect against bot abuse during high-demand drops
- **Idempotency at Every Layer** — protects against double-clicks, network retries, and browser re-submissions
- **Vercel SPA Routing** — `vercel.json` rewrites all routes to `index.html` so React Router deep links work correctly in production

### 📊 Admin Dashboard
- **KPI Cards** — gradient metric cards for total events, bookings, and revenue
- **Event Management** — create events with location, pricing, and capacity via a slide-in animated form
- **Occupancy Stats** — per-event booking count, revenue totals, and animated occupancy progress bars
- **Scanner Access** — one-click nav link to the ticket validation scanner

---

## Load Testing

Tested with [k6](https://k6.io) — 50 concurrent requests fired at **the same seat** simultaneously, the exact race condition Redis locking prevents.

```
k6 run loadtest.js
```

| Metric | Result |
|---|---|
| Concurrent requests | 50 |
| Successful bookings | **1** |
| Clean conflicts (409) | 49 |
| Double-bookings | **0** ✅ |
| Server errors (5xx) | **0** ✅ |
| Avg response time | 82ms |
| p95 response time | 82ms |

One request wins; every other is cleanly rejected with `409`. Zero double-bookings. Zero server errors under full concurrent load.

---

## Key Design Decisions

- **Redis `SET NX` for seat locking** — atomic, single-threaded; eliminates the race condition where two requests both read "available" before either writes "held"
- **Idempotency-Key header pattern** — mirrors Stripe's API design; safe for retries from network failures or double-clicks without creating duplicate state
- **Hold + expiry vs. instant booking** — mirrors real ticketing systems; gives users time to pay without permanently occupying a seat
- **Cron sweep as a backstop** — ensures Postgres never drifts out of sync with Redis TTL even if the app restarts mid-hold
- **AI grounded in real DB data** — chatbot, search, and recommendations inject actual query results into the prompt; the model picks from real events, not hallucinated ones
- **Dynamic pricing at display time only** — the charged price is frozen at hold time, keeping payment simple and consistent even as the multiplier changes for other users
- **HTTP email over SMTP** — Render's free tier blocks outbound SMTP ports; Brevo's HTTP API ensures reliable delivery without port issues

---

## Local Setup

**Backend:**
```bash
cd backend
cp .env.example .env
# Fill in: DATABASE_URL, REDIS_URL, JWT_SECRET, BREVO_API_KEY, BREVO_SENDER_EMAIL, GEMINI_API_KEY
npm install
psql $DATABASE_URL -f src/config/schema.sql
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

---

## Deployment
| Service | Provider |
|---|---|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon (serverless PostgreSQL) |
| Cache / Locking | Upstash (serverless Redis) |
| Email | Brevo |
| AI | Google Gemini API |