# EventBook — Frontend

React + Vite frontend for EventBook, a full-stack seat booking platform.

See the [main README](../README.md) for full project details, architecture decisions, and load test results.

## Stack
React · React Router · Socket.io Client · Axios

## Local Setup
npm install
npm run dev

Runs on `http://localhost:5173` by default. Requires the backend running (see `../backend/README.md` or main README) and a `.env` file with:

VITE_API_URL=http://localhost:4000/api


## Structure

src/
├── api/            # Axios client with auth interceptor
├── components/     # Reusable UI (payment modal, starfield background)
├── context/        # Theme context (accent color switching)
├── pages/          # Route-level pages (auth, events, seat map, bookings, admin)


## Build

npm run build
Outputs to `dist/`, deployed via Vercel.

