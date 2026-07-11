import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/bookings/mine')
      .then((res) => setBookings(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const statusColor = {
    confirmed: 'var(--seat-available)',
    pending: 'var(--gold)',
    cancelled: 'var(--text-muted)',
    expired: 'var(--seat-held)',
  };

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <button style={styles.back} onClick={() => navigate('/events')}>← All Events</button>
      </header>

      <p style={styles.eyebrow}>Ticket Wallet</p>
      <h1 style={styles.title}>My Bookings</h1>

      {loading && <p style={styles.muted}>Loading…</p>}
      {!loading && bookings.length === 0 && (
        <p style={styles.muted}>No bookings yet — go find something to see!</p>
      )}

      <div style={styles.list}>
        {bookings.map((b) => (
          <div key={b.booking_id} style={styles.stub}>
            <div style={styles.stubLeft}>
              <p style={styles.eventTitle}>{b.event_title}</p>
              <p style={styles.venue}>{b.venue}</p>
              <p style={styles.date}>{new Date(b.event_time).toDateString()}</p>
            </div>
            <div style={styles.perforation} />
            <div style={styles.stubRight}>
              <p style={styles.seats}>Seats: {b.seat_numbers.join(', ')}</p>
              <p style={styles.amount}>₹{b.total_amount}</p>
              <span style={{ ...styles.status, color: statusColor[b.status] || 'var(--text-muted)' }}>
                {b.status.toUpperCase()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', padding: '32px 48px' },
  header: { marginBottom: 24 },
  back: {
    background: 'transparent', border: 'none', color: 'var(--text-muted)',
    fontSize: 13, padding: 0,
  },
  eyebrow: {
    color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 12,
    letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
  },
  title: { fontSize: 28, margin: '4px 0 32px' },
  muted: { color: 'var(--text-muted)' },
  list: { display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 640 },
  stub: {
    display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 6, overflow: 'hidden',
  },
  stubLeft: { padding: '20px 24px', flex: 1 },
  stubRight: { padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end', minWidth: 160 },
  perforation: { borderLeft: '2px dashed var(--border)' },
  eventTitle: { fontSize: 16, fontWeight: 600, margin: '0 0 4px' },
  venue: { fontSize: 13, color: 'var(--text-muted)', margin: '0 0 2px' },
  date: { fontSize: 12, color: 'var(--text-muted)', margin: 0, fontFamily: 'var(--font-mono)' },
  seats: { fontSize: 13, fontFamily: 'var(--font-mono)', margin: 0 },
  amount: { fontSize: 18, color: 'var(--gold)', fontWeight: 600, margin: '4px 0' },
  status: { fontSize: 11, letterSpacing: '0.08em', fontWeight: 600 },
};