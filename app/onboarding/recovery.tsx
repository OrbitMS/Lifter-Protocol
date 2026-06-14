import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
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

const SCALE = [1, 2, 3, 4, 5] as const;

function Scale({
  label,
  help,
  low,
  high,
  value,
  onChange,
}: {
  label: string;
  help: string;
  low: string;
  high: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={{ gap: spacing.xs }}>
      <InfoLabel help={help}>{label}</InfoLabel>
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
  const r = useProfileStore((s) => s.draft.profile.recovery);

  const [job, setJob] = useState<number>(r?.jobActivity ?? 2);
  const [stress, setStress] = useState<number>(r?.lifeStress ?? 2);
  const [speed, setSpeed] = useState<number>(r?.recoverySpeed ?? 3);
  const [sleep, setSleep] = useState(r?.sleepHours ? String(r.sleepHours) : '');

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
      <Subtitle>These four answers form your Recovery Index, which sets your sets and effort cap.</Subtitle>

      <Scale
        label="How active is your job?"
        help="A physical job eats into recovery, so a higher setting lowers your programmed volume."
        low="Sedentary"
        high="Heavy labor"
        value={job}
        onChange={setJob}
      />
      <Scale
        label="Life stress"
        help="More life stress means less recovery capacity — it lowers volume and your effort cap."
        low="None"
        high="Very high"
        value={stress}
        onChange={setStress}
      />
      <Scale
        label="How fast do you recover?"
        help="How quickly you bounce back between sessions. Faster recovery lets us add sets and push intensity higher."
        low="Slow"
        high="Very fast"
        value={speed}
        onChange={setSpeed}
      />

      <InfoLabel help="The biggest recovery lever. More sleep raises your Recovery Index → more sets and a higher RPE ceiling.">
        Sleep per night (hours)
      </InfoLabel>
      <Field keyboardType="decimal-pad" value={sleep} onChangeText={setSleep} placeholder="7.5" />

      <PrimaryButton label="Continue" onPress={next} disabled={!sleep} />
    </ScrollView>
  );
}
