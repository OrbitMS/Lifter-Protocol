import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Subtitle, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { sessionCue } from '@/engine/coaching';
import { getCoach } from '@/coaching';
import { useProfileStore } from '@/store/useProfileStore';

// "Today" — shows the next session from the generated program + an LLM coaching cue.
export default function Today() {
  const program = useProfileStore((s) => s.program);
  const profile = useProfileStore((s) => s.profile);
  const [cue, setCue] = useState('');

  const session = program?.blocks[0]?.weeks[0]?.sessions[0];

  useEffect(() => {
    if (!session) return;
    // Coaching layer: proxy → Claude when coachApiUrl is set, else offline stub.
    // Falls back to a static cue if the request fails (offline, server down).
    let active = true;
    sessionCue(getCoach(), session, profile)
      .then((text) => active && setCue(text))
      .catch(() => active && setCue('Brace, control the descent, drive through the full range.'));
    return () => {
      active = false;
    };
  }, [session, profile]);

  if (!session) {
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
        {program?.type} · {program?.blocks[0].phase} · Week 1
      </Subtitle>

      {cue ? (
        <View style={styles.cue}>
          <Text style={styles.cueLabel}>COACH</Text>
          <Text style={styles.cueText}>{cue}</Text>
        </View>
      ) : null}

      {session.exercises.map((ex, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.exName}>{ex.name}</Text>
          <Text style={styles.exMeta}>
            {ex.sets} × {ex.reps}
            {ex.intensity.rpe ? ` @ RPE ${ex.intensity.rpe}` : ''}
          </Text>
        </View>
      ))}
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
  exName: { color: colors.text, fontSize: 16, fontWeight: '600' },
  exMeta: { color: colors.textMuted, marginTop: 4 },
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
