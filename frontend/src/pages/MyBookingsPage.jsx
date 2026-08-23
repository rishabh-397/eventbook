import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { ArrowLeft, Ticket, Calendar, MapPin, Clock } from 'lucide-react';

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

  const statusConfig = {
    confirmed: { color: 'text-[#4A9B7F]', bg: 'bg-[#4A9B7F]/10', border: 'border-[#4A9B7F]/20' },
    pending: { color: 'text-[#E8B563]', bg: 'bg-[#E8B563]/10', border: 'border-[#E8B563]/20' },
    cancelled: { color: 'text-[#8B93A7]', bg: 'bg-[#232838]', border: 'border-[#232838]' },
    expired: { color: 'text-[#C1443D]', bg: 'bg-[#C1443D]/10', border: 'border-[#C1443D]/20' },
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    show: { opacity: 1, scale: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] pb-24">
      <div className="max-w-4xl mx-auto px-6 pt-12">
        <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-[#8B93A7] hover:text-white transition-colors text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Back to Events
        </button>

        <div className="mb-12">
          <div className="flex items-center gap-3 text-[#E8B563] font-mono text-sm tracking-widest uppercase mb-2">
            <Ticket size={18} /> Ticket Wallet
          </div>
          <h1 className="text-4xl font-display font-bold text-white">My Bookings</h1>
        </div>

        {loading ? (
          <div className="flex flex-col gap-6">
            {[1, 2].map(n => <div key={n} className="w-full h-48 rounded-2xl bg-[#12161F] border border-[#232838] shimmer"></div>)}
          </div>
        ) : bookings.length === 0 ? (
          <div className="glass-card p-16 flex flex-col items-center text-center">
            <Ticket className="text-[#232838] mb-4" size={64} />
            <h3 className="text-xl font-semibold mb-2">No bookings yet</h3>
            <p className="text-[#8B93A7] mb-6">Go find something incredible to see!</p>
            <button onClick={() => navigate('/events')} className="btn-primary">Browse Events</button>
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="flex flex-col gap-8">
            {bookings.map((b) => {
              const conf = statusConfig[b.status] || statusConfig.cancelled;
              const date = new Date(b.event_time);
              
              return (
                <motion.div key={b.booking_id} variants={item} className="flex flex-col md:flex-row relative group">
                  {/* Left Ticket Body */}
                  <div className="flex-1 bg-[#12161F] border border-[#232838] md:border-r-0 rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl p-6 md:p-8 relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl -mr-16 -mt-16"></div>
                    
                    <div className="flex justify-between items-start mb-6 relative z-10">
                      <div>
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${conf.bg} ${conf.color} ${conf.border} mb-4`}>
                          {b.status === 'confirmed' && <span className="w-1.5 h-1.5 rounded-full bg-[#4A9B7F]"></span>}
                          {b.status}
                        </span>
                        <h2 className="text-2xl font-display font-bold text-white mb-2">{b.event_title}</h2>
                        <div className="flex items-center gap-2 text-[#8B93A7] text-sm">
                          <MapPin size={14} /> {b.venue}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 relative z-10">
                      <div>
                        <span className="block text-[#8B93A7] font-mono text-[10px] uppercase tracking-widest mb-1 text-opacity-70">Date</span>
                        <span className="text-white font-medium flex items-center gap-2">
                          <Calendar size={14} className="text-[#E8B563]" />
                          {date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[#8B93A7] font-mono text-[10px] uppercase tracking-widest mb-1 text-opacity-70">Time</span>
                        <span className="text-white font-medium flex items-center gap-2">
                          <Clock size={14} className="text-[#E8B563]" />
                          {date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <span className="block text-[#8B93A7] font-mono text-[10px] uppercase tracking-widest mb-1 text-opacity-70">Booking ID</span>
                        <span className="text-white font-mono font-medium">#{b.booking_id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Perforation Line (CSS Mask) */}
                  <div className="hidden md:flex flex-col items-center justify-between bg-[#12161F] border-y border-[#232838] w-8 relative overflow-hidden z-10">
                     <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 border-l-2 border-dashed border-[#232838]"></div>
                     <div className="w-6 h-6 bg-[#0B0E14] rounded-full absolute -top-3 -left-3 border-b border-[#232838]"></div>
                     <div className="w-6 h-6 bg-[#0B0E14] rounded-full absolute -bottom-3 -left-3 border-t border-[#232838]"></div>
                  </div>

                  {/* Right Ticket Stub */}
                  <div className="md:w-64 bg-gradient-to-br from-[#E8B563] to-[#C1443D] p-1 rounded-b-2xl md:rounded-bl-none md:rounded-r-2xl relative shadow-xl">
                    {/* Inner Content to maintain border effect */}
                    <div className="bg-[#12161F] w-full h-full rounded-b-[15px] md:rounded-bl-none md:rounded-r-[15px] p-6 flex flex-row md:flex-col items-center md:items-start justify-between relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#E8B563]/5 to-transparent"></div>
                      
                      <div className="relative z-10 w-full">
                        <span className="block text-[#8B93A7] font-mono text-[10px] uppercase tracking-widest mb-1">Seats</span>
                        <p className="text-white font-mono font-bold text-lg mb-4">{b.seat_numbers.join(', ')}</p>
                        
                        <span className="block text-[#8B93A7] font-mono text-[10px] uppercase tracking-widest mb-1">Total Paid</span>
                        <p className="text-[#E8B563] font-bold text-3xl">₹{b.total_amount}</p>
                      </div>

                      {b.status === 'confirmed' && (
                        <div className="relative z-10 bg-white p-1.5 rounded-lg shrink-0 md:mt-6 md:self-center shadow-lg transform transition-transform group-hover:scale-105">
                          <QRCodeSVG value={`EVENTBOOK-${b.booking_id}`} size={70} />
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </div>
  );
}