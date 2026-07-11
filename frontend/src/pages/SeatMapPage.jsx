import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { io } from 'socket.io-client';
import PaymentModal from '../components/PaymentModal';

export default function SeatMapPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [seats, setSeats] = useState([]);
  const [selected, setSelected] = useState([]);
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);

  useEffect(() => {
    loadEvent();

    const socketUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace('/api', '')
      : 'http://localhost:4000';
    const socket = io(socketUrl);
    socket.emit('join_event', id);
    socket.on('seats_held', loadEvent);
    socket.on('seats_booked', loadEvent);
    socket.on('seats_released', loadEvent);
    socket.on('viewer_count', ({ count }) => setViewerCount(count));

    return () => socket.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function loadEvent() {
    api.get(`/events/${id}`).then((res) => {
      setEvent(res.data.event);
      setSeats(res.data.seats);
    });
  }

  function toggleSeat(seat) {
    if (seat.status !== 'available') return;
    setSelected((prev) =>
      prev.includes(seat.id) ? prev.filter((s) => s !== seat.id) : [...prev, seat.id]
    );
  }

  async function holdSeats() {
    setError('');
    try {
      const res = await api.post('/bookings/hold', { eventId: Number(id), seatIds: selected });
      setBooking(res.data);
      setStatus('held');
      loadEvent();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to hold seats');
    }
  }

  async function handlePaymentSuccess() {
    setError('');
    try {
      const res = await api.post(`/bookings/${booking.bookingId}/confirm`);
      setStatus('confirmed');
      setBooking((b) => ({ ...b, amount: res.data.amount }));
      setShowPayment(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to confirm');
      setShowPayment(false);
    }
  }

  async function cancelBooking() {
    try {
      await api.post(`/bookings/${booking.bookingId}/cancel`);
    } catch (err) {
      // ignore, already expired/handled
    }
    setBooking(null);
    setSelected([]);
    setStatus('');
    loadEvent();
  }

  if (!event) return <p style={{ color: 'var(--text-muted)', padding: 40 }}>Loading…</p>;

  const rows = {};
  seats.forEach((s) => {
    const row = s.seat_number[0];
    rows[row] = rows[row] || [];
    rows[row].push(s);
  });

  const sortedRowKeys = Object.keys(rows).sort();
  const selectedSeats = seats.filter((s) => selected.includes(s.id));
  const total = selectedSeats.reduce((sum, s) => sum + Number(s.price), 0);

  return (
    <div style={styles.page}>
      <button style={styles.back} onClick={() => navigate('/events')}>← All Events</button>

      <p style={styles.eyebrow}>{new Date(event.event_time).toDateString()}</p>
      <h1 style={styles.title}>{event.title}</h1>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <p style={{ ...styles.venue, margin: 0 }}>{event.venue}</p>
        {viewerCount > 0 && (
          <span style={styles.liveIndicator}>
            🔥 {viewerCount} viewing now
          </span>
        )}
      </div>

      <div style={styles.legend}>
        <span style={styles.legendItem}><i style={{ ...styles.dot, background: 'var(--seat-available)' }} /> Available</span>
        <span style={styles.legendItem}><i style={{ ...styles.dot, background: 'var(--seat-held)' }} /> Held/Booked</span>
        <span style={styles.legendItem}><i style={{ ...styles.dot, background: 'var(--seat-selected)' }} /> Selected</span>
      </div>

      <div style={styles.stageWrap}>
        <div style={styles.stage}>STAGE</div>
      </div>

      <div style={styles.seatMap}>
        {sortedRowKeys.map((row, rowIndex) => {
          const curveOffset = Math.abs(rowIndex - (sortedRowKeys.length - 1) / 2) * 8;
          return (
            <div key={row} style={{ ...styles.row, marginLeft: curveOffset }}>
              <span style={styles.rowLabel}>{row}</span>
              {rows[row]
                .sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }))
                .map((seat) => {
                  const isSelected = selected.includes(seat.id);
                  const isAvailable = seat.status === 'available';
                  return (
                    <button
                      key={seat.id}
                      onClick={() => toggleSeat(seat)}
                      disabled={!isAvailable}
                      style={{
                        ...styles.seat,
                        background: isSelected
                          ? 'var(--seat-selected)'
                          : isAvailable ? 'transparent' : 'var(--seat-held)',
                        borderColor: isSelected
                          ? 'var(--seat-selected)'
                          : isAvailable ? 'var(--seat-available)' : 'var(--seat-held)',
                        cursor: isAvailable ? 'pointer' : 'not-allowed',
                        opacity: isAvailable || isSelected ? 1 : 0.5,
                      }}
                      title={seat.seat_number}
                    >
                      {seat.seat_number.slice(1)}
                    </button>
                  );
                })}
            </div>
          );
        })}
      </div>

      {selected.length > 0 && !booking && (
        <div style={styles.stub}>
          <div style={styles.stubLeft}>
            <p style={styles.stubLabel}>Seats</p>
            <p style={styles.stubValue}>{selectedSeats.map((s) => s.seat_number).join(', ')}</p>
          </div>
          <div style={styles.perforation} />
          <div style={styles.stubRight}>
            <p style={styles.stubLabel}>Total</p>
            <p style={styles.stubPrice}>₹{total}</p>
            <button style={styles.holdBtn} onClick={holdSeats}>Hold Seats (5 min)</button>
          </div>
        </div>
      )}

      {booking && status === 'held' && (
        <div style={styles.stub}>
          <div style={styles.stubLeft}>
            <p style={styles.stubLabel}>Booking #{booking.bookingId}</p>
            <p style={styles.stubValue}>Held until {new Date(booking.expiresAt).toLocaleTimeString()}</p>
          </div>
          <div style={styles.perforation} />
          <div style={styles.stubRight}>
            <button style={styles.holdBtn} onClick={() => setShowPayment(true)}>Confirm & Pay</button>
            <button style={styles.cancelBtn} onClick={cancelBooking}>Cancel</button>
          </div>
        </div>
      )}

      {booking && status === 'confirmed' && (
        <div style={styles.confirmedStub}>
          <p style={styles.stubLabel}>Booking Confirmed 🎟</p>
          <p style={styles.stubValue}>Booking #{booking.bookingId} · ₹{booking.amount}</p>
        </div>
      )}

      {error && <p style={styles.error}>{error}</p>}

      {showPayment && (
        <PaymentModal
          amount={total}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPayment(false)}
        />
      )}
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: 'var(--bg)', padding: '32px 48px 140px' },
  back: {
    background: 'transparent', border: 'none', color: 'var(--text-muted)',
    fontSize: 13, marginBottom: 24, padding: 0,
  },
  eyebrow: {
    color: 'var(--gold)', fontFamily: 'var(--font-mono)', fontSize: 12,
    letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0,
  },
  title: { fontSize: 32, margin: '4px 0' },
  venue: { color: 'var(--text-muted)' },
  liveIndicator: {
    fontSize: 12, color: 'var(--seat-held)', fontFamily: 'var(--font-mono)',
    border: '1px solid var(--seat-held)', padding: '4px 10px', borderRadius: 20,
    animation: 'pulse 2s infinite',
  },
  legend: { display: 'flex', gap: 20, marginBottom: 32 },
  legendItem: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)' },
  dot: { width: 10, height: 10, borderRadius: '50%', display: 'inline-block' },
  stageWrap: { display: 'flex', justifyContent: 'center', marginBottom: 32 },
  stage: {
    width: '60%',
    padding: '10px 0',
    textAlign: 'center',
    background: 'linear-gradient(180deg, rgba(232,181,99,0.15), transparent)',
    border: '1px solid var(--gold)',
    borderRadius: '50% 50% 8px 8px / 100% 100% 8px 8px',
    color: 'var(--gold)',
    fontFamily: 'var(--font-mono)',
    fontSize: 11,
    letterSpacing: '0.2em',
  },
  seatMap: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 40, alignItems: 'center' },
  row: { display: 'flex', alignItems: 'center', gap: 6 },
  rowLabel: {
    width: 24, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: 13,
  },
  seat: {
    width: 32, height: 32, borderRadius: 4, border: '1px solid',
    fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)',
  },
  stub: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    display: 'flex', background: 'var(--bg-elevated)', border: '1px solid var(--gold)',
    borderRadius: 6, overflow: 'hidden', minWidth: 480,
  },
  stubLeft: { padding: '16px 24px', flex: 1 },
  stubRight: { padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' },
  perforation: {
    width: 0, borderLeft: '2px dashed var(--border)', margin: '12px 0',
  },
  stubLabel: { fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 },
  stubValue: { fontSize: 14, margin: '4px 0 0', fontFamily: 'var(--font-mono)' },
  stubPrice: { fontSize: 20, margin: '4px 0 8px', color: 'var(--gold)', fontWeight: 600 },
  holdBtn: {
    background: 'var(--gold)', border: 'none', color: '#0B0E14', fontWeight: 600,
    padding: '10px 20px', borderRadius: 4, fontSize: 13,
  },
  cancelBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    padding: '8px 20px', borderRadius: 4, fontSize: 12,
  },
  confirmedStub: {
    position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
    background: 'var(--seat-available)', color: '#0B0E14', padding: '16px 32px',
    borderRadius: 6, textAlign: 'center',
  },
  error: { color: 'var(--seat-held)', marginTop: 16 },
};