import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Subtitle, Title } from '@/components/ui';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import { radius, spacing, type Palette } from '@/constants/theme';
import { useActiveProfile } from '@/store/useProfileStore';
import type { PhaseName } from '@/types/program';

const phaseTone = (phase: PhaseName): 'neutral' | 'accent' | 'success' | 'warn' => {
  if (phase === 'deload') return 'warn';
  if (phase === 'realization') return 'success';
  if (phase === 'intensification') return 'accent';
  return 'neutral';
};

// Program overview — the macrocycle: blocks → weeks → sessions, with a marker
// for where the athlete currently is in the plan.
export default function ProgramOverview() {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const active = useActiveProfile();
  const program = active?.program;
  const completed = active?.completed ?? {};

  // Number each session with its global (flat) day index so we can mark
  // completed days and highlight the current one.
  const view = useMemo(() => {
    if (!program) return [];
    let idx = 0;
    return program.blocks.map((b) => ({
      phase: b.phase,
      weeks: b.weeks.map((w) => ({
        index: w.index,
        sessions: w.sessions.map((s) => ({ session: s, flat: idx++ })),
      })),
    }));
  }, [program]);

  const totalDays = useMemo(
    () => view.reduce((n, b) => n + b.weeks.reduce((m, w) => m + w.sessions.length, 0), 0),
    [view],
  );
  const doneCount = Object.keys(completed).length;
  // current = first incomplete day (or the last day if all done)
  const current = Math.min(doneCount, Math.max(0, totalDays - 1));

  if (!program) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: spacing.lg }}>
        <Title>No program</Title>
        <Subtitle>Finish onboarding to generate your macrocycle.</Subtitle>
      </View>
    );
  }

  const totalWeeks = program.blocks.reduce((n, b) => n + b.weeks.length, 0);
  const pct = totalDays ? Math.round((doneCount / totalDays) * 100) : 0;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>Your macrocycle</Title>
      <Subtitle>
        {program.type} · {program.config.daysPerWeek} days/week · {totalWeeks} weeks
      </Subtitle>

      {/* progress summary */}
      <View style={styles.progressCard}>
        <View style={styles.progressHead}>
          <Text style={styles.progressLabel}>PLAN PROGRESS</Text>
          <Text style={styles.progressPct}>{pct}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${pct}%` }]} />
        </View>
        <Text style={styles.progressSub}>
          {doneCount} of {totalDays} sessions complete
        </Text>
      </View>

      {view.map((block, bi) => (
        <View key={bi} style={styles.block}>
          <View style={styles.blockHead}>
            <Badge label={block.phase} tone={phaseTone(block.phase)} />
            <Text style={styles.blockMeta}>
              {block.weeks.length} {block.weeks.length === 1 ? 'week' : 'weeks'}
            </Text>
          </View>

          {block.weeks.map((week) => (
            <View key={week.index} style={styles.week}>
              <Text style={styles.weekLabel}>Week {week.index}</Text>
              {week.sessions.map(({ session, flat }) => {
                const isDone = !!completed[flat];
                const isCurrent = flat === current && !isDone;
                return (
                  <Pressable
                    key={flat}
                    style={[styles.sessionRow, isCurrent && styles.sessionCurrent]}
                    onPress={() => router.push({ pathname: '/workout', params: { day: String(flat) } })}
                  >
                    <View style={[styles.statusDot, isDone ? styles.dotDone : isCurrent ? styles.dotCurrent : styles.dotIdle]}>
                      {isDone ? <Text style={styles.check}>✓</Text> : null}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.sessionLabel, isDone && styles.sessionDone]}>{session.label}</Text>
                      <Text style={styles.sessionDay}>
                        {session.day.toUpperCase()} · {session.exercises.length} exercises
                      </Text>
                    </View>
                    {isCurrent ? <Text style={styles.nowTag}>NOW</Text> : null}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  progressCard: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressLabel: { color: c.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  progressPct: { color: c.accent, fontSize: 18, fontWeight: '800' },
  track: { height: 8, backgroundColor: c.surfaceAlt, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: c.accent, borderRadius: radius.pill },
  progressSub: { color: c.textMuted, fontSize: 13 },
  block: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    borderLeftWidth: 4,
    borderLeftColor: c.accent,
    gap: spacing.sm,
  },
  blockHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  blockMeta: { color: c.textMuted, fontSize: 12 },
  week: { gap: spacing.xs, marginTop: spacing.xs },
  weekLabel: { color: c.textFaint, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: c.bgElevated,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.sm,
  },
  sessionCurrent: { borderColor: c.accent, backgroundColor: c.accentSoft },
  statusDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  dotDone: { backgroundColor: c.success, borderColor: c.success },
  dotCurrent: { borderColor: c.accent, backgroundColor: 'transparent' },
  dotIdle: { borderColor: c.borderStrong, backgroundColor: 'transparent' },
  check: { color: c.onSuccess, fontSize: 12, fontWeight: '900' },
  sessionLabel: { color: c.text, fontWeight: '700' },
  sessionDone: { color: c.textMuted },
  sessionDay: { color: c.textMuted, fontSize: 12, marginTop: 1 },
  nowTag: { color: c.accent, fontSize: 11, fontWeight: '800', letterSpacing: 0.6 },
});
