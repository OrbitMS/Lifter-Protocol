import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Subtitle, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { localCue, sessionCue, type CoachContext } from '@/engine/coaching';
import { getCoach } from '@/coaching';
import { baseExerciseName } from '@/lib/metrics';
import { useProfileStore } from '@/store/useProfileStore';

// "Today" — current session from the generated program + a macrocycle-aware coaching cue.
export default function Today() {
  const router = useRouter();
  const program = useProfileStore((s) => s.program);
  const profile = useProfileStore((s) => s.profile);

  // current position in the macrocycle (block 0, week 0 until scheduling lands)
  const blockIndex = 0;
  const weekIndex = 0;
  const block = program?.blocks[blockIndex];
  const session = block?.weeks[weekIndex]?.sessions[0];

  const ctx: CoachContext | null = useMemo(
    () => (session ? { session, profile, program, blockIndex, weekIndex } : null),
    [session, profile, program],
  );

  const [cue, setCue] = useState(() => (ctx ? localCue(ctx) : ''));

  useEffect(() => {
    if (!ctx) return;
    setCue(localCue(ctx)); // phase-aware fallback shown immediately
    let active = true;
    // upgrade to the LLM coach when a backend is reachable; keep localCue otherwise
    sessionCue(getCoach(), ctx)
      .then((text) => active && text && setCue(text))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [ctx]);

  if (!session || !block) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg }}>
        <Title>No program yet</Title>
        <Subtitle>Finish onboarding to generate your plan.</Subtitle>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>{session.label}</Title>
      <Subtitle>
        {program?.type} · {block.phase} · week {weekIndex + 1} of {block.weeks.length}
      </Subtitle>

      {cue ? (
        <View style={styles.cue}>
          <Text style={styles.cueLabel}>COACH</Text>
          <Text style={styles.cueText}>{cue}</Text>
        </View>
      ) : null}

      <Subtitle>Tap an exercise for instructions, video and to log your sets.</Subtitle>

      {session.exercises.map((ex, i) => {
        const target = `${ex.sets} × ${ex.reps}${ex.intensity.rpe ? ` @ RPE ${ex.intensity.rpe}` : ''}`;
        return (
          <Pressable
            key={i}
            style={styles.row}
            onPress={() =>
              router.push({
                pathname: '/exercise/[name]',
                params: { name: baseExerciseName(ex.name), target },
              })
            }
          >
            <View style={styles.exHead}>
              <Text style={styles.exName}>{ex.name}</Text>
              {ex.role && ex.role !== 'main' ? <Text style={styles.tag}>{ex.role}</Text> : null}
            </View>
            <View style={styles.exHead}>
              <Text style={styles.exMeta}>{target}</Text>
              <Text style={styles.chev}>›</Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  exHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  exName: { color: colors.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  tag: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  exMeta: { color: colors.textMuted, marginTop: 4 },
  chev: { color: colors.textMuted, fontSize: 22, marginTop: 2 },
  cue: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  cueLabel: { color: colors.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  cueText: { color: colors.text, marginTop: 4, lineHeight: 20 },
});
