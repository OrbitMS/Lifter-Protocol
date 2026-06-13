import express from 'express';
import { createAnthropicCoach } from '../src/coaching/anthropicClient';

/**
 * Minimal reference backend for the coaching layer.
 *
 * Keeps ANTHROPIC_API_KEY server-side and exposes a single POST /coach endpoint
 * that the mobile app's proxy client calls. Run with: `npm run coach:server`
 * (requires ANTHROPIC_API_KEY in the environment).
 *
 * This is intentionally thin — add auth, rate limiting, and per-user quotas
 * before shipping. The LLM only ever produces text here; the deterministic
 * engine (src/engine) owns all set/rep/load prescription.
 */
const app = express();
app.use(express.json());

const coach = createAnthropicCoach(); // reads ANTHROPIC_API_KEY from env

app.post('/coach', async (req, res) => {
  const { system, user } = req.body ?? {};
  if (typeof system !== 'string' || typeof user !== 'string') {
    return res.status(400).json({ error: 'system and user must be strings' });
  }
  try {
    const text = await coach.complete(system, user);
    res.json({ text });
  } catch (err) {
    console.error('coach error', err);
    res.status(502).json({ error: 'coach upstream failure' });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`Coach proxy listening on http://localhost:${port}`);
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn('⚠  ANTHROPIC_API_KEY is not set — /coach will fail.');
  }
});
