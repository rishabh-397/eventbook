import { useState } from 'react';
import api from '../api/client';
import toast from 'react-hot-toast';
import { ScanLine, CheckCircle, XCircle } from 'lucide-react';

export default function AdminScannerPage() {
  const [ticketData, setTicketData] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  async function handleValidate(e) {
    e.preventDefault();
    if (!ticketData.trim()) return;

    setLoading(true);
    setLastResult(null);
    
    // Extract ID if it's the full QR code string (EVENTBOOK-CONFIRMED-<id>)
    const bookingId = ticketData.replace('EVENTBOOK-CONFIRMED-', '').trim();

    try {
      const res = await api.post('/bookings/validate', { bookingId: Number(bookingId) });
      toast.success('Ticket validated successfully!');
      setLastResult({ success: true, message: res.data.message });
      setTicketData('');
    } catch (err) {
      const msg = err.response?.data?.error || 'Validation failed';
      toast.error(msg);
      setLastResult({ success: false, message: msg });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto p-6 mt-12">
      <div className="glass-card p-8 text-center border-[#E8B563]/30">
        <div className="w-16 h-16 bg-[#E8B563]/10 text-[#E8B563] rounded-full flex items-center justify-center mx-auto mb-6">
          <ScanLine size={32} />
        </div>
        
        <h1 className="text-2xl font-display font-bold text-white mb-2">Ticket Scanner</h1>
        <p className="text-[#8B93A7] text-sm mb-8">Scan QR codes or manually enter ticket IDs to validate entry.</p>

        <form onSubmit={handleValidate} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="e.g. EVENTBOOK-CONFIRMED-42"
            value={ticketData}
            onChange={(e) => setTicketData(e.target.value)}
            className="w-full bg-[#12161F] border border-[#232838] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#E8B563] transition-colors text-center font-mono"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !ticketData.trim()}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Validating...' : 'Validate Ticket'}
          </button>
        </form>

        {lastResult && (
          <div className={`mt-8 p-4 rounded-xl flex items-start gap-3 text-left ${lastResult.success ? 'bg-[#4A9B7F]/10 border border-[#4A9B7F]/30 text-[#4A9B7F]' : 'bg-[#C1443D]/10 border border-[#C1443D]/30 text-[#C1443D]'}`}>
            {lastResult.success ? <CheckCircle size={20} className="shrink-0 mt-0.5" /> : <XCircle size={20} className="shrink-0 mt-0.5" />}
            <div>
              <p className="font-bold text-sm mb-1">{lastResult.success ? 'Valid Entry' : 'Invalid Entry'}</p>
              <p className="text-xs opacity-90">{lastResult.message}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
