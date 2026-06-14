import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Updates from 'expo-updates';
import { useEffect } from 'react';
import { LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/useTheme';

// Silence a known upstream deprecation emitted by react-native-web / navigation
// internals (not our code) so it doesn't drown out real warnings.
LogBox.ignoreLogs(['props.pointerEvents is deprecated']);

/** Check for an over-the-air update on launch (production builds only). */
function useOtaUpdates() {
  useEffect(() => {
    if (__DEV__ || !Updates.isEnabled) return;
    (async () => {
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch {
        // offline or no update channel — keep running the bundled version
      }
    })();
  }, []);
}

export default function RootLayout() {
  useOtaUpdates();
  const { palette: c, isDark } = useTheme();
  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: c.bg },
          headerTintColor: c.text,
          contentStyle: { backgroundColor: c.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </SafeAreaProvider>
  );
}
