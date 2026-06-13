import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { Label, OptionCard, PrimaryButton, ProgressBar, Subtitle, Title } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/useProfileStore';
import type { DietGoal } from '@/types/profile';

// Step 5 of 6 — Nutrition tracking & diet goal.
export default function Nutrition() {
  const router = useRouter();
  const setNutrition = useProfileStore((s) => s.setNutrition);

  const [tracks, setTracks] = useState<boolean | null>(null);
  const [goal, setGoal] = useState<DietGoal | null>(null);

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

      <Label>Do you track your nutrition?</Label>
      <OptionCard title="I track my macros" selected={tracks === true} onPress={() => setTracks(true)} />
      <OptionCard title="I don’t pay attention" selected={tracks === false} onPress={() => setTracks(false)} />

      <Label>Diet goal</Label>
      <OptionCard title="Lose weight" selected={goal === 'lose'} onPress={() => setGoal('lose')} />
      <OptionCard title="Maintain" selected={goal === 'maintain'} onPress={() => setGoal('maintain')} />
      <OptionCard title="Gain weight" selected={goal === 'gain'} onPress={() => setGoal('gain')} />

      <PrimaryButton label="Continue" onPress={next} disabled={!valid} />
    </ScrollView>
  );
}
