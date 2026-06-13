import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView } from 'react-native';
import { OptionCard, PrimaryButton, ProgressBar, Subtitle, Title } from '@/components/ui';
import { spacing } from '@/constants/theme';
import { PROGRAMS, getProgramMeta } from '@/constants/programs';
import { useProfileStore } from '@/store/useProfileStore';
import type { ProgramType } from '@/types/program';

// Step 4 of 6 — Premium program selection.
export default function ProgramSelect() {
  const router = useRouter();
  const setConfig = useProfileStore((s) => s.setConfig);
  const [type, setType] = useState<ProgramType | null>(null);

  const next = () => {
    if (!type) return;
    setConfig({ type, bbToPlRatio: getProgramMeta(type).defaultBbToPlRatio });
    router.push('/onboarding/nutrition');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
      <ProgressBar step={4} total={6} />
      <Title>Choose your program</Title>
      <Subtitle>All programs run 3–6×/week. Pick the emphasis that fits your goals.</Subtitle>

      {PROGRAMS.map((p) => (
        <OptionCard
          key={p.type}
          title={`${p.title}  ·  ${p.freq}  ·  ${p.length}`}
          description={`${p.focus}\nBest for: ${p.bestFor}`}
          selected={type === p.type}
          onPress={() => setType(p.type)}
        />
      ))}

      <PrimaryButton label="Continue" onPress={next} disabled={!type} />
    </ScrollView>
  );
}
