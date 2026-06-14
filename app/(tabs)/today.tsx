import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Subtitle, Title } from '@/components/ui';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import { radius, shadow, spacing, type Palette } from '@/constants/theme';
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
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
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
      <View style={{ flex: 1, backgroundColor: c.bg, padding: spacing.lg }}>
        <Title>No program yet</Title>
        <Subtitle>Finish onboarding to generate your plan.</Subtitle>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }} {...pan.panHandlers}>
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
            <View style={styles.cueTitleRow}>
              <Text style={styles.cueLabel}>COACH</Text>
              <Pressable onPress={() => router.push('/coach')} style={styles.chatLink}>
                <Text style={styles.chatLinkText}>Chat ›</Text>
              </Pressable>
            </View>
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
                <View style={styles.badgeGroup}>
                  {ex.role && ex.role !== 'main' ? <Badge label={ex.role} /> : null}
                  {replaced ? <Badge label="swapped" tone="accent" /> : null}
                </View>
              </View>
              <View style={styles.exHead}>
                <Text style={styles.exMeta}>{target}</Text>
                <Text style={styles.chev}>›</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  nav: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navBtnOff: { opacity: 0.35 },
  navBtnText: { color: c.text, fontSize: 24, lineHeight: 26 },
  dayCount: { color: c.text, fontWeight: '700' },
  dayPhase: { color: c.textMuted, fontSize: 12, textTransform: 'capitalize', marginTop: 2 },
  startBtn: {
    backgroundColor: c.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
    ...shadow.glow,
  },
  startText: { color: c.onAccent, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  doneBadge: {
    backgroundColor: c.surface,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: c.success,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  doneText: { color: c.success, fontWeight: '700' },
  row: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    ...shadow.card,
  },
  exHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  exName: { color: c.text, fontSize: 16, fontWeight: '600', flexShrink: 1 },
  badgeGroup: { flexDirection: 'row', gap: spacing.xs, flexShrink: 0 },
  exMeta: { color: c.textMuted, marginTop: 4 },
  chev: { color: c.textMuted, fontSize: 22, marginTop: 2 },
  cue: {
    backgroundColor: c.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.accent,
  },
  cueTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cueLabel: { color: c.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  chatLink: { paddingVertical: 2, paddingHorizontal: 4 },
  chatLinkText: { color: c.accent, fontSize: 13, fontWeight: '700' },
  cueText: { color: c.text, marginTop: 4, lineHeight: 20 },
});
