import { Redirect } from 'expo-router';
import { useActiveProfile } from '@/store/useProfileStore';

/** Send returning users to the app, new users into onboarding. */
export default function Index() {
  const active = useActiveProfile();
  return active?.program ? (
    <Redirect href="/(tabs)/today" />
  ) : (
    <Redirect href="/onboarding/basics" />
  );
}
