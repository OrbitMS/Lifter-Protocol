import Constants from 'expo-constants';
import { stubCoach, type CoachingClient } from '@/engine/coaching';
import { createProxyCoach } from './proxyClient';

export * from './models';
export { createProxyCoach } from './proxyClient';
export { createAnthropicCoach } from './anthropicClient';

let cached: CoachingClient | null = null;

/**
 * The coach the app should use. Returns the backend-proxy client when a
 * coachApiUrl is configured, otherwise the offline stub so the UI still works
 * without a server (e.g. first run, no network).
 */
export function getCoach(): CoachingClient {
  if (cached) return cached;
  const url = Constants.expoConfig?.extra?.coachApiUrl as string | undefined;
  cached = url ? createProxyCoach(url) : stubCoach;
  return cached;
}
