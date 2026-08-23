import { useState, useRef, useEffect } from 'react';
import api from '../api/client';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

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
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, loading, open]);

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
          text: err.response?.data?.error || "Sorry, I couldn't respond right now.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const TypingIndicator = () => (
    <div className="flex gap-1 items-center px-1 py-2">
      <motion.div className="w-1.5 h-1.5 bg-[#8B93A7] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0 }} />
      <motion.div className="w-1.5 h-1.5 bg-[#8B93A7] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }} />
      <motion.div className="w-1.5 h-1.5 bg-[#8B93A7] rounded-full" animate={{ y: [0, -5, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }} />
    </div>
  );

  return (
    <div className="fixed bottom-6 right-6 z-50 font-body">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[380px] h-[500px] glass-card flex flex-col overflow-hidden shadow-2xl border-[#E8B563]/20"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#E8B563] to-[#F0C57B] px-5 py-4 flex items-center justify-between shadow-md relative z-10">
              <div className="flex items-center gap-3 text-[#0B0E14]">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-sm">EventBook Assistant</h3>
                  <p className="text-xs opacity-80 font-medium">AI-powered recommendations</p>
                </div>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="text-[#0B0E14] hover:bg-white/20 p-1.5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div 
              className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 bg-[#0B0E14]/60 backdrop-blur-md hide-scrollbar"
              ref={scrollRef}
            >
              {messages.map((m, i) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={i}
                  className={`flex gap-3 max-w-[85%] ${m.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                >
                  <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[10px] ${m.role === 'user' ? 'bg-[#E8B563]/20 text-[#E8B563]' : 'bg-[#232838] text-white'}`}>
                    {m.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  </div>
                  <div 
                    className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      m.role === 'user' 
                        ? 'bg-[#E8B563] text-[#0B0E14] rounded-tr-sm' 
                        : 'bg-[#1A1F2E] text-[#EDEAE3] border border-[#232838] rounded-tl-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3 max-w-[85%] self-start"
                >
                  <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center bg-[#232838] text-white">
                    <Bot size={12} />
                  </div>
                  <div className="px-4 py-2.5 rounded-2xl bg-[#1A1F2E] border border-[#232838] rounded-tl-sm">
                    <TypingIndicator />
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={sendMessage} className="p-3 bg-[#12161F] border-t border-[#232838] flex items-end gap-2">
              <input
                className="flex-1 bg-[#0B0E14] border border-[#232838] rounded-xl px-4 py-3 text-sm text-white placeholder:text-[#8B93A7] focus:outline-none focus:border-[#E8B563] transition-colors"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask something..."
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 w-11 h-11 bg-[#E8B563] text-[#0B0E14] rounded-xl flex items-center justify-center hover:bg-[#F0C57B] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_10px_rgba(232,181,99,0.2)]"
              >
                <Send size={18} className="ml-1" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="w-14 h-14 bg-gradient-to-br from-[#E8B563] to-[#F0C57B] rounded-full flex items-center justify-center text-[#0B0E14] shadow-[0_4px_20px_rgba(232,181,99,0.4)] border-2 border-white/20 relative"
        onClick={() => setOpen(!open)}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageSquare size={24} />
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Unread indicator pulse */}
        {!open && (
          <div className="absolute top-0 right-0 w-3 h-3 bg-[#C1443D] rounded-full border-2 border-[#0B0E14] shadow-sm">
            <div className="w-full h-full rounded-full bg-[#C1443D] animate-ping opacity-75"></div>
          </div>
        )}
      </motion.button>
    </div>
  );
}