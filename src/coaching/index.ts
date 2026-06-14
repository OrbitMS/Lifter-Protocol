import Constants from 'expo-constants';
import { stubCoach, type CoachingClient } from '@/engine/coaching';
import { useSettingsStore } from '@/store/useSettingsStore';
import { createProxyCoach } from './proxyClient';

export * from './models';
export { createProxyCoach } from './proxyClient';
export { createAnthropicCoach } from './anthropicClient';

/**
 * Returns a usable coach URL or undefined. A localhost URL is fine in dev but
 * unreachable from a shipped build, so it's ignored outside development — this
 * prevents the app.json dev default from silently breaking coaching on-device.
 */
function usableUrl(raw?: string): string | undefined {
  const url = raw?.trim();
  if (!url) return undefined;
  if (!__DEV__ && /^(https?:\/\/)?(localhost|127\.0\.0\.1|10\.0\.2\.2)\b/i.test(url)) {
    return undefined;
  }
  return url;
}

function resolveUrl(): string | undefined {
  return (
    usableUrl(useSettingsStore.getState().coachApiUrl) ||
    usableUrl(Constants.expoConfig?.extra?.coachApiUrl as string | undefined)
  );
}

/**
 * The coach the app should use. Prefers the Settings override URL, then the
 * app.json default; falls back to the offline stub when neither is usable. Read
 * fresh each call so a Settings change takes effect without a reload.
 */
export function getCoach(): CoachingClient {
  const url = resolveUrl();
  return url ? createProxyCoach(url) : stubCoach;
}

/** Whether the AI coach is reachable (a usable URL is configured). */
export function coachIsOnline(): boolean {
  return resolveUrl() !== undefined;
}
