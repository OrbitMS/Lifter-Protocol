import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, PrimaryButton, Subtitle, Title } from '@/components/ui';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import { radius, spacing, type Palette } from '@/constants/theme';
import { adjustForLift } from '@/engine/autoregulation';
import { flattenDays } from '@/lib/days';
import * as haptics from '@/lib/haptics';
import { exerciseLoad, roundLoad, warmupSets, type MainLift, type TrainingMaxes } from '@/lib/load';
import { baseExerciseName, estimate1RM } from '@/lib/metrics';
import { fmtWeight, kgToDisplay, displayToKg } from '@/lib/units';
import { entryBestE1RM, useLogStore, type LoggedSet } from '@/store/useLogStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import {
  effectiveTrainingMaxes,
  useActiveProfile,
  useProfileStore,
} from '@/store/useProfileStore';

const MAIN: MainLift[] = ['squat', 'bench', 'deadlift'];
const isMain = (c: string): c is MainLift => (MAIN as string[]).includes(c);
const SWAPPABLE = new Set(['accessory', 'secondary', 'core']);

function restSeconds(role?: string): number {
  if (role === 'main' || role === 'variation') return 180;
  if (role === 'secondary') return 120;
  return 90;
}

export default function Workout() {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const params = useLocalSearchParams<{ day?: string }>();
  const dayIndex = Number(params.day ?? 0) || 0;

  const active = useActiveProfile();
  const overrides = active?.overrides ?? {};
  const tms = effectiveTrainingMaxes(active);
  const units = useSettingsStore((s) => s.units);
  const addEntry = useLogStore((s) => s.addEntry);
  const finishWorkout = useProfileStore((s) => s.finishWorkout);

  const days = useMemo(() => flattenDays(active?.program), [active?.program]);
  const day = days[dayIndex];
  const exercises = day?.session.exercises ?? [];

  const display = (i: number) => {
    const ex = exercises[i];
    const base = baseExerciseName(ex.name);
    const swappable = ex.role ? SWAPPABLE.has(ex.role) : false;
    return swappable ? overrides[base] ?? base : base;
  };

  const [current, setCurrent] = useState(0);
  const [logged, setLogged] = useState<Record<number, LoggedSet[]>>({});
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [restUntil, setRestUntil] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [done, setDone] = useState(false);
  const [summary, setSummary] = useState<string[]>([]);
  // set indices (per exercise) that beat the all-time est-1RM, + a transient banner
  const [prSets, setPrSets] = useState<Record<number, number[]>>({});
  const [prFlash, setPrFlash] = useState<number | null>(null);

  const allLogs = useLogStore((s) => s.logs);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const ex = exercises[current];
  // prefill when the exercise changes
  useEffect(() => {
    if (!ex) return;
    const load = exerciseLoad(ex, tms);
    setWeight(load ? String(kgToDisplay(load, units)) : '');
    setReps(String(ex.reps));
    setRpe('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, day, units]);

  if (!active || !day || !ex) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, padding: spacing.lg }}>
        <Stack.Screen options={{ title: 'Workout', headerShown: true }} />
        <Title>No session</Title>
        <Subtitle>Start a workout from the Today tab.</Subtitle>
      </View>
    );
  }

  const restLeft = restUntil ? Math.max(0, Math.ceil((restUntil - now) / 1000)) : 0;
  const curSets = logged[current] ?? [];
  const targetLoad = exerciseLoad(ex, tms);
  const warmups = targetLoad ? warmupSets(targetLoad) : [];

  // all-time best estimated-1RM for this lift, used to detect PRs as sets are logged
  const exKey = baseExerciseName(display(current));
  const histBest = (allLogs[active.id]?.[exKey] ?? []).reduce((m, e) => Math.max(m, entryBestE1RM(e)), 0);
  const curPRs = prSets[current] ?? [];

  const logSet = () => {
    const w = Number(weight);
    const r = Number(reps);
    if (!w || !r) return;
    // inputs are in the display unit — store kg
    const kg = roundLoad(displayToKg(w, units));
    const e1 = estimate1RM(kg, r);
    const sessionBest = curSets.reduce((m, s) => Math.max(m, estimate1RM(s.weight, s.reps)), 0);
    const isPR = e1 > 0 && e1 > Math.max(histBest, sessionBest);
    const newIndex = curSets.length;
    setLogged((m) => ({ ...m, [current]: [...(m[current] ?? []), { weight: kg, reps: r, rpe: rpe ? Number(rpe) : undefined }] }));
    setRpe('');
    setRestUntil(Date.now() + restSeconds(ex.role) * 1000);
    if (isPR) {
      setPrSets((p) => ({ ...p, [current]: [...(p[current] ?? []), newIndex] }));
      setPrFlash(kgToDisplay(e1, units));
      setTimeout(() => setPrFlash(null), 4000);
      haptics.celebrate();
    } else {
      haptics.tap();
    }
  };

  const finish = () => {
    if (!tms) return;
    const newTMs: TrainingMaxes = { ...tms };
    const notes: string[] = [];

    exercises.forEach((e, i) => {
      const sets = logged[i];
      if (!sets || sets.length === 0) return;
      // persist to the exercise's own log history
      addEntry(active.id, display(i), sets);
      // auto-regulate the training max from the MAIN lift's performance
      if (e.role === 'main' && isMain(e.category)) {
        const target = e.intensity.rpe ?? 9;
        const r = adjustForLift(
          sets.map((s) => ({ ...s, completed: true })),
          target,
        );
        if (r.loadMultiplier !== 1) {
          const before = newTMs[e.category];
          newTMs[e.category] = roundLoad(before * r.loadMultiplier);
          notes.push(`${baseExerciseName(e.name)} TM ${before}→${newTMs[e.category]}kg — ${r.reason.toLowerCase()}`);
        }
      }
    });

    finishWorkout(dayIndex, newTMs);
    setSummary(notes);
    setDone(true);
    haptics.celebrate();
  };

  if (done) {
    return (
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
        <Stack.Screen options={{ title: 'Workout complete', headerShown: true }} />
        <Title>Nice work 💪</Title>
        <Subtitle>Logged {Object.values(logged).reduce((n, s) => n + s.length, 0)} sets across {Object.keys(logged).length} exercises.</Subtitle>
        {summary.length > 0 ? (
          <View style={{ gap: spacing.xs }}>
            <Text style={styles.section}>AUTO-REGULATION</Text>
            {summary.map((n, i) => (
              <View key={i} style={styles.adjCard}>
                <Text style={styles.adjText}>{n}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.note}>Training maxes held steady — log RPE next time to drive adjustments.</Text>
        )}
        <PrimaryButton label="Done" onPress={() => router.replace('/(tabs)/today')} />
      </ScrollView>
    );
  }

  const isLast = current === exercises.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <Stack.Screen options={{ title: `${day.session.label}`, headerShown: true }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
        <Text style={styles.counter}>Exercise {current + 1} of {exercises.length} · {day.phase}</Text>
        <Title>{display(current)}</Title>
        <Subtitle>
          Target: {ex.sets} × {ex.reps}
          {ex.intensity.rpe ? ` @ RPE ${ex.intensity.rpe}` : ''}
          {targetLoad ? ` · ${fmtWeight(targetLoad, units)}` : ''}
        </Subtitle>

        {warmups.length > 0 ? (
          <View style={styles.warmup}>
            <Text style={styles.warmupTitle}>WARM-UP</Text>
            {warmups.map((w, i) => (
              <Text key={i} style={styles.warmupRow}>
                {fmtWeight(w.weight, units)} × {w.reps}
              </Text>
            ))}
            <Text style={styles.warmupNote}>then your working sets ↓</Text>
          </View>
        ) : null}

        {restLeft > 0 ? (
          <View style={styles.rest}>
            <Text style={styles.restText}>Rest {Math.floor(restLeft / 60)}:{String(restLeft % 60).padStart(2, '0')}</Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm }}>
              <Pressable onPress={() => setRestUntil((u) => (u ?? Date.now()) + 30000)} style={styles.restBtn}>
                <Text style={styles.restBtnText}>+30s</Text>
              </Pressable>
              <Pressable onPress={() => setRestUntil(null)} style={styles.restBtn}>
                <Text style={styles.restBtnText}>Skip</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {prFlash != null ? (
          <View style={styles.prBanner}>
            <Text style={styles.prBannerText}>🏆 NEW PR!  est. {prFlash} {units} 1RM</Text>
          </View>
        ) : null}

        {/* logged sets */}
        {curSets.map((s, i) => (
          <View key={i} style={[styles.setRow, curPRs.includes(i) && styles.setRowPR]}>
            <Text style={styles.setText}>
              Set {i + 1}: {fmtWeight(s.weight, units)} × {s.reps}{s.rpe ? ` @ RPE ${s.rpe}` : ''}
              {curPRs.includes(i) ? <Text style={styles.prTag}>  🏆 PR</Text> : null}
            </Text>
            <Pressable onPress={() => setLogged((m) => ({ ...m, [current]: (m[current] ?? []).filter((_, j) => j !== i) }))}>
              <Text style={styles.del}>✕</Text>
            </Pressable>
          </View>
        ))}

        {/* set entry */}
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>Weight ({units})</Text>
            <Field keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder="100" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>Reps</Text>
            <Field keyboardType="number-pad" value={reps} onChangeText={setReps} placeholder="5" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.lbl}>RPE</Text>
            <Field keyboardType="decimal-pad" value={rpe} onChangeText={setRpe} placeholder="8" />
          </View>
        </View>
        <Pressable style={styles.logBtn} onPress={logSet}>
          <Text style={styles.logBtnText}>＋ Log set ({curSets.length}/{ex.sets})</Text>
        </Pressable>

        {/* nav */}
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <Pressable
            style={[styles.navBtn, current === 0 && styles.navOff]}
            disabled={current === 0}
            onPress={() => setCurrent((c) => Math.max(0, c - 1))}
          >
            <Text style={styles.navText}>‹ Prev</Text>
          </Pressable>
          {isLast ? (
            <Pressable style={[styles.navBtn, styles.finishBtn]} onPress={finish}>
              <Text style={[styles.navText, { color: c.bg }]}>Finish workout</Text>
            </Pressable>
          ) : (
            <Pressable style={styles.navBtn} onPress={() => setCurrent((c) => Math.min(exercises.length - 1, c + 1))}>
              <Text style={styles.navText}>Next ›</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  counter: { color: c.textMuted, fontSize: 12, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  section: { color: c.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  lbl: { color: c.textMuted, fontSize: 13, fontWeight: '600', marginBottom: spacing.xs },
  warmup: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    gap: 2,
  },
  warmupTitle: { color: c.textMuted, fontSize: 11, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
  warmupRow: { color: c.text },
  warmupNote: { color: c.textMuted, fontSize: 12, fontStyle: 'italic', marginTop: 4 },
  rest: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: c.accentSoft,
    borderWidth: 1,
    borderColor: c.accent,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  restText: { color: c.text, fontSize: 20, fontWeight: '800' },
  restBtn: { borderWidth: 1, borderColor: c.accent, borderRadius: radius.sm, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  restBtnText: { color: c.accent, fontWeight: '700' },
  setRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: c.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: c.border,
  },
  setText: { color: c.text, flexShrink: 1 },
  setRowPR: { borderColor: c.success, backgroundColor: c.successSoft },
  prTag: { color: c.success, fontWeight: '800' },
  del: { color: c.textMuted, fontSize: 16 },
  prBanner: {
    backgroundColor: c.successSoft,
    borderColor: c.success,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  prBannerText: { color: c.success, fontWeight: '800', fontSize: 15, letterSpacing: 0.3 },
  logBtn: { borderWidth: 1, borderColor: c.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center' },
  logBtnText: { color: c.accent, fontWeight: '800', fontSize: 16 },
  navBtn: {
    flex: 1,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  navOff: { opacity: 0.4 },
  navText: { color: c.text, fontWeight: '700' },
  finishBtn: { backgroundColor: c.accent, borderColor: c.accent },
  adjCard: { backgroundColor: c.surface, borderRadius: radius.md, padding: spacing.md, borderLeftWidth: 4, borderLeftColor: c.success },
  adjText: { color: c.text, lineHeight: 20 },
  note: { color: c.textMuted, fontStyle: 'italic' },
});
