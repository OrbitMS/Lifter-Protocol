import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { InfoLabel, OptionCard, PrimaryButton, ProgressBar, Subtitle, Title } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/useProfileStore';
import type { DietGoal } from '@/types/profile';

// Step 5 of 6 — Nutrition tracking & diet goal.
export default function Nutrition() {
  const router = useRouter();
  const setNutrition = useProfileStore((s) => s.setNutrition);
  const n = useProfileStore((s) => s.draft.profile.nutrition);

  const [tracks, setTracks] = useState<boolean | null>(n?.tracksMacros ?? null);
  const [goal, setGoal] = useState<DietGoal | null>(n?.dietGoal ?? null);

  const valid = tracks !== null && goal !== null;

  const next = () => {
    if (!valid) return;
    setNutrition({ tracksMacros: tracks!, dietGoal: goal! });
    router.push('/onboarding/customize');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
      <ProgressBar step={5} total={6} />
      <Title>Nutrition & goals</Title>
      <Subtitle>We’ll set macro targets and tune recovery expectations to your goal.</Subtitle>

      <InfoLabel help="Just tells us your habits — it doesn’t change your training plan.">
        Do you track your nutrition?
      </InfoLabel>
      <OptionCard title="I track my macros" selected={tracks === true} onPress={() => setTracks(true)} />
      <OptionCard title="I don’t pay attention" selected={tracks === false} onPress={() => setTracks(false)} />

      <InfoLabel help="Gaining supports more accessory volume; losing trims it to protect recovery; maintain stays neutral.">
        Diet goal
      </InfoLabel>
      <OptionCard title="Lose weight" selected={goal === 'lose'} onPress={() => setGoal('lose')} />
      <OptionCard title="Maintain" selected={goal === 'maintain'} onPress={() => setGoal('maintain')} />
      <OptionCard title="Gain weight" selected={goal === 'gain'} onPress={() => setGoal('gain')} />

      <PrimaryButton label="Continue" onPress={next} disabled={!valid} />
    </ScrollView>
  );
}
