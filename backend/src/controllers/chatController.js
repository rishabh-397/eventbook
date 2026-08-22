const pool = require('../config/db');
const genAI = require('../config/ai');

/**
 * AI Chatbot — RAG-lite pattern: fetch relevant events from Postgres,
 * inject them as context into the prompt, let Gemini answer using only
 * that real data. This avoids the model hallucinating events that don't
 * exist, since it's grounded in an actual DB query result.
 */
async function chatWithAssistant(req, res) {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const eventsResult = await pool.query(`
      SELECT title, venue, event_time,
        (SELECT MIN(price) FROM seats WHERE seats.event_id = events.id) AS min_price,
        (SELECT COUNT(*) FROM seats WHERE seats.event_id = events.id AND status = 'available') AS seats_available
      FROM events
      WHERE event_time > NOW()
      ORDER BY event_time ASC
      LIMIT 150
    `);

    const eventsContext = eventsResult.rows
      .map((e) =>
        `- "${e.title}" at ${e.venue} on ${new Date(e.event_time).toDateString()}, starting from ₹${e.min_price}, ${e.seats_available} seats available`
      )
      .join('\n');

    const prompt = `You are EventBook's helpful booking assistant. Answer questions about events using ONLY the event data provided below. If asked about something not in this list, say you don't have that information. Keep answers concise and friendly. Recommend specific events by name when relevant.

Available events:
${eventsContext}

User question: ${message}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-3.6-flash' });
    const result = await model.generateContent(prompt);
    const reply = result.response.text();

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('chatWithAssistant error:', err);
    return res.status(500).json({ error: 'Failed to get assistant response' });
  }
}

module.exports = { chatWithAssistant };