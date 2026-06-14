import { Stack } from 'expo-router';
import { Wordmark } from '@/components/ui';
import { useTheme } from '@/lib/useTheme';

/** Step order: basics → history → recovery → program → nutrition → customize */
export default function OnboardingLayout() {
  const { palette: c } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: c.bg },
        headerTintColor: c.text,
        headerTitle: () => <Wordmark size={17} />,
        headerTitleAlign: 'center',
        headerShadowVisible: false,
        contentStyle: { backgroundColor: c.bg },
      }}
    />
  );
}
