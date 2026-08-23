import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { Search, Sparkles, MapPin, Calendar, ArrowRight, Ticket, Users } from 'lucide-react';

export default function EventsPage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const [aiMode, setAiMode] = useState(false);
  const [aiSearching, setAiSearching] = useState(false);
  const [recommendations, setRecommendations] = useState([]);

  useEffect(() => {
    if (aiMode) return;

    const timer = setTimeout(() => {
      setLoading(true);
      api.get('/events', { params: search ? { search } : {} })
        .then((res) => setEvents(res.data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }, 300);

    return () => clearTimeout(timer);
  }, [search, aiMode]);

  useEffect(() => {
    api.get('/bookings/recommendations')
      .then((res) => setRecommendations(res.data.recommendations))
      .catch(() => setRecommendations([]));
  }, []);

  async function handleAiSearch(e) {
    e.preventDefault();
    if (!search.trim()) return;

    setAiSearching(true);

    try {
      const res = await api.post('/events/ai-search', { query: search });
      setEvents(res.data.events);
    } catch (err) {
      console.error(err);
    } finally {
      setAiSearching(false);
    }
  }

  const EventSkeleton = () => (
    <div className="glass-card p-6 flex flex-col gap-4">
      <div className="w-24 h-4 rounded bg-[#232838] shimmer"></div>
      <div className="w-full h-8 rounded bg-[#232838] shimmer"></div>
      <div className="w-3/4 h-4 rounded bg-[#232838] shimmer"></div>
      <div className="mt-4 w-full h-10 rounded bg-[#232838] shimmer"></div>
    </div>
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-[#0B0E14] pb-24">
      {/* Hero Section */}
      <div className="relative pt-12 pb-20 px-6 overflow-hidden">
        <div className="blob blob-1"></div>
        <div className="max-w-6xl mx-auto relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#12161F] border border-[#232838] mb-6">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-mono text-[#8B93A7] uppercase tracking-wider">Live Events Happening Now</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tight">
              Discover <span className="bg-gradient-to-r from-[#E8B563] to-[#F0C57B] bg-clip-text text-transparent">Extraordinary</span><br />Experiences
            </h1>
            
            <p className="text-[#8B93A7] text-lg md:text-xl max-w-2xl mx-auto mb-10">
              Book tickets to the best comedy shows, tech meetups, and live concerts in your city.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto flex gap-3 items-center bg-[#12161F]/80 backdrop-blur-md p-2 rounded-2xl border border-[#232838] shadow-2xl">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B93A7]" size={20} />
                <input
                  className="w-full bg-transparent text-white pl-12 pr-4 py-4 outline-none placeholder:text-[#8B93A7]"
                  placeholder={aiMode ? 'Try "comedy shows under ₹1000"' : "Search by event or venue..."}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => aiMode && e.key === 'Enter' && handleAiSearch(e)}
                />
              </div>
              
              {aiMode ? (
                <button
                  onClick={handleAiSearch}
                  disabled={aiSearching}
                  className="bg-[#E8B563] text-[#0B0E14] px-6 py-4 rounded-xl font-bold flex items-center gap-2 transition-all hover:bg-[#F0C57B] disabled:opacity-70 whitespace-nowrap"
                >
                  {aiSearching ? <div className="w-5 h-5 border-2 border-[#0B0E14] border-t-transparent rounded-full animate-spin"></div> : <><Sparkles size={18} /> Search</>}
                </button>
              ) : null}

              <button
                type="button"
                className={`p-4 rounded-xl transition-all flex items-center justify-center border ${aiMode ? 'bg-[#E8B563]/20 border-[#E8B563] text-[#E8B563]' : 'bg-[#0B0E14] border-[#232838] text-[#8B93A7] hover:text-white'}`}
                onClick={() => {
                  setAiMode(!aiMode);
                  setSearch('');
                }}
                title="Toggle AI Search"
              >
                <Sparkles size={20} />
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
        {recommendations.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            transition={{ delay: 0.3 }}
            className="mb-16"
          >
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-[#E8B563]" size={24} />
              <h2 className="text-2xl font-display font-semibold">Recommended For You</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map((ev) => (
                <div
                  key={ev.id}
                  className="glass-card overflow-hidden group cursor-pointer transition-all hover:-translate-y-1 hover:border-[#E8B563]/50 hover:shadow-[0_8px_30px_rgba(232,181,99,0.15)]"
                  onClick={() => navigate(`/events/${ev.id}`)}
                >
                  <div className="h-2 w-full bg-gradient-to-r from-[#E8B563] to-[#F0C57B]"></div>
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-[#E8B563] font-mono text-xs uppercase tracking-wider mb-3">
                      <Calendar size={14} />
                      {new Date(ev.event_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <h3 className="text-xl font-bold mb-2 group-hover:text-[#E8B563] transition-colors line-clamp-1">{ev.title}</h3>
                    <div className="flex items-center gap-2 text-[#8B93A7] text-sm mb-6">
                      <MapPin size={14} />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-sm font-semibold bg-[#E8B563]/10 text-[#E8B563] px-3 py-1 rounded-full">
                        ₹{ev.price || '1000'}
                      </span>
                      <span className="text-[#E8B563] font-semibold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        View Seats <ArrowRight size={16} />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-display font-semibold">
            {search ? 'Search Results' : 'Now Booking'}
          </h2>
          {!loading && <span className="text-[#8B93A7] font-mono text-sm">{events.length} events found</span>}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => <EventSkeleton key={n} />)}
          </div>
        ) : events.length === 0 ? (
          <div className="glass-card p-16 flex flex-col items-center text-center">
            <Ticket className="text-[#232838] mb-4" size={64} />
            <h3 className="text-xl font-semibold mb-2">No events found</h3>
            <p className="text-[#8B93A7]">Try adjusting your search terms or exploring different dates.</p>
          </div>
        ) : (
          <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bento-grid"
          >
            {events.map((ev, i) => (
              <motion.div
                key={ev.id}
                variants={item}
                className={`glass-card overflow-hidden group cursor-pointer transition-all hover:-translate-y-1 hover:border-[#8B93A7]/50 ${i === 0 && !search ? 'md:col-span-2 lg:col-span-2 flex flex-col md:flex-row' : 'flex flex-col'}`}
                onClick={() => navigate(`/events/${ev.id}`)}
              >
                <div className={`bg-gradient-to-br from-[#1A1F2E] to-[#0B0E14] p-6 flex flex-col justify-between ${i === 0 && !search ? 'md:w-2/5 border-r border-[#232838]' : ''}`}>
                  <div>
                    <div className="flex items-center gap-2 text-[#8B93A7] font-mono text-xs uppercase tracking-wider mb-3">
                      <Calendar size={14} />
                      {new Date(ev.event_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <h3 className={`font-bold mb-2 group-hover:text-white transition-colors ${i === 0 && !search ? 'text-3xl' : 'text-xl'}`}>{ev.title}</h3>
                    <div className="flex items-center gap-2 text-[#8B93A7] text-sm mb-4">
                      <MapPin size={14} />
                      <span className="truncate">{ev.venue}</span>
                    </div>
                  </div>
                  
                  {Number(ev.seats_available) <= 10 && (
                    <div className="inline-flex items-center gap-1.5 text-[#C1443D] text-xs font-bold bg-[#C1443D]/10 px-3 py-1.5 rounded-md mt-4 w-fit">
                      <Users size={14} />
                      Only {ev.seats_available} seats left!
                    </div>
                  )}
                </div>

                <div className={`p-6 bg-[#12161F] flex flex-col justify-end flex-1 ${i === 0 && !search ? 'border-t md:border-t-0 border-[#232838]' : 'border-t border-[#232838]'}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-white">
                      ₹{ev.price || '1000'}
                    </span>
                    <button className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2">
                      Get Tickets <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}