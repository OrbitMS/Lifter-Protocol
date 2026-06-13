import Anthropic from '@anthropic-ai/sdk';
import type { CoachingClient } from '@/engine/coaching';
import { CUE_MODEL, MAX_TOKENS } from './models';

/**
 * Direct Anthropic SDK client. Use this SERVER-SIDE (see server/index.ts) — or
 * in a trusted dev script. Do NOT instantiate it inside the React Native app:
 * the API key would ship in the bundle. The mobile app should use
 * createProxyCoach() instead.
 *
 * Cues are short and latency-sensitive, so thinking is left off (omitted) and
 * max_tokens is small. Swap the model via the `model` option if needed.
 */
export interface AnthropicCoachOptions {
  apiKey?: string; // falls back to ANTHROPIC_API_KEY in the environment
  model?: string;
}

export function createAnthropicCoach(
  opts: AnthropicCoachOptions = {},
): CoachingClient {
  const client = new Anthropic(opts.apiKey ? { apiKey: opts.apiKey } : {});
  const model = opts.model ?? CUE_MODEL;

  return {
    async complete(system, user) {
      const response = await client.messages.create({
        model,
        max_tokens: MAX_TOKENS,
        system,
        messages: [{ role: 'user', content: user }],
      });

      // content is a discriminated union; collect the text blocks.
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('')
        .trim();
    },
  };
}
