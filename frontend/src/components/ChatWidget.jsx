import { useState, useRef, useEffect } from 'react';
import api from '../api/client';

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'Hi! Ask me about upcoming events — like "what\'s on in Mumbai this month?"',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages]);

  async function sendMessage(e) {
    e.preventDefault();

    if (!input.trim() || loading) return;

    const userMsg = input.trim();

    setMessages((prev) => [
      ...prev,
      { role: 'user', text: userMsg },
    ]);

    setInput('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');

      if (!token) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: 'Please log in to use the EventBook Assistant.',
          },
        ]);
        return;
      }

      const res = await api.post(
        '/chat',
        {
          message: userMsg,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: res.data.reply || 'I received your message, but no reply was returned.',
        },
      ]);
    } catch (err) {
      console.error(
        'Chat error:',
        err.response?.data || err.message
      );

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: "Sorry, I couldn't respond right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        style={styles.bubble}
        onClick={() => setOpen(!open)}
      >
        {open ? '✕' : '💬'}
      </button>

      {open && (
        <div style={styles.panel}>
          <div style={styles.header}>
            <p style={styles.headerText}>
              EventBook Assistant
            </p>
          </div>

          <div
            style={styles.messages}
            ref={scrollRef}
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  ...styles.message,
                  alignSelf:
                    m.role === 'user'
                      ? 'flex-end'
                      : 'flex-start',
                  background:
                    m.role === 'user'
                      ? 'var(--gold)'
                      : 'var(--bg)',
                  color:
                    m.role === 'user'
                      ? '#0B0E14'
                      : 'var(--text)',
                }}
              >
                {m.text}
              </div>
            ))}

            {loading && (
              <div
                style={{
                  ...styles.message,
                  background: 'var(--bg)',
                  color: 'var(--text-muted)',
                }}
              >
                Thinking…
              </div>
            )}
          </div>

          <form
            onSubmit={sendMessage}
            style={styles.inputRow}
          >
            <input
              style={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about events…"
              disabled={loading}
            />

            <button
              type="submit"
              style={styles.sendBtn}
              disabled={loading}
            >
              →
            </button>
          </form>
        </div>
      )}
    </>
  );
}

const styles = {
  bubble: {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: 'var(--gold)',
    border: 'none',
    fontSize: 22,
    cursor: 'pointer',
    zIndex: 200,
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
  },

  panel: {
    position: 'fixed',
    bottom: 92,
    right: 24,
    width: 340,
    height: 460,
    background: 'var(--bg-elevated)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    zIndex: 200,
    overflow: 'hidden',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
  },

  header: {
    padding: '14px 16px',
    borderBottom: '1px solid var(--border)',
  },

  headerText: {
    margin: 0,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--gold)',
  },

  messages: {
    flex: 1,
    overflowY: 'auto',
    padding: 16,
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
  },

  message: {
    maxWidth: '85%',
    padding: '10px 12px',
    borderRadius: 8,
    fontSize: 13,
    lineHeight: 1.4,
  },

  inputRow: {
    display: 'flex',
    borderTop: '1px solid var(--border)',
  },

  input: {
    flex: 1,
    padding: '12px 14px',
    background: 'transparent',
    border: 'none',
    color: 'var(--text)',
    fontSize: 13,
    outline: 'none',
  },

  sendBtn: {
    padding: '0 18px',
    background: 'var(--gold)',
    border: 'none',
    color: '#0B0E14',
    fontWeight: 700,
    cursor: 'pointer',
  },
};