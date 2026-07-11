import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import StarfieldBackground from '../components/StarfieldBackground';

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
    <div style={styles.page}>
      <StarfieldBackground />
      <div style={{ ...styles.card, position: 'relative', zIndex: 1 }}>
        <p style={styles.eyebrow}>Admit One</p>
        <h1 style={styles.title}>EventBook</h1>

        <div style={styles.tabs}>
          <button
            style={mode === 'login' ? styles.tabActive : styles.tab}
            onClick={() => setMode('login')}
          >
            Log In
          </button>
          <button
            style={mode === 'signup' ? styles.tabActive : styles.tab}
            onClick={() => setMode('signup')}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <input
              style={styles.input}
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          )}
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            style={styles.input}
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submit} disabled={loading}>
            {loading ? 'Please wait…' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'var(--bg)',
    position: 'relative',
    overflow: 'hidden',
  },
  card: {
    width: 380,
    padding: '40px 32px',
    background: 'rgba(18, 22, 31, 0.85)',
    backdropFilter: 'blur(8px)',
    border: '1px solid var(--border)',
    borderRadius: 4,
  },
  eyebrow: {
    color: 'var(--gold)',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    margin: 0,
  },
  title: {
    fontSize: 32,
    margin: '4px 0 24px',
  },
  tabs: { display: 'flex', gap: 8, marginBottom: 24 },
  tab: {
    flex: 1,
    padding: '10px 0',
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: 4,
  },
  tabActive: {
    flex: 1,
    padding: '10px 0',
    background: 'var(--gold)',
    border: '1px solid var(--gold)',
    color: '#0B0E14',
    fontWeight: 600,
    borderRadius: 4,
  },
  form: { display: 'flex', flexDirection: 'column', gap: 12 },
  input: {
    padding: '12px 14px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
    borderRadius: 4,
    color: 'var(--text)',
    fontSize: 14,
  },
  submit: {
    marginTop: 8,
    padding: '12px 0',
    background: 'var(--gold)',
    border: 'none',
    borderRadius: 4,
    color: '#0B0E14',
    fontWeight: 600,
    fontSize: 14,
  },
  error: {
    color: 'var(--seat-held)',
    fontSize: 13,
    margin: 0,
  },
};