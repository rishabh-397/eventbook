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
    const reply = await generateWithRetry(model, prompt);

    return res.status(200).json({ reply });
  } catch (err) {
    console.error('chatWithAssistant error:', err);
    if (err.status === 429 || (err.message && err.message.includes('429'))) {
      return res.status(429).json({ error: "I'm currently receiving too many requests and hit my API quota. Please try again in a minute!" });
    }
    return res.status(500).json({ error: 'Failed to get assistant response' });
  }
}

/**
 * Retries transient failures (like Gemini's 503 "high demand" errors)
 * with a short exponential backoff, instead of failing the user's
 * request on the first temporary blip from the upstream API.
 */
async function generateWithRetry(model, prompt, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      const isLastAttempt = i === attempts - 1;
      // 503 is a temporary service issue, safe to quickly retry.
      // 429 usually means a strict quota hit requiring a 30s+ wait, so we fail fast.
      const isRetryable = err.status === 503;
      if (isLastAttempt || !isRetryable) throw err;
      await new Promise((resolve) => setTimeout(resolve, 500 * (i + 1)));
    }
  }
}

module.exports = { chatWithAssistant };