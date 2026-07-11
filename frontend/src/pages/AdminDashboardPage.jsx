import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', venue: '', eventTime: '',
    seatRows: 5, seatsPerRow: 10, price: 1000,
  });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadSummary();
  }, []);

  function loadSummary() {
    setLoading(true);
    api.get('/events/admin/summary')
      .then((res) => setSummary(res.data))
      .catch((err) => setError(err.response?.data?.error || 'Failed to load'))
      .finally(() => setLoading(false));
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setCreating(true);
    try {
      await api.post('/events', {
        ...form,
        seatRows: Number(form.seatRows),
        seatsPerRow: Number(form.seatsPerRow),
        price: Number(form.price),
      });
      setShowForm(false);
      setForm({ title: '', description: '', venue: '', eventTime: '', seatRows: 5, seatsPerRow: 10, price: 1000 });
      loadSummary();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  }

  const totalRevenue = summary.reduce((sum, e) => sum + Number(e.revenue), 0);
  const totalBooked = summary.reduce((sum, e) => sum + Number(e.seats_booked), 0);

  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={() => navigate('/events')}>← All Events</button>

      <div style={styles.headerRow}>
        <div>
          <p style={styles.eyebrow}>Box Office</p>
          <h1 style={styles.title}>Admin Dashboard</h1>
        </div>
        <button style={styles.createBtn} onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ New Event'}
        </button>
      </div>

      <div style={styles.statsRow}>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Events</p>
          <p style={styles.statValue}>{summary.length}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Seats Booked</p>
          <p style={styles.statValue}>{totalBooked}</p>
        </div>
        <div style={styles.statCard}>
          <p style={styles.statLabel}>Total Revenue</p>
          <p style={styles.statValue}>₹{totalRevenue}</p>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} style={styles.form}>
          <div style={styles.formRow}>
            <input style={styles.input} placeholder="Event title" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            <input style={styles.input} placeholder="Venue" value={form.venue}
              onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
          </div>
          <input style={{ ...styles.input, width: '100%' }} placeholder="Description" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div style={styles.formRow}>
            <input style={styles.input} type="datetime-local" value={form.eventTime}
              onChange={(e) => setForm({ ...form, eventTime: e.target.value })} required />
            <input style={styles.input} type="number" placeholder="Price per seat (₹)" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div style={styles.formRow}>
            <input style={styles.input} type="number" placeholder="Rows" value={form.seatRows}
              onChange={(e) => setForm({ ...form, seatRows: e.target.value })} required />
            <input style={styles.input} type="number" placeholder="Seats per row" value={form.seatsPerRow}
              onChange={(e) => setForm({ ...form, seatsPerRow: e.target.value })} required />
          </div>
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.submitBtn} disabled={creating}>
            {creating ? 'Creating…' : 'Create Event'}
          </button>
        </form>
      )}

      <p style={styles.eyebrow2}>All Events</p>

      {loading && <p style={styles.muted}>Loading…</p>}

      <div style={styles.table}>
        <div style={styles.tableHeader}>
          <span style={{ flex: 2 }}>Event</span>
          <span style={{ flex: 1 }}>Date</span>
          <span style={{ flex: 1 }}>Seats Booked</span>
          <span style={{ flex: 1 }}>Revenue</span>
        </div>
        {summary.map((ev) => (
          <div key={ev.id} style={styles.tableRow}>
            <span style={{ flex: 2 }}>{ev.title}</span>
            <span style={{ flex: 1, color: 'var(--text-muted)', fontSize: 13 }}>
              {new Date(ev.event_time).toLocaleDateString()}
            </span>
            <span style={{ flex: 1 }}>{ev.seats_booked} / {ev.total_seats}</span>
            <span style={{ flex: 1, color: 'var(--gold)' }}>₹{ev.revenue}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', padding: '32px 48px' },
  back: { background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, padding: 0 },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  eyebrow: { color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 },
  eyebrow2: { color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 12, letterSpacing: '0.1em', textTransform: 'uppercase', margin: '40px 0 16px' },
  title: { fontSize: 28, margin: '4px 0 0' },
  createBtn: { background: 'var(--gold)', border: 'none', color: '#0B0E14', fontWeight: 600, padding: '12px 20px', borderRadius: 4, fontSize: 14 },
  statsRow: { display: 'flex', gap: 16, marginBottom: 8 },
  statCard: { flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: 20 },
  statLabel: { fontSize: 12, color: 'var(--text-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '0.05em' },
  statValue: { fontSize: 28, margin: 0, color: 'var(--gold)', fontWeight: 600 },
  form: { background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: 24, marginTop: 24, display: 'flex', flexDirection: 'column', gap: 12 },
  formRow: { display: 'flex', gap: 12 },
  input: { flex: 1, padding: '12px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 4, color: 'var(--text)', fontSize: 14 },
  submitBtn: { padding: '12px 0', background: 'var(--gold)', border: 'none', borderRadius: 4, color: '#0B0E14', fontWeight: 600, fontSize: 14, marginTop: 8 },
  error: { color: 'var(--seat-held)', fontSize: 13, margin: 0 },
  muted: { color: 'var(--text-muted)' },
  table: { border: '1px solid var(--border)', borderRadius: 6, overflow: 'hidden' },
  tableHeader: {
    display: 'flex', padding: '12px 20px', background: 'var(--bg-elevated)',
    fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em',
  },
  tableRow: {
    display: 'flex', padding: '16px 20px', borderTop: '1px solid var(--border)', fontSize: 14,
  },
};