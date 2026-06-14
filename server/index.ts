import express from 'express';
import { createAnthropicCoach } from '../src/coaching/anthropicClient';
import type { ChatMessage } from '../src/engine/coaching';

/**
 * Backend for the coaching layer.
 *
 * Keeps ANTHROPIC_API_KEY server-side and exposes:
 *   POST /coach  — one-shot cue/feedback     { system, user } -> { text }
 *   POST /chat   — multi-turn conversation    { system, messages[] } -> { text }
 *   GET  /health — liveness probe
 *
 * Run locally: `npm run coach:server` (needs ANTHROPIC_API_KEY).
 * Deploy: any Node host — set ANTHROPIC_API_KEY and PORT. See server/README.md.
 *
 * The LLM only ever produces text; the deterministic engine (src/engine) owns
 * all set/rep/load prescription.
 */
const app = express();
app.use(express.json({ limit: '256kb' }));

// CORS — the app calls this cross-origin. Lock ALLOWED_ORIGIN down in prod.
const allowedOrigin = process.env.ALLOWED_ORIGIN ?? '*';
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const coach = createAnthropicCoach(); // reads ANTHROPIC_API_KEY from env

app.post('/coach', async (req, res) => {
  const { system, user } = req.body ?? {};
  if (typeof system !== 'string' || typeof user !== 'string') {
    return res.status(400).json({ error: 'system and user must be strings' });
  }
  try {
    res.json({ text: await coach.complete(system, user) });
  } catch (err) {
    console.error('coach error', err);
    res.status(502).json({ error: 'coach upstream failure' });
  }
});

app.post('/chat', async (req, res) => {
  const { system, messages } = req.body ?? {};
  const valid =
    typeof system === 'string' &&
    Array.isArray(messages) &&
    messages.length > 0 &&
    messages.every(
      (m: unknown): m is ChatMessage =>
        !!m &&
        typeof (m as ChatMessage).content === 'string' &&
        ((m as ChatMessage).role === 'user' || (m as ChatMessage).role === 'assistant'),
    );
  if (!valid) {
    return res.status(400).json({ error: 'system (string) and non-empty messages[] required' });
  }
  try {
    res.json({ text: await coach.chat(system, messages as ChatMessage[]) });
  } catch (err) {
    console.error('chat error', err);
    res.status(502).json({ error: 'coach upstream failure' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Coach backend listening on port ${port}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠  ANTHROPIC_API_KEY is not set — /coach and /chat will fail.');
  }
});
