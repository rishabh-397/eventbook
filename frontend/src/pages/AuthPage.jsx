import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import StarfieldBackground from '../components/StarfieldBackground';
import Logo from '../components/Logo';
import { ArrowRight, Mail, Lock, User } from 'lucide-react';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/signup';
      const payload = mode === 'login'
        ? { email: form.email, password: form.password }
        : form;
      const res = await api.post(endpoint, payload);
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/events');
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0E14] relative overflow-hidden px-4">
      <StarfieldBackground />
      
      {/* Animated Gradient Blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="glass-card w-full max-w-[420px] p-8 md:p-10 relative z-10"
      >
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-8 flex flex-col items-center text-center"
        >
          <div className="inline-block mb-6 animate-float">
            <Logo size={48} textSize={32} />
          </div>
          <p className="font-mono text-[#E8B563] text-xs tracking-[0.2em] uppercase mb-2">Welcome to EventBook</p>
          <h1 className="text-2xl md:text-3xl font-display font-semibold text-white">
            {mode === 'login' ? 'Sign In to Continue' : 'Create an Account'}
          </h1>
        </motion.div>

        <div className="flex p-1 bg-[#0B0E14]/50 rounded-lg mb-8 border border-[#232838]">
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${mode === 'login' ? 'bg-[#E8B563] text-[#0B0E14] shadow-md' : 'text-[#8B93A7] hover:text-white'}`}
            onClick={() => { setMode('login'); setError(''); }}
            type="button"
          >
            Log In
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-all duration-300 ${mode === 'signup' ? 'bg-[#E8B563] text-[#0B0E14] shadow-md' : 'text-[#8B93A7] hover:text-white'}`}
            onClick={() => { setMode('signup'); setError(''); }}
            type="button"
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <AnimatePresence mode="popLayout">
            {mode === 'signup' && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="relative"
              >
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User size={18} className="text-[#8B93A7]" />
                </div>
                <input
                  className="input-base pl-11"
                  placeholder="Full Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail size={18} className="text-[#8B93A7]" />
            </div>
            <input
              className="input-base pl-11"
              type="email"
              placeholder="Email Address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock size={18} className="text-[#8B93A7]" />
            </div>
            <input
              className="input-base pl-11"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>

          <AnimatePresence>
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-[#C1443D] text-sm font-medium bg-[#C1443D]/10 p-3 rounded-lg border border-[#C1443D]/20"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>

          <button 
            type="submit" 
            className="btn-primary mt-2 flex items-center justify-center gap-2 group relative overflow-hidden" 
            disabled={loading}
          >
            <span className="relative z-10 flex items-center gap-2">
              {loading ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </span>
            {loading && <div className="absolute inset-0 shimmer opacity-50"></div>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}