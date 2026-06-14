import { Stack } from 'expo-router';
import { Wordmark } from '@/components/ui';
import { colors } from '@/constants/theme';

/** Step order: basics → history → recovery → program → nutrition → customize */
export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerTintColor: colors.text,
        headerTitle: () => <Wordmark size={17} />,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
