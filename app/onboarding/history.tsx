import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Field,
  Label,
  OptionCard,
  PrimaryButton,
  ProgressBar,
  Subtitle,
  Title,
} from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/useProfileStore';
import type { FrequencyPreference } from '@/types/profile';

// Step 2 of 6 — Training history & current maxes.
export default function History() {
  const router = useRouter();
  const setHistory = useProfileStore((s) => s.setHistory);

  const [years, setYears] = useState('');
  const [freq, setFreq] = useState<FrequencyPreference>('high');
  const [squat, setSquat] = useState('');
  const [bench, setBench] = useState('');
  const [deadlift, setDeadlift] = useState('');

  const valid = years && squat && bench && deadlift;

  const next = () => {
    setHistory({
      yearsTraining: Number(years),
      frequencyPreference: freq,
      maxes: { squat: Number(squat), bench: Number(bench), deadlift: Number(deadlift) },
    });
    router.push('/onboarding/recovery');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
      <ProgressBar step={2} total={6} />
      <Title>Training history</Title>
      <Subtitle>How long you’ve trained and how often you like to.</Subtitle>

      <Label>Years training</Label>
      <Field keyboardType="decimal-pad" value={years} onChangeText={setYears} placeholder="3" />

      <Label>Frequency preference</Label>
      <OptionCard
        title="Low frequency"
        description="Fewer, longer sessions per week."
        selected={freq === 'low'}
        onPress={() => setFreq('low')}
      />
      <OptionCard
        title="High frequency"
        description="More frequent, shorter sessions."
        selected={freq === 'high'}
        onPress={() => setFreq('high')}
      />

      <Label>Estimated 1RM — Squat (kg)</Label>
      <Field keyboardType="decimal-pad" value={squat} onChangeText={setSquat} placeholder="180" />
      <Label>Estimated 1RM — Bench (kg)</Label>
      <Field keyboardType="decimal-pad" value={bench} onChangeText={setBench} placeholder="120" />
      <Label>Estimated 1RM — Deadlift (kg)</Label>
      <Field keyboardType="decimal-pad" value={deadlift} onChangeText={setDeadlift} placeholder="220" />

      <PrimaryButton label="Continue" onPress={next} disabled={!valid} />
    </ScrollView>
  );
}
