import { Redirect } from 'expo-router';
import { useProfileStore } from '@/store/useProfileStore';

/** Send returning users to the app, new users into onboarding. */
export default function Index() {
  const complete = useProfileStore((s) => s.onboardingComplete);
  return complete ? (
    <Redirect href="/(tabs)/today" />
  ) : (
    <Redirect href="/onboarding/basics" />
  );
}
