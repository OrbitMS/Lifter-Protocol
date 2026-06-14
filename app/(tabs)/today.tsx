import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Subtitle, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { localCue, sessionCue, type CoachContext } from '@/engine/coaching';
import { getCoach } from '@/coaching';
import { flattenDays } from '@/lib/days';
import { exerciseLoad } from '@/lib/load';
import { baseExerciseName } from '@/lib/metrics';
import { fmtWeight } from '@/lib/units';
import { effectiveTrainingMaxes, useActiveProfile } from '@/store/useProfileStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const SWAPPABLE = new Set(['accessory', 'secondary', 'core']);

export default function Today() {
  const router = useRouter();
  const active = useActiveProfile();
  const program = active?.program;
  const profile = active?.profile ?? {};
  const overrides = active?.overrides ?? {};
  const tms = effectiveTrainingMaxes(active);
  const units = useSettingsStore((s) => s.units);
  const completed = active?.completed ?? {};

  const days = useMemo(() => flattenDays(program), [program]);

  const [index, setIndex] = useState(0);
  useEffect(() => setIndex(0), [active?.id]); // reset when switching profiles
  const total = days.length;
  const safeIndex = Math.min(index, Math.max(0, total - 1));
  const day = days[safeIndex];

  const totalRef = useRef(0);
  totalRef.current = total;
  const go = useCallback(
    (d: number) => setIndex((i) => Math.max(0, Math.min((totalRef.current || 1) - 1, i + d))),
    [],
  );
  const goRef = useRef(go);
  goRef.current = go;

  // horizontal swipe → prev/next (vertical scroll still works)
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 24 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderRelease: (_e, g) => {
        if (g.dx <= -50) goRef.current(1);
        else if (g.dx >= 50) goRef.current(-1);
      },
    }),
  ).current;

  const ctx: CoachContext | null = useMemo(
    () =>
      day
        ? { session: day.session, profile, program, blockIndex: day.blockIndex, weekIndex: day.weekIndex }
        : null,
    [day, profile, program],
  );

  const [cue, setCue] = useState('');
  useEffect(() => {
    if (!ctx) return;
    setCue(localCue(ctx));
    let alive = true;
    sessionCue(getCoach(), ctx)
      .then((t) => alive && t && setCue(t))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [ctx]);

  if (!program || !day) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg }}>
        <Title>No program yet</Title>
        <Subtitle>Finish onboarding to generate your plan.</Subtitle>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }} {...pan.panHandlers}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        {/* day navigator */}
        <View style={styles.nav}>
          <Pressable
            onPress={() => go(-1)}
            disabled={safeIndex === 0}
            style={[styles.navBtn, safeIndex === 0 && styles.navBtnOff]}
          >
            <Text style={styles.navBtnText}>‹</Text>
          </Pressable>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.dayCount}>Day {safeIndex + 1} of {total}</Text>
            <Text style={styles.dayPhase}>
              {day.phase} · week {day.weekOfBlock}/{day.weeksInBlock}
            </Text>
          </View>
          <Pressable
            onPress={() => go(1)}
            disabled={safeIndex === total - 1}
            style={[styles.navBtn, safeIndex === total - 1 && styles.navBtnOff]}
          >
            <Text style={styles.navBtnText}>›</Text>
          </Pressable>
        </View>

        <Title>{day.session.label}</Title>
        <Subtitle>{program.type} · swipe or use ‹ › to browse your weeks</Subtitle>

        {completed[safeIndex] ? (
          <View style={styles.doneBadge}>
            <Text style={styles.doneText}>✓ Completed {new Date(completed[safeIndex]).toLocaleDateString()}</Text>
          </View>
        ) : null}
        <Pressable
          style={styles.startBtn}
          onPress={() => router.push({ pathname: '/workout', params: { day: String(safeIndex) } })}
        >
          <Text style={styles.startText}>{completed[safeIndex] ? 'Repeat workout' : 'Start workout'}</Text>
        </Pressable>

        {cue ? (
          <View style={styles.cue}>
            <Text style={styles.cueLabel}>COACH</Text>
            <Text style={styles.cueText}>{cue}</Text>
          </View>
        ) : null}

        {day.session.exercises.map((ex, i) => {
          const base = baseExerciseName(ex.name);
          const swappable = ex.role ? SWAPPABLE.has(ex.role) : false;
          const replaced = swappable ? overrides[base] : undefined;
          const display = swappable ? replaced ?? base : ex.name;
          const navName = swappable ? replaced ?? base : base;
          const slot = swappable ? base : undefined;
          const load = exerciseLoad(ex, tms);
          const target = `${ex.sets} × ${ex.reps}${ex.intensity.rpe ? ` @ RPE ${ex.intensity.rpe}` : ''}${load ? ` · ${fmtWeight(load, units)}` : ''}`;
          return (
            <Pressable
              key={i}
              style={styles.row}
              onPress={() =>
                router.push({
                  pathname: '/exercise/[name]',
                  params: {
                    name: navName,
                    target,
                    ...(slot
                      ? {
                          slot,
                          // other exercises already in this session — excluded from swaps
                          peers: day.session.exercises
                            .map((e) => baseExerciseName(e.name))
                            .filter((n) => n !== base)
                            .join('|'),
                        }
                      : {}),
                  },
                })
              }
            >
              <View style={styles.exHead}>
                <Text style={styles.exName}>{display}</Text>
                {ex.role && ex.role !== 'main' ? <Text style={styles.tag}>{ex.role}</Text> : null}
              </View>
              <View style={styles.exHead}>
                <Text style={styles.exMeta}>
                  {target}
                  {replaced ? '  · swapped' : ''}
                </Text>
                <Text style={styles.chev}>›</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnOff: { opacity: 0.35 },
  navBtnText: { color: colors.text, fontSize: 24, lineHeight: 26 },
  dayCount: { color: colors.text, fontWeight: '700' },
  dayPhase: { color: colors.textMuted, fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  startBtn: {
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startText: { color: colors.text, fontSize: 16, fontWeight: '800' },
  doneBadge: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.success,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  doneText: { color: colors.success, fontWeight: '700' },
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
