import { Stack } from 'expo-router';
import { colors } from '@/constants/theme';

/** Step order: basics → history → recovery → program → nutrition → customize */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitle: '',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
