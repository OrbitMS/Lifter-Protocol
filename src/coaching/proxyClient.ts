import Constants from 'expo-constants';
import type { ChatMessage, CoachingClient } from '@/engine/coaching';

/**
 * RECOMMENDED client for the mobile app.
 *
 * Calls a backend proxy (see server/index.ts) instead of talking to the
 * Anthropic API directly. This keeps the ANTHROPIC_API_KEY on the server — it
 * must NEVER be bundled into the React Native app, where anyone can extract it.
 *
 * The proxy URL comes from app.json → expo.extra.coachApiUrl.
 */
export function createProxyCoach(baseUrl?: string): CoachingClient {
  const url =
    baseUrl ??
    (Constants.expoConfig?.extra?.coachApiUrl as string | undefined) ??
    'http://localhost:8787';

  async function post(path: string, body: unknown): Promise<string> {
    const res = await fetch(`${url}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      throw new Error(`Coach proxy error ${res.status}`);
    }
    const data = (await res.json()) as { text: string };
    return data.text;
  }

  return {
    complete: (system, user) => post('/coach', { system, user }),
    chat: (system: string, messages: ChatMessage[]) => post('/chat', { system, messages }),
  };
}
