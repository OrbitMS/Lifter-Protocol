import Constants from 'expo-constants';
import { stubCoach, type CoachingClient } from '@/engine/coaching';
import { useSettingsStore } from '@/store/useSettingsStore';
import { createProxyCoach } from './proxyClient';

export * from './models';
export { createProxyCoach } from './proxyClient';
export { createAnthropicCoach } from './anthropicClient';

/**
 * The coach the app should use. Prefers the Settings override URL, then the
 * app.json default; falls back to the offline stub when neither is set. Read
 * fresh each call so a Settings change takes effect without a reload.
 */
export function getCoach(): CoachingClient {
  const override = useSettingsStore.getState().coachApiUrl?.trim();
  const url = override || (Constants.expoConfig?.extra?.coachApiUrl as string | undefined);
  return url ? createProxyCoach(url) : stubCoach;
}
