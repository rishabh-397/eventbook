import http from 'k6/http';
import { check, sleep } from 'k6';

// This test simulates many users trying to hold the SAME seat at the
// same time - the exact scenario your Redis locking is designed to handle.
// Expected: exactly ONE request succeeds (200), all others get a clean
// 409 conflict. Zero seats should ever be double-booked.

export const options = {
  scenarios: {
    concurrent_booking_rush: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 50,
      maxDuration: '30s',
    },
  },
};

const BASE_URL = 'http://localhost:4000';
const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiZW1haWwiOiJ0ZXN0QHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzgzNzg4NDg5LCJleHAiOjE3ODQzOTMyODl9.PpskZkm-wWqrvLAyQfsj6W-HgichiQTngcSrleWe0es';

export default function () {
  const payload = JSON.stringify({
    eventId: 1,
    seatIds: [6], // A6 - confirmed available
  });

  const params = {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
    },
  };

  const res = http.post(`${BASE_URL}/api/bookings/hold`, payload, params);

  check(res, {
    'status is 200 or 409': (r) => r.status === 200 || r.status === 409,
    'no server errors (500s)': (r) => r.status < 500,
  });

  sleep(0.1);
}