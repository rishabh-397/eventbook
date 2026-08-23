import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { io } from 'socket.io-client';
import PaymentModal from '../components/PaymentModal';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Users, TrendingUp, ArrowLeft, Clock, CheckCircle2 } from 'lucide-react';

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
  const [pricing, setPricing] = useState(null);

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
      setPricing(res.data.pricing);
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
      const msg = err.response?.data?.error || 'Failed to hold seats';
      setError(msg);
      toast.error(msg);
    }
  }

  async function handlePaymentSuccess() {
    setError('');
    try {
      const res = await api.post(`/bookings/${booking.bookingId}/confirm`);
      setStatus('confirmed');
      setBooking((b) => ({ ...b, amount: res.data.amount }));
      setShowPayment(false);
      toast.success('Booking confirmed!');
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to confirm';
      setError(msg);
      toast.error(msg);
      setShowPayment(false);
    }
  }

  async function cancelBooking() {
    try {
      await api.post(`/bookings/${booking.bookingId}/cancel`);
    } catch (err) {
      // ignore
    }
    setBooking(null);
    setSelected([]);
    setStatus('');
    loadEvent();
  }

  if (!event) return (
    <div className="min-h-screen bg-[#0B0E14] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-[#232838] border-t-[#E8B563] rounded-full animate-spin"></div>
    </div>
  );

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
    <div className="min-h-screen bg-[#0B0E14] pb-40">
      {/* Sticky Header */}
      <div className="sticky top-[73px] z-40 glass-panel px-6 py-4 mb-8 border-t border-[#232838]/50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-[#8B93A7] hover:text-white transition-colors text-sm mb-2 font-medium">
              <ArrowLeft size={16} /> Back to Events
            </button>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-white">{event.title}</h1>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2 text-sm text-[#8B93A7]">
              <span className="flex items-center gap-1.5"><Clock size={14} /> {new Date(event.event_time).toLocaleString()}</span>
              <span className="flex items-center gap-1.5"><MapPin size={14} /> {event.venue}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {viewerCount > 0 && (
              <div className="flex items-center gap-2 bg-[#C1443D]/10 border border-[#C1443D]/30 text-[#C1443D] px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#C1443D] animate-pulse"></span>
                {viewerCount} viewing now
              </div>
            )}
            {pricing && pricing.multiplier > 1 && (
              <div className="flex items-center gap-2 bg-[#E8B563]/10 border border-[#E8B563]/30 text-[#E8B563] px-3 py-1.5 rounded-full text-xs font-bold font-mono tracking-wide">
                <TrendingUp size={14} />
                Demand is high
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {/* Map & Legend Split */}
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          
          {/* Main Seat Map Area */}
          <div className="flex-1 w-full glass-card p-8 md:p-12 overflow-x-auto hide-scrollbar">
            
            {/* Stage */}
            <div className="flex justify-center mb-16">
              <div className="w-3/4 max-w-md py-4 text-center bg-gradient-to-b from-[#E8B563]/20 to-transparent border border-[#E8B563]/50 rounded-t-full rounded-b-xl shadow-[0_-10px_30px_rgba(232,181,99,0.1)] relative">
                <span className="font-display font-bold text-[#E8B563] tracking-[0.3em] uppercase text-sm">Stage</span>
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-[#E8B563] rounded-full blur-[2px]"></div>
              </div>
            </div>

            {/* Seats */}
            <div className="flex flex-col gap-3 min-w-max pb-8 mx-auto items-center">
              {sortedRowKeys.map((row, rowIndex) => {
                // Curved layout effect
                const curveOffset = Math.abs(rowIndex - (sortedRowKeys.length - 1) / 2) * 12;
                return (
                  <div key={row} className="flex items-center gap-2" style={{ transform: `translateY(${curveOffset}px)` }}>
                    <span className="w-6 text-center font-mono text-[#8B93A7] text-sm font-semibold">{row}</span>
                    <div className="flex gap-2">
                      {rows[row]
                        .sort((a, b) => a.seat_number.localeCompare(b.seat_number, undefined, { numeric: true }))
                        .map((seat) => {
                          const isSelected = selected.includes(seat.id);
                          const isAvailable = seat.status === 'available';
                          
                          let seatClass = "w-9 h-9 rounded-md font-mono text-xs flex items-center justify-center transition-all duration-200 border relative overflow-hidden ";
                          
                          if (isSelected) {
                            seatClass += "bg-[#E8B563] border-[#E8B563] text-[#0B0E14] shadow-[0_0_15px_rgba(232,181,99,0.5)] scale-110 z-10 font-bold";
                          } else if (isAvailable) {
                            seatClass += "bg-[#12161F] border-[#4A9B7F]/50 text-[#EDEAE3] hover:border-[#4A9B7F] hover:bg-[#4A9B7F]/20 cursor-pointer hover:scale-110";
                          } else {
                            seatClass += "bg-[#232838] border-[#232838] text-[#8B93A7] opacity-50 cursor-not-allowed";
                          }

                          return (
                            <button
                              key={seat.id}
                              onClick={() => toggleSeat(seat)}
                              disabled={!isAvailable}
                              className={seatClass}
                              title={seat.seat_number}
                            >
                              {seat.seat_number.slice(1)}
                            </button>
                          );
                        })}
                    </div>
                    <span className="w-6 text-center font-mono text-[#8B93A7] text-sm font-semibold">{row}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sidebar / Map / Legend */}
          <div className="w-full lg:w-80 flex flex-col gap-6">
            <div className="glass-card p-6">
              <h3 className="font-display font-semibold mb-4 text-lg">Legend</h3>
              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3 text-sm text-[#8B93A7]">
                  <div className="w-6 h-6 rounded bg-[#12161F] border border-[#4A9B7F]"></div>
                  Available
                </div>
                <div className="flex items-center gap-3 text-sm text-[#8B93A7]">
                  <div className="w-6 h-6 rounded bg-[#E8B563] border border-[#E8B563] shadow-[0_0_10px_rgba(232,181,99,0.4)]"></div>
                  Selected
                </div>
                <div className="flex items-center gap-3 text-sm text-[#8B93A7]">
                  <div className="w-6 h-6 rounded bg-[#232838] border border-[#232838] opacity-50"></div>
                  Booked / Held
                </div>
              </div>
            </div>

            {event.latitude && event.longitude && (
              <div className="glass-card p-4 overflow-hidden group">
                <iframe
                  title="event-location"
                  width="100%"
                  height="180"
                  className="rounded-lg border border-[#232838] mb-3 transition-transform group-hover:scale-[1.02]"
                  loading="lazy"
                  src={`https://maps.google.com/maps?q=${event.latitude},${event.longitude}&z=15&output=embed`}
                />
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E8B563] text-sm font-semibold flex items-center gap-2 hover:gap-3 transition-all"
                >
                  Get Directions <ArrowRight size={14} />
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Action Bar */}
      <AnimatePresence>
        {(selected.length > 0 || booking) && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            {booking && status === 'confirmed' ? (
              <div className="bg-gradient-to-r from-[#4A9B7F] to-[#3a7c65] text-[#0B0E14] rounded-2xl shadow-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/20 blur-3xl rounded-full"></div>
                <div className="flex items-center gap-4 relative z-10">
                  <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#4A9B7F]">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-xl uppercase tracking-wider">Booking Confirmed!</h3>
                    <p className="font-mono font-medium text-sm">ID: #{booking.bookingId} • ₹{booking.amount}</p>
                  </div>
                </div>
                <div className="bg-white p-2 rounded-lg relative z-10 shrink-0 shadow-lg">
                  <QRCodeSVG value={`EVENTBOOK-CONFIRMED-${booking.bookingId}`} size={70} />
                </div>
              </div>
            ) : booking && status === 'held' ? (
              <div className="glass-card shadow-2xl border-[#E8B563]/50 flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-[#232838] overflow-hidden">
                <div className="p-5 flex-1 flex flex-col justify-center bg-[#E8B563]/5">
                  <span className="text-[#8B93A7] text-xs font-mono uppercase tracking-widest mb-1">Held For You</span>
                  <p className="font-semibold text-white">Expires {new Date(booking.expiresAt).toLocaleTimeString()}</p>
                </div>
                <div className="p-5 flex-1 flex items-center justify-between sm:justify-end gap-4 bg-[#12161F]">
                  <button onClick={cancelBooking} className="text-[#8B93A7] hover:text-white text-sm font-semibold transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => setShowPayment(true)} className="btn-primary py-2.5 px-8">
                    Confirm & Pay
                  </button>
                </div>
              </div>
            ) : (
              <div className="glass-card shadow-2xl flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x divide-[#232838] overflow-hidden">
                <div className="p-5 flex-[2]">
                  <span className="text-[#8B93A7] text-xs font-mono uppercase tracking-widest mb-1 block">Selected Seats</span>
                  <p className="font-mono text-white text-lg font-medium">{selectedSeats.map((s) => s.seat_number).join(', ')}</p>
                </div>
                <div className="p-5 flex-1 bg-[#12161F] flex items-center justify-between sm:justify-end gap-6">
                  <div>
                    <span className="text-[#8B93A7] text-xs font-mono uppercase tracking-widest mb-1 block">Total</span>
                    <p className="text-2xl font-bold text-[#E8B563]">₹{total}</p>
                  </div>
                  <button onClick={holdSeats} className="btn-primary py-3 px-6 shadow-[0_0_15px_rgba(232,181,99,0.2)]">
                    Hold Seats
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-[#C1443D] text-white px-6 py-3 rounded-lg font-medium shadow-xl">
          {error}
        </div>
      )}

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