import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Thin wrappers that no-op on web (where the haptics APIs aren't meaningful)
// and never throw, so call sites stay clean.

export function tap() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function select() {
  if (Platform.OS === 'web') return;
  Haptics.selectionAsync().catch(() => {});
}

export function celebrate() {
  if (Platform.OS === 'web') return;
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
