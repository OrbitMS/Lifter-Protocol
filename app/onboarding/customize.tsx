import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { InfoLabel, OptionCard, PrimaryButton, ProgressBar, Subtitle, Title } from '@/components/ui';
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
  const [upper, setUpper] = useState<UpperFocus[]>(config.upperFocus ?? ['back']);
  const [lower, setLower] = useState<LowerFocus[]>(config.lowerFocus ?? ['quads']);
  const [days, setDays] = useState<Weekday[]>(config.trainingDays ?? ['mon', 'tue', 'thu', 'fri']);
  const [competing, setCompeting] = useState(config.competing ?? false);

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
      competing,
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
          <InfoLabel help="More bodybuilding % adds more accessory movements per session; more powerlifting % keeps it lean and strength-focused.">
            Bodybuilding ↔ Powerlifting split
          </InfoLabel>
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

      <InfoLabel help="We weight your accessory picks toward these areas — choose ‘arms’ and you’ll see more curls and triceps work.">
        Improve in upper body
      </InfoLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {UPPER.map((u) => (
          <View key={u} style={{ width: '48%' }}>
            <OptionCard title={u} selected={upper.includes(u)} onPress={() => setUpper(toggle(upper, u))} />
          </View>
        ))}
      </View>

      <InfoLabel help="Same for legs — e.g. ‘hamstrings’ brings in RDLs and leg curls.">
        Improve in lower body
      </InfoLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {LOWER.map((l) => (
          <View key={l} style={{ width: '48%' }}>
            <OptionCard title={l} selected={lower.includes(l)} onPress={() => setLower(toggle(lower, l))} />
          </View>
        ))}
      </View>

      <InfoLabel help="Sets how many sessions per week; your main lifts rotate across the days you pick.">
        Training days ({days.length})
      </InfoLabel>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {DAYS.map((d) => (
          <View key={d} style={{ width: '30%' }}>
            <OptionCard title={d.toUpperCase()} selected={days.includes(d)} onPress={() => setDays(toggle(days, d))} />
          </View>
        ))}
      </View>

      <InfoLabel help="Peaking for a meet builds toward max strength (intensification → realization → deload) and tapers accessories near the end.">
        Preparing for a competition / meet?
      </InfoLabel>
      <OptionCard
        title="Yes — peak for a meet"
        description="Builds toward a strength peak (intensification → realization) and tapers accessories near the end."
        selected={competing}
        onPress={() => setCompeting(true)}
      />
      <OptionCard
        title="No — general training"
        description="Balanced macrocycle without a meet-specific peak."
        selected={!competing}
        onPress={() => setCompeting(false)}
      />

      <PrimaryButton label="Build my program" onPress={finish} disabled={!valid} />
    </ScrollView>
  );
}
