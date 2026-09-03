import { useState, useEffect } from 'react';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Smartphone, ShieldCheck, CheckCircle, AlertCircle, Sparkles, X, Lock } from 'lucide-react';

export default function PaymentModal({ booking, amount, onSuccess, onClose }) {
  const [activeTab, setActiveTab] = useState('card'); // 'card' | 'upi'
  const [card, setCard] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [upiId, setUpiId] = useState('');
  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [processingState, setProcessingState] = useState(null); // null | 'authorizing' | 'verifying' | 'success'
  const [error, setError] = useState('');

  useEffect(() => {
    async function initOrder() {
      if (!booking?.bookingId) {
        setLoadingOrder(false);
        return;
      }
      try {
        const res = await api.post('/payments/create-order', {
          bookingId: booking.bookingId
        });
        setOrder(res.data);
      } catch (err) {
        console.error('Order creation failed:', err);
        setError(err.response?.data?.error || 'Failed to initialize payment session');
      } finally {
        setLoadingOrder(false);
      }
    }
    initOrder();
  }, [booking]);

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
  }

  function fillTestCard(shouldDecline = false) {
    setCard({
      number: shouldDecline ? '4000 0000 0000 0000' : '4242 4242 4242 4242',
      expiry: '12/28',
      cvv: '123',
      name: shouldDecline ? 'Declined User' : 'Test Cardholder'
    });
    setError('');
  }

  async function handlePay(e) {
    e.preventDefault();
    setError('');
    setProcessingState('authorizing');

    try {
      // Step 1: Simulated Gateway Handshake
      await new Promise((r) => setTimeout(r, 900));
      setProcessingState('verifying');

      // Step 2: Cryptographic / Server verification
      const res = await api.post('/payments/verify', {
        bookingId: booking.bookingId,
        orderId: order?.orderId,
        paymentMethod: activeTab,
        testCardNumber: card.number.replace(/\s/g, '')
      });

      await new Promise((r) => setTimeout(r, 600));
      setProcessingState('success');

      await new Promise((r) => setTimeout(r, 700));
      onSuccess(res.data);
    } catch (err) {
      setProcessingState(null);
      setError(err.response?.data?.error || 'Payment declined. Please try again.');
    }
  }

  const finalAmount = order?.amount || amount || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#12161F] border border-[#232838] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#232838] flex items-center justify-between bg-[#0B0E14]/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#E8B563]/10 text-[#E8B563] flex items-center justify-center">
              <Lock size={16} />
            </div>
            <div>
              <h3 className="font-display font-bold text-lg leading-tight">Payment Checkout</h3>
              <p className="text-[11px] font-mono text-[#8B93A7] uppercase tracking-wider">
                Stripe & UPI Test Gateway
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#8B93A7] hover:text-white p-1 rounded-lg hover:bg-[#232838] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Processing State Overlay */}
        <AnimatePresence>
          {processingState && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center justify-center text-center space-y-4"
            >
              {processingState === 'success' ? (
                <div className="w-16 h-16 rounded-full bg-[#4A9B7F]/20 text-[#4A9B7F] flex items-center justify-center">
                  <CheckCircle size={40} />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-full border-4 border-[#232838] border-t-[#E8B563] animate-spin" />
              )}
              <div>
                <h4 className="text-lg font-bold">
                  {processingState === 'authorizing' && 'Contacting Bank Gateway...'}
                  {processingState === 'verifying' && 'Verifying Payment & Holding Locks...'}
                  {processingState === 'success' && 'Payment Verified & Confirmed!'}
                </h4>
                <p className="text-xs text-[#8B93A7] mt-1 font-mono">
                  {order?.orderId ? `Order #${order.orderId}` : 'Processing Transaction'}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!processingState && (
          <div className="p-6">
            {/* Amount Summary */}
            <div className="bg-[#0B0E14] p-4 rounded-xl border border-[#232838] mb-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-mono uppercase text-[#8B93A7] tracking-wider block">
                  Total Payable
                </span>
                <span className="text-2xl font-bold font-display text-[#E8B563]">
                  ₹{finalAmount.toLocaleString()}
                </span>
              </div>
              {order?.seats && (
                <div className="text-right">
                  <span className="text-[11px] font-mono uppercase text-[#8B93A7] tracking-wider block">
                    Seats
                  </span>
                  <span className="font-mono text-xs font-semibold text-white">
                    {order.seats.join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method Selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[#0B0E14] rounded-lg border border-[#232838] mb-5">
              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'card'
                    ? 'bg-[#E8B563] text-[#0B0E14] shadow'
                    : 'text-[#8B93A7] hover:text-white'
                }`}
              >
                <CreditCard size={14} /> Card (Test)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`flex items-center justify-center gap-2 py-2 rounded-md text-xs font-semibold transition-all ${
                  activeTab === 'upi'
                    ? 'bg-[#E8B563] text-[#0B0E14] shadow'
                    : 'text-[#8B93A7] hover:text-white'
                }`}
              >
                <Smartphone size={14} /> UPI / QR
              </button>
            </div>

            {/* Card Form */}
            {activeTab === 'card' ? (
              <form onSubmit={handlePay} className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-[#8B93A7] uppercase tracking-wider">
                    Card Details
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fillTestCard(false)}
                      className="text-[10px] font-mono bg-[#E8B563]/10 hover:bg-[#E8B563]/20 text-[#E8B563] px-2 py-0.5 rounded border border-[#E8B563]/30 flex items-center gap-1 transition-colors"
                    >
                      <Sparkles size={10} /> Test Card
                    </button>
                    <button
                      type="button"
                      onClick={() => fillTestCard(true)}
                      className="text-[10px] font-mono bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 transition-colors"
                      title="Test simulated decline handling"
                    >
                      Simulate Decline
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <input
                    className="input-base text-sm font-mono"
                    placeholder="4242 4242 4242 4242"
                    value={card.number}
                    onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                    maxLength={19}
                    required
                  />
                  <CreditCard size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8B93A7]" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <input
                      className="input-base text-sm font-mono"
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <input
                      className="input-base text-sm font-mono"
                      placeholder="CVV (123)"
                      type="password"
                      value={card.cvv}
                      onChange={(e) => setCard({ ...card, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      maxLength={4}
                      required
                    />
                  </div>
                </div>

                <div>
                  <input
                    className="input-base text-sm"
                    placeholder="Cardholder Name"
                    value={card.name}
                    onChange={(e) => setCard({ ...card, name: e.target.value })}
                    required
                  />
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingOrder}
                  className="w-full py-3 rounded-lg font-bold bg-[#E8B563] text-[#0B0E14] hover:bg-[#F0C57B] transition-colors shadow-lg shadow-[#E8B563]/20 flex items-center justify-center gap-2 mt-2"
                >
                  <ShieldCheck size={18} /> Pay ₹{finalAmount.toLocaleString()}
                </button>
              </form>
            ) : (
              /* UPI Form */
              <form onSubmit={handlePay} className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono text-[#8B93A7] uppercase tracking-wider mb-1.5 block">
                    Enter Virtual Payment Address (VPA)
                  </label>
                  <input
                    className="input-base text-sm"
                    placeholder="username@okhdfcbank or phone@upi"
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    required
                  />
                </div>

                <div className="flex gap-2">
                  {['test@okaxis', 'demo@upi', 'user@paytm'].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setUpiId(preset)}
                      className="text-[10px] font-mono bg-[#232838]/60 hover:bg-[#E8B563]/20 hover:text-[#E8B563] text-[#8B93A7] px-2 py-1 rounded border border-[#232838] transition-all"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                {error && (
                  <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle size={14} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loadingOrder}
                  className="w-full py-3 rounded-lg font-bold bg-[#E8B563] text-[#0B0E14] hover:bg-[#F0C57B] transition-colors shadow-lg shadow-[#E8B563]/20 flex items-center justify-center gap-2"
                >
                  <Smartphone size={18} /> Verify & Pay ₹{finalAmount.toLocaleString()}
                </button>
              </form>
            )}

            <div className="mt-4 pt-4 border-t border-[#232838] flex items-center justify-between text-[11px] text-[#8B93A7]">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[#4A9B7F]" /> 256-bit SSL Encrypted
              </span>
              <span>Test Mode Sandbox</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}