import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import {
  Field,
  InfoLabel,
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
  const h = useProfileStore((s) => s.draft.profile.history);

  const [years, setYears] = useState(h?.yearsTraining ? String(h.yearsTraining) : '');
  const [freq, setFreq] = useState<FrequencyPreference>(h?.frequencyPreference ?? 'high');
  const [squat, setSquat] = useState(h?.maxes.squat ? String(h.maxes.squat) : '');
  const [bench, setBench] = useState(h?.maxes.bench ? String(h.maxes.bench) : '');
  const [deadlift, setDeadlift] = useState(h?.maxes.deadlift ? String(h.maxes.deadlift) : '');

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

      <InfoLabel help="Sets your experience level: beginners get less volume and an RPE-8 effort cap; advanced lifters get more volume, an extra main-lift set, and can push to RPE 10.">
        Years training
      </InfoLabel>
      <Field keyboardType="decimal-pad" value={years} onChangeText={setYears} placeholder="3" />

      <InfoLabel help="High frequency spreads accessories over more days (fewer per session). Low frequency packs more work into each session.">
        Frequency preference
      </InfoLabel>
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

      <InfoLabel help="Your training loads are built from this — we program against ~90% of your 1RM so sessions start submaximal with room to grow.">
        Estimated 1RM — Squat (kg)
      </InfoLabel>
      <Field keyboardType="decimal-pad" value={squat} onChangeText={setSquat} placeholder="180" />
      <InfoLabel help="Your bench loads come from this 1RM (programmed at ~90% of it).">
        Estimated 1RM — Bench (kg)
      </InfoLabel>
      <Field keyboardType="decimal-pad" value={bench} onChangeText={setBench} placeholder="120" />
      <InfoLabel help="Your deadlift loads come from this 1RM (programmed at ~90% of it).">
        Estimated 1RM — Deadlift (kg)
      </InfoLabel>
      <Field keyboardType="decimal-pad" value={deadlift} onChangeText={setDeadlift} placeholder="220" />

      <PrimaryButton label="Continue" onPress={next} disabled={!valid} />
    </ScrollView>
  );
}
