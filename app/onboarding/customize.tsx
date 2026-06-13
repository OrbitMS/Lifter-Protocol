import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Label, OptionCard, PrimaryButton, ProgressBar, Subtitle, Title } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/useProfileStore';
import type { LowerFocus, UpperFocus, Weekday } from '@/types/program';

const DAYS: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const UPPER: UpperFocus[] = ['chest', 'back', 'shoulders', 'arms'];
const LOWER: LowerFocus[] = ['quads', 'hamstrings', 'glutes'];
const RATIOS = [15, 30, 40, 60, 75];

function toggle<T>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

// Step 6 of 6 — Customization, then build the program.
export default function Customize() {
  const router = useRouter();
  const config = useProfileStore((s) => s.draft.config);
  const setConfig = useProfileStore((s) => s.setConfig);
  const buildProgram = useProfileStore((s) => s.buildProgram);

  const [ratio, setRatio] = useState(config.bbToPlRatio ?? 40);
  const [upper, setUpper] = useState<UpperFocus[]>(['back']);
  const [lower, setLower] = useState<LowerFocus[]>(['quads']);
  const [days, setDays] = useState<Weekday[]>(['mon', 'tue', 'thu', 'fri']);

  const isCombo = config.type !== 'powerlifting';
  const valid = days.length >= 3 && days.length <= 6;

  const finish = () => {
    if (!valid) return;
    setConfig({
      bbToPlRatio: ratio,
      upperFocus: upper,
      lowerFocus: lower,
      trainingDays: days,
      daysPerWeek: days.length,
    });
    buildProgram();
    router.replace('/(tabs)/today');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
      <ProgressBar step={6} total={6} />
      <Title>Fine-tune</Title>
      <Subtitle>Shape the emphasis and pick your training days.</Subtitle>

      {isCombo && (
        <>
          <Label>Bodybuilding ↔ Powerlifting split</Label>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {RATIOS.map((r) => (
              <View key={r} style={{ flex: 1 }}>
                <OptionCard
                  title={`${r}/${100 - r}`}
                  selected={ratio === r}
                  onPress={() => setRatio(r)}
                />
              </View>
            ))}
          </View>
          <Subtitle>% bodybuilding / % powerlifting</Subtitle>
        </>
      )}

      <Label>Improve in upper body</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {UPPER.map((u) => (
          <View key={u} style={{ width: '48%' }}>
            <OptionCard title={u} selected={upper.includes(u)} onPress={() => setUpper(toggle(upper, u))} />
          </View>
        ))}
      </View>

      <Label>Improve in lower body</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {LOWER.map((l) => (
          <View key={l} style={{ width: '48%' }}>
            <OptionCard title={l} selected={lower.includes(l)} onPress={() => setLower(toggle(lower, l))} />
          </View>
        ))}
      </View>

      <Label>Training days ({days.length})</Label>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {DAYS.map((d) => (
          <View key={d} style={{ width: '30%' }}>
            <OptionCard title={d.toUpperCase()} selected={days.includes(d)} onPress={() => setDays(toggle(days, d))} />
          </View>
        ))}
      </View>

      <PrimaryButton label="Build my program" onPress={finish} disabled={!valid} />
    </ScrollView>
  );
}
