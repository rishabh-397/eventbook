import { useState, useEffect } from 'react';
import api from '../api/client';
import { motion } from 'framer-motion';
import { TrendingUp, Activity, IndianRupee, Users, Clock, Brain, Sparkles, RefreshCw, BarChart3, AlertCircle, CheckCircle, ArrowUpRight } from 'lucide-react';

export default function AnalyticsView({ events = [] }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || null);
  const [aiInsights, setAiInsights] = useState(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlatformAnalytics();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      loadEventAi(selectedEventId);
    }
  }, [selectedEventId]);

  async function loadPlatformAnalytics() {
    setLoading(true);
    try {
      const res = await api.get('/analytics/admin/overview');
      setAnalytics(res.data);
      if (!selectedEventId && res.data.topEvents?.[0]?.id) {
        setSelectedEventId(res.data.topEvents[0].id);
      }
    } catch (err) {
      console.error('Failed to load analytics:', err);
      setError('Could not load analytics data.');
    } finally {
      setLoading(false);
    }
  }

  async function loadEventAi(eventId) {
    setLoadingAi(true);
    try {
      const res = await api.get(`/analytics/event/${eventId}/ai-insights`);
      setAiInsights(res.data.insights);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setLoadingAi(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 rounded-xl bg-[#12161F] shimmer border border-[#232838]" />
          ))}
        </div>
        <div className="h-72 rounded-xl bg-[#12161F] shimmer border border-[#232838]" />
      </div>
    );
  }

  const summary = analytics?.summary || {};
  const sales = analytics?.salesOverTime || [];
  const peakHours = analytics?.peakHours || [];
  const topEvents = analytics?.topEvents || [];

  // SVG Area Chart calculations for Revenue Over Time
  const maxRevenue = Math.max(...sales.map(s => Number(s.revenue)), 1000);
  const chartWidth = 700;
  const chartHeight = 180;
  const paddingX = 40;
  const paddingY = 20;

  const points = sales.length > 1 ? sales.map((s, i) => {
    const x = paddingX + (i / (sales.length - 1)) * (chartWidth - paddingX * 2);
    const y = chartHeight - paddingY - (Number(s.revenue) / maxRevenue) * (chartHeight - paddingY * 2);
    return { x, y, ...s };
  }) : [];

  const pathD = points.length > 1
    ? `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ')
    : '';

  const areaD = points.length > 1
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  const selectedEvent = events.find(e => String(e.id) === String(selectedEventId)) || events[0];

  return (
    <div className="space-y-10">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3 text-[#E8B563]">
            <IndianRupee size={18} />
            <span className="text-xs font-mono uppercase tracking-wider text-[#8B93A7]">Total Gross</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">
            ₹{Number(summary.totalRevenue || 0).toLocaleString()}
          </p>
          <span className="text-xs text-[#4A9B7F] font-mono mt-1 block">Live Stripe & DB Transactions</span>
        </div>

        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3 text-[#4A9B7F]">
            <TrendingUp size={18} />
            <span className="text-xs font-mono uppercase tracking-wider text-[#8B93A7]">Occupancy Rate</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">
            {summary.occupancyRate || 0}%
          </p>
          <span className="text-xs text-[#8B93A7] font-mono mt-1 block">
            {summary.bookedSeats} / {summary.totalSeats} seats booked
          </span>
        </div>

        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3 text-[#3B82F6]">
            <Activity size={18} />
            <span className="text-xs font-mono uppercase tracking-wider text-[#8B93A7]">Avg Ticket Price</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">
            ₹{Number(summary.avgSeatPrice || 0).toLocaleString()}
          </p>
          <span className="text-xs text-[#8B93A7] font-mono mt-1 block">Across all venues</span>
        </div>

        <div className="glass-card p-5 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-3 text-[#A855F7]">
            <Users size={18} />
            <span className="text-xs font-mono uppercase tracking-wider text-[#8B93A7]">Active Inventory</span>
          </div>
          <p className="text-3xl font-display font-bold text-white">
            {summary.totalEvents || events.length}
          </p>
          <span className="text-xs text-[#8B93A7] font-mono mt-1 block">Live events scheduled</span>
        </div>
      </div>

      {/* 🤖 AI Event Insights Panel */}
      <div className="glass-card p-6 md:p-8 border border-[#E8B563]/30 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[#E8B563]/10 via-[#F0C57B]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#232838] relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#E8B563] to-[#F0C57B] text-[#0B0E14] flex items-center justify-center shadow-lg shadow-[#E8B563]/20">
              <Brain size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-display font-bold text-white">Gemini AI Event Insights</h3>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#E8B563]/20 text-[#E8B563] border border-[#E8B563]/30 font-semibold">
                  Live Predictive Engine
                </span>
              </div>
              <p className="text-xs text-[#8B93A7] mt-0.5">
                Automated sellout forecast, demand classification, and dynamic pricing optimization.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedEventId || ''}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="input-base text-xs py-2 pr-8 font-medium cursor-pointer max-w-xs truncate"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-[#12161F] text-white">
                  {ev.title}
                </option>
              ))}
            </select>
            <button
              onClick={() => selectedEventId && loadEventAi(selectedEventId)}
              disabled={loadingAi}
              className="p-2.5 rounded-lg bg-[#232838] hover:bg-[#32384A] text-white transition-colors"
              title="Refresh AI Insights"
            >
              <RefreshCw size={16} className={loadingAi ? 'animate-spin text-[#E8B563]' : ''} />
            </button>
          </div>
        </div>

        {/* AI Insight Metrics Grid */}
        <div className="pt-6 relative z-10">
          {loadingAi ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-10 h-10 border-3 border-[#232838] border-t-[#E8B563] rounded-full animate-spin mb-3" />
              <p className="text-xs font-mono text-[#8B93A7]">Gemini is analyzing booking velocity and pricing curves...</p>
            </div>
          ) : aiInsights ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-[#0B0E14]/70 border border-[#232838]">
                  <span className="text-[11px] font-mono text-[#8B93A7] uppercase block mb-1">Predicted Sell-Out</span>
                  <p className="text-lg font-bold text-[#E8B563] flex items-center gap-1.5">
                    <Clock size={16} /> {aiInsights.predictedSellout || 'In calculation'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#0B0E14]/70 border border-[#232838]">
                  <span className="text-[11px] font-mono text-[#8B93A7] uppercase block mb-1">Expected Occupancy</span>
                  <p className="text-lg font-bold text-[#4A9B7F] flex items-center gap-1.5">
                    <TrendingUp size={16} /> {aiInsights.expectedFinalOccupancy || 92}%
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#0B0E14]/70 border border-[#232838]">
                  <span className="text-[11px] font-mono text-[#8B93A7] uppercase block mb-1">Demand Rating</span>
                  <p className="text-lg font-bold text-white flex items-center gap-1.5">
                    <Sparkles size={16} className="text-[#E8B563]" /> {aiInsights.demandRating || 'High'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-[#0B0E14]/70 border border-[#232838]">
                  <span className="text-[11px] font-mono text-[#8B93A7] uppercase block mb-1">Peak Booking Window</span>
                  <p className="text-lg font-bold text-white flex items-center gap-1.5">
                    <Clock size={16} className="text-[#3B82F6]" /> {aiInsights.peakBookingWindow || '7 PM - 10 PM'}
                  </p>
                </div>
              </div>

              {/* Dynamic Price Adjustment Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-[#E8B563]/10 to-transparent border border-[#E8B563]/30 flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#E8B563] text-[#0B0E14] flex items-center justify-center font-bold shrink-0">
                  ₹
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Pricing Optimization Recommendation</h4>
                  <p className="text-xs text-[#E8B563] font-mono mt-0.5">
                    {aiInsights.recommendedPriceAdjustment}
                  </p>
                </div>
              </div>

              {/* Strategic Insights & Tactical Advice */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-5 rounded-xl bg-[#0B0E14]/50 border border-[#232838]">
                  <h4 className="text-xs font-mono uppercase tracking-wider text-[#8B93A7] mb-3 flex items-center gap-2">
                    <BarChart3 size={14} /> Key Data Observations
                  </h4>
                  <ul className="space-y-2">
                    {(aiInsights.keyInsights || []).map((ins, idx) => (
                      <li key={idx} className="text-xs text-[#EDEAE3] flex items-start gap-2 leading-relaxed">
                        <span className="text-[#E8B563] mt-1">•</span> {ins}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-[#0B0E14]/50 border border-[#232838] flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-[#8B93A7] mb-3 flex items-center gap-2">
                      <Sparkles size={14} className="text-[#4A9B7F]" /> Tactical Organizer Advice
                    </h4>
                    <p className="text-xs text-[#EDEAE3] leading-relaxed">
                      {aiInsights.actionableAdvice}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#232838] flex items-center justify-between text-[11px] text-[#8B93A7]">
                    <span>Event: {selectedEvent?.title}</span>
                    <span className="text-[#4A9B7F] font-mono">Status: Ready</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#8B93A7] text-center py-6">Select an event to generate AI Insights.</p>
          )}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sales Velocity Area Chart */}
        <div className="glass-card p-6 border border-[#232838]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Revenue Velocity Over Time</h3>
              <p className="text-xs text-[#8B93A7]">Gross booking revenue per transaction day</p>
            </div>
            <span className="text-xs font-mono text-[#E8B563] bg-[#E8B563]/10 px-2.5 py-1 rounded">
              Last 14 Days
            </span>
          </div>

          <div className="w-full h-56 flex items-center justify-center relative">
            {points.length > 1 ? (
              <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E8B563" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#E8B563" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid lines */}
                {[0.25, 0.5, 0.75].map((frac) => (
                  <line
                    key={frac}
                    x1={paddingX}
                    y1={chartHeight - paddingY - frac * (chartHeight - paddingY * 2)}
                    x2={chartWidth - paddingX}
                    y2={chartHeight - paddingY - frac * (chartHeight - paddingY * 2)}
                    stroke="#232838"
                    strokeDasharray="4 4"
                  />
                ))}
                {/* Fill Area */}
                <path d={areaD} fill="url(#revGrad)" />
                {/* Stroke Line */}
                <path d={pathD} fill="none" stroke="#E8B563" strokeWidth="2.5" />
                {/* Points */}
                {points.map((p, idx) => (
                  <g key={idx} className="group cursor-pointer">
                    <circle cx={p.x} cy={p.y} r="4" fill="#0B0E14" stroke="#E8B563" strokeWidth="2" />
                    <text
                      x={p.x}
                      y={p.y - 10}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="9"
                      fontFamily="monospace"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ₹{Number(p.revenue).toLocaleString()}
                    </text>
                  </g>
                ))}
              </svg>
            ) : (
              <div className="text-center text-[#8B93A7] text-xs">
                <BarChart3 size={32} className="mx-auto mb-2 opacity-40" />
                No daily transaction data yet.
              </div>
            )}
          </div>
        </div>

        {/* Peak Booking Hours Distribution Bar Chart */}
        <div className="glass-card p-6 border border-[#232838]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-bold text-lg text-white">Peak Booking Hours</h3>
              <p className="text-xs text-[#8B93A7]">Hourly reservation activity across all 24 hours</p>
            </div>
            <span className="text-xs font-mono text-[#4A9B7F] bg-[#4A9B7F]/10 px-2.5 py-1 rounded">
              00:00 – 23:00
            </span>
          </div>

          <div className="w-full h-56 flex items-end justify-between gap-1 pt-6 px-2">
            {peakHours.map((h, i) => {
              const maxCount = Math.max(...peakHours.map(p => p.count), 1);
              const heightPct = Math.max(8, Math.round((h.count / maxCount) * 100));
              const isPeakWindow = i >= 18 && i <= 22; // 6 PM - 10 PM
              return (
                <div key={h.hour} className="flex-1 flex flex-col items-center gap-1 group relative">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all group-hover:scale-y-105 ${
                      isPeakWindow
                        ? 'bg-gradient-to-t from-[#E8B563] to-[#F0C57B] shadow-[0_0_8px_rgba(232,181,99,0.3)]'
                        : 'bg-[#232838] group-hover:bg-[#32384A]'
                    }`}
                  />
                  {i % 4 === 0 && (
                    <span className="text-[9px] font-mono text-[#8B93A7] -rotate-45 origin-top-left mt-2">
                      {h.hour.split(':')[0]}h
                    </span>
                  )}
                  {/* Tooltip */}
                  <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-black px-1.5 py-0.5 rounded text-[10px] font-mono text-white whitespace-nowrap z-20">
                    {h.hour}: {h.count}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
