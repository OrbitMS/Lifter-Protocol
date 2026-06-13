import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
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

const SCALE = [1, 2, 3, 4, 5] as const;

function Scale({
  label,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  low: string;
  high: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Label>{label}</Label>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {SCALE.map((n) => (
          <View key={n} style={{ flex: 1 }}>
            <OptionCard title={String(n)} selected={value === n} onPress={() => onChange(n)} />
          </View>
        ))}
      </View>
      <Subtitle>
        {low} ←→ {high}
      </Subtitle>
    </View>
  );
}

// Step 3 of 6 — Recovery profile (feeds the Recovery Index).
export default function Recovery() {
  const router = useRouter();
  const setRecovery = useProfileStore((s) => s.setRecovery);

  const [job, setJob] = useState(2);
  const [stress, setStress] = useState(2);
  const [speed, setSpeed] = useState(3);
  const [sleep, setSleep] = useState('');

  const next = () => {
    setRecovery({
      jobActivity: job as 1 | 2 | 3 | 4 | 5,
      lifeStress: stress as 1 | 2 | 3 | 4 | 5,
      recoverySpeed: speed as 1 | 2 | 3 | 4 | 5,
      sleepHours: Number(sleep),
    });
    router.push('/onboarding/program');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
      <ProgressBar step={3} total={6} />
      <Title>Recovery</Title>
      <Subtitle>This sets how aggressively we’ll program volume for you.</Subtitle>

      <Scale label="How active is your job?" low="Sedentary" high="Heavy labor" value={job} onChange={setJob} />
      <Scale label="Life stress" low="None" high="Very high" value={stress} onChange={setStress} />
      <Scale label="How fast do you recover?" low="Slow" high="Very fast" value={speed} onChange={setSpeed} />

      <Label>Sleep per night (hours)</Label>
      <Field keyboardType="decimal-pad" value={sleep} onChangeText={setSleep} placeholder="7.5" />

      <PrimaryButton label="Continue" onPress={next} disabled={!sleep} />
    </ScrollView>
  );
}
