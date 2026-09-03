import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Ticket, IndianRupee, Activity, ArrowLeft, LayoutDashboard, MapPin, Calendar, Sparkles, Search, Image, X, Check } from 'lucide-react';

const PRESET_IMAGE_TAGS = ['Coldplay', 'Arijit Singh', 'Diljit Dosanjh', 'Zakir Khan', 'Sunidhi Chauhan', 'Concert', 'Comedy', 'EDM', 'Classical', 'Cricket'];

export default function AdminDashboardPage() {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [imageResults, setImageResults] = useState([]);
  const [searchingImages, setSearchingImages] = useState(false);
  const [form, setForm] = useState({
    title: '', description: '', venue: '', eventTime: '',
    seatRows: 5, seatsPerRow: 10, price: 1000, latitude: '', longitude: '', imageUrl: '',
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
        latitude: form.latitude ? Number(form.latitude) : null,
        longitude: form.longitude ? Number(form.longitude) : null,
      });
      setShowForm(false);
      setForm({ title: '', description: '', venue: '', eventTime: '', seatRows: 5, seatsPerRow: 10, price: 1000, latitude: '', longitude: '', imageUrl: '' });
      loadSummary();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create event');
    } finally {
      setCreating(false);
    }
  }

  async function handleSearchImages(q) {
    const query = (q !== undefined ? q : searchQuery).trim();
    if (!query) return;
    setSearchingImages(true);
    try {
      const res = await api.get('/events/search-images', { params: { q: query } });
      setImageResults(res.data.results || []);
    } catch (err) {
      console.error('Failed to search images:', err);
    } finally {
      setSearchingImages(false);
    }
  }

  function openImagePicker() {
    setShowImagePicker(true);
    const initialQuery = form.title.split(':')[0].trim() || 'Concert';
    setSearchQuery(initialQuery);
    handleSearchImages(initialQuery);
  }


  const totalRevenue = summary.reduce((sum, e) => sum + Number(e.revenue), 0);
  const totalBooked = summary.reduce((sum, e) => sum + Number(e.seats_booked), 0);

  return (
    <div className="min-h-screen bg-[#0B0E14] pb-24">
      <div className="max-w-6xl mx-auto px-6 pt-12">
        <button onClick={() => navigate('/events')} className="flex items-center gap-2 text-[#8B93A7] hover:text-white transition-colors text-sm mb-6 font-medium">
          <ArrowLeft size={16} /> Back to Events
        </button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-3 text-[#E8B563] font-mono text-sm tracking-widest uppercase mb-2">
              <LayoutDashboard size={18} /> Box Office
            </div>
            <h1 className="text-4xl font-display font-bold text-white">Admin Dashboard</h1>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold transition-all shadow-lg ${showForm ? 'bg-[#232838] text-white hover:bg-[#32384A]' : 'bg-[#E8B563] text-[#0B0E14] hover:bg-[#F0C57B] shadow-[0_0_20px_rgba(232,181,99,0.2)]'}`}
          >
            {showForm ? 'Cancel' : <><Plus size={20} /> New Event</>}
          </button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#4A9B7F]/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-[#4A9B7F]/20"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#4A9B7F]/10 text-[#4A9B7F] flex items-center justify-center">
                <Activity size={20} />
              </div>
              <p className="font-mono text-xs text-[#8B93A7] uppercase tracking-wider">Total Events</p>
            </div>
            <p className="text-4xl font-display font-bold text-white">{summary.length}</p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#E8B563]/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all group-hover:bg-[#E8B563]/20"></div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-[#E8B563]/10 text-[#E8B563] flex items-center justify-center">
                <Ticket size={20} />
              </div>
              <p className="font-mono text-xs text-[#8B93A7] uppercase tracking-wider">Seats Booked</p>
            </div>
            <p className="text-4xl font-display font-bold text-white">{totalBooked}</p>
          </div>

          <div className="glass-card p-6 relative overflow-hidden group border-[#E8B563]/30 shadow-[0_0_30px_rgba(232,181,99,0.05)]">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#E8B563]/20 to-[#F0C57B]/10 rounded-full blur-3xl -mr-10 -mt-10 transition-all group-hover:scale-110"></div>
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#E8B563] to-[#F0C57B] text-[#0B0E14] flex items-center justify-center shadow-lg shadow-[#E8B563]/20">
                <IndianRupee size={20} />
              </div>
              <p className="font-mono text-xs text-[#E8B563] uppercase tracking-wider font-semibold">Total Revenue</p>
            </div>
            <p className="text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-[#E8B563] relative z-10">
              ₹{totalRevenue.toLocaleString()}
            </p>
          </div>
        </div>

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ height: 0, opacity: 0, y: -20 }}
              animate={{ height: 'auto', opacity: 1, y: 0 }}
              exit={{ height: 0, opacity: 0, y: -20 }}
              className="overflow-hidden mb-12"
            >
              <form onSubmit={handleCreate} className="glass-card p-8 border-[#E8B563]/20">
                <h2 className="text-xl font-display font-bold mb-6 flex items-center gap-2">
                  <Plus className="text-[#E8B563]" /> Create New Event
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider mb-2">Event Title</label>
                    <input className="input-base" placeholder="e.g. Neon Nights Concert" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider mb-2">Venue</label>
                    <div className="relative">
                      <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B93A7]" />
                      <input className="input-base pl-11" placeholder="e.g. The Grand Theater" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
                    </div>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider mb-2">Description</label>
                  <textarea className="input-base min-h-[100px] resize-y" placeholder="Event details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                </div>

                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider">
                      Poster Image URL (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={openImagePicker}
                      className="inline-flex items-center gap-1.5 text-xs text-[#E8B563] hover:text-[#F0C57B] bg-[#E8B563]/10 hover:bg-[#E8B563]/20 px-3 py-1 rounded-lg transition-all font-medium border border-[#E8B563]/20 cursor-pointer"
                    >
                      <Sparkles size={13} /> Search Online Images
                    </button>
                  </div>
                  <div className="relative">
                    <input 
                      className="input-base pr-10" 
                      placeholder="https://images.unsplash.com/... or click Search Online" 
                      value={form.imageUrl} 
                      onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} 
                    />
                    {form.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, imageUrl: '' })}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B93A7] hover:text-white p-1"
                        title="Clear image"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>

                  {form.imageUrl ? (
                    <div className="mt-3 relative rounded-xl overflow-hidden border border-[#232838] h-36 bg-[#12161F] group">
                      <img 
                        src={form.imageUrl} 
                        alt="Poster preview" 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300"
                        onError={(e) => { e.target.style.opacity = '0.3'; }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-3 justify-between">
                        <span className="text-xs text-white/90 font-medium flex items-center gap-1.5 backdrop-blur-md bg-black/40 px-2.5 py-1 rounded-md">
                          <Image size={13} className="text-[#E8B563]" /> Poster Preview
                        </span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={openImagePicker}
                            className="text-xs bg-[#E8B563]/20 hover:bg-[#E8B563]/30 text-[#E8B563] px-2.5 py-1 rounded-md border border-[#E8B563]/30 transition-colors"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, imageUrl: '' })}
                            className="text-xs bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2.5 py-1 rounded-md border border-red-500/30 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#8B93A7] mt-1.5 flex items-center gap-1">
                      💡 <span>Leave blank to automatically match & assign an HD poster based on the event title.</span>
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider mb-2">Event Date & Time</label>
                    <div className="relative">
                      <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B93A7]" />
                      <input className="input-base pl-11 [color-scheme:dark]" type="datetime-local" value={form.eventTime} onChange={(e) => setForm({ ...form, eventTime: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider mb-2">Price Per Seat (₹)</label>
                    <input className="input-base" type="number" placeholder="1000" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider mb-2">Rows</label>
                      <input className="input-base" type="number" min="1" value={form.seatRows} onChange={(e) => setForm({ ...form, seatRows: e.target.value })} required />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider mb-2">Seats/Row</label>
                      <input className="input-base" type="number" min="1" value={form.seatsPerRow} onChange={(e) => setForm({ ...form, seatsPerRow: e.target.value })} required />
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider mb-2">Latitude</label>
                      <input className="input-base" type="number" step="any" placeholder="19.0760" value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-mono text-[#8B93A7] uppercase tracking-wider mb-2">Longitude</label>
                      <input className="input-base" type="number" step="any" placeholder="72.8777" value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-[#8B93A7] mb-6 flex items-center gap-2">
                  <MapPin size={12} /> Tip: Right-click a pin on Google Maps to copy exact coordinates.
                </p>

                {error && <p className="text-[#C1443D] text-sm font-medium bg-[#C1443D]/10 p-3 rounded-lg border border-[#C1443D]/20 mb-6">{error}</p>}
                
                <button type="submit" className="btn-primary w-full md:w-auto" disabled={creating}>
                  {creating ? 'Creating Event...' : 'Publish Event'}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        <h2 className="text-xl font-display font-semibold mb-6">Manage Events</h2>

        {loading ? (
          <div className="w-full h-64 rounded-xl bg-[#12161F] border border-[#232838] shimmer"></div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#1A1F2E]/80 border-b border-[#232838]">
                    <th className="p-4 text-xs font-mono text-[#8B93A7] uppercase tracking-wider font-semibold">Event Details</th>
                    <th className="p-4 text-xs font-mono text-[#8B93A7] uppercase tracking-wider font-semibold">Date</th>
                    <th className="p-4 text-xs font-mono text-[#8B93A7] uppercase tracking-wider font-semibold">Occupancy</th>
                    <th className="p-4 text-xs font-mono text-[#8B93A7] uppercase tracking-wider font-semibold">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#232838]">
                  {summary.map((ev) => {
                    const percentage = ev.total_seats > 0 ? (ev.seats_booked / ev.total_seats) * 100 : 0;
                    return (
                      <tr key={ev.id} className="hover:bg-[#1A1F2E]/40 transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-white mb-1">{ev.title}</p>
                        </td>
                        <td className="p-4 text-sm text-[#8B93A7]">
                          {new Date(ev.event_time).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-2 w-32">
                            <div className="flex justify-between text-xs font-mono">
                              <span className="text-white">{ev.seats_booked} / {ev.total_seats}</span>
                              <span className="text-[#8B93A7]">{Math.round(percentage)}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#232838] rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${percentage > 80 ? 'bg-[#4A9B7F]' : percentage > 40 ? 'bg-[#E8B563]' : 'bg-[#8B93A7]'}`} 
                                style={{ width: `${percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="font-semibold text-[#E8B563]">₹{Number(ev.revenue).toLocaleString()}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {summary.length === 0 && (
                <div className="p-12 text-center text-[#8B93A7]">
                  No events created yet.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Online Image Search Modal */}
      <AnimatePresence>
        {showImagePicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#12161F] border border-[#232838] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-[#232838] flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-display font-bold text-white flex items-center gap-2">
                    <Sparkles className="text-[#E8B563]" size={20} /> Search Online Event Posters
                  </h3>
                  <p className="text-xs text-[#8B93A7] mt-1">
                    Find and select official artist and concert photography from Wikimedia & HD archives.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(false)}
                  className="p-2 text-[#8B93A7] hover:text-white rounded-lg hover:bg-[#232838] transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Search Bar & Quick Tags */}
              <div className="p-6 border-b border-[#232838] bg-[#0B0E14]/40">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSearchImages();
                  }}
                  className="flex gap-3 mb-4"
                >
                  <div className="relative flex-1">
                    <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8B93A7]" />
                    <input
                      type="text"
                      className="input-base pl-11"
                      placeholder="Search artist name, festival, band, comedy, or genre..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={searchingImages}
                    className="px-6 py-2.5 rounded-lg font-bold bg-[#E8B563] text-[#0B0E14] hover:bg-[#F0C57B] transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    {searchingImages ? 'Searching...' : 'Search'}
                  </button>
                </form>

                {/* Preset Category Chips */}
                <div className="flex flex-wrap gap-2 items-center">
                  <span className="text-xs text-[#8B93A7] font-mono uppercase tracking-wider mr-1">Popular:</span>
                  {PRESET_IMAGE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        setSearchQuery(tag);
                        handleSearchImages(tag);
                      }}
                      className="text-xs px-2.5 py-1 rounded-md bg-[#232838]/60 hover:bg-[#E8B563]/20 hover:text-[#E8B563] text-[#8B93A7] border border-[#232838] transition-all cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Image Grid Results */}
              <div className="p-6 overflow-y-auto flex-1 min-h-[300px]">
                {searchingImages ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <div key={n} className="h-40 rounded-xl bg-[#232838]/30 shimmer"></div>
                    ))}
                  </div>
                ) : imageResults.length === 0 ? (
                  <div className="text-center py-16 text-[#8B93A7]">
                    <Search size={40} className="mx-auto mb-3 opacity-40" />
                    <p className="font-semibold text-white">No images found</p>
                    <p className="text-xs mt-1">Try typing an artist name like &quot;Arijit Singh&quot;, &quot;Coldplay&quot;, or &quot;Concert&quot;.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {imageResults.map((img, idx) => {
                      const isSelected = form.imageUrl === img.url;
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setForm({ ...form, imageUrl: img.url });
                            setShowImagePicker(false);
                          }}
                          className={`group relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all hover:scale-[1.03] shadow-md aspect-[4/3] bg-[#0B0E14] ${
                            isSelected ? 'border-[#E8B563] ring-2 ring-[#E8B563]/50' : 'border-[#232838] hover:border-[#E8B563]/50'
                          }`}
                        >
                          <img
                            src={img.thumb || img.url}
                            alt={img.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=400&q=80';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2.5">
                            <div className="flex justify-end">
                              {isSelected ? (
                                <span className="bg-[#E8B563] text-[#0B0E14] rounded-full p-1 shadow">
                                  <Check size={12} strokeWidth={3} />
                                </span>
                              ) : (
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/60 text-white/80 backdrop-blur-sm">
                                  {img.source || 'Web'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs font-semibold text-white truncate drop-shadow-md">
                              {img.title}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-[#232838] bg-[#0B0E14]/60 flex items-center justify-between text-xs text-[#8B93A7]">
                <span>Click any image to select it as the event poster.</span>
                <button
                  type="button"
                  onClick={() => setShowImagePicker(false)}
                  className="px-4 py-2 rounded-lg bg-[#232838] hover:bg-[#32384A] text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}