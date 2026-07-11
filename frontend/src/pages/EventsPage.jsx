import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(true);
      api.get('/events', { params: search ? { search } : {} })
        .then((res) => setEvents(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, 300); // debounce - waits 300ms after typing stops before searching

    return () => clearTimeout(timer);
  }, [search]);

  function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <h1 style={styles.title}>EventBook</h1>
        <div style={{ display: 'flex', gap: 12 }}>
          <button style={styles.logout} onClick={() => navigate('/my-bookings')}>My Bookings</button>
          <button style={styles.logout} onClick={logout}>Log Out</button>
        </div>
      </header>

      <p style={styles.eyebrow}>Now Booking</p>

      <input
        style={styles.search}
        placeholder="Search by event or venue…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading && <p style={styles.muted}>Loading events…</p>}
      {!loading && events.length === 0 && (
        <p style={styles.muted}>No events match your search.</p>
      )}

      <div style={styles.grid}>
        {events.map((ev) => (
          <div
            key={ev.id}
            style={styles.card}
            onClick={() => navigate(`/events/${ev.id}`)}
          >
            <p style={styles.cardEyebrow}>
              {new Date(ev.event_time).toLocaleDateString(undefined, {
                month: 'short', day: 'numeric', year: 'numeric',
              })}
            </p>
            <h2 style={styles.cardTitle}>{ev.title}</h2>
            <p style={styles.cardVenue}>{ev.venue}</p>
            <p style={styles.cardCta}>View Seats →</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', padding: '32px 48px' },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 40, borderBottom: '1px solid var(--border)', paddingBottom: 20,
  },
  title: { fontSize: 24, margin: 0 },
  logout: {
    background: 'transparent', border: '1px solid var(--border)',
    color: 'var(--text-muted)', padding: '8px 16px', borderRadius: 4, fontSize: 13,
  },
  eyebrow: {
    color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 12,
    letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16,
  },
  search: {
    display: 'block', width: '100%', maxWidth: 420, padding: '12px 16px',
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 4, color: 'var(--text)', fontSize: 14, marginBottom: 32,
  },
  muted: { color: 'var(--text-muted)' },
  grid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20,
  },
  card: {
    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
    borderRadius: 4, padding: 24, cursor: 'pointer', transition: 'border-color 0.2s',
  },
  cardEyebrow: {
    fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px',
  },
  cardTitle: { fontSize: 20, margin: '0 0 4px' },
  cardVenue: { color: 'var(--text-muted)', fontSize: 14, margin: '0 0 20px' },
  cardCta: { color: 'var(--gold)', fontSize: 13, fontWeight: 600, margin: 0 },
};