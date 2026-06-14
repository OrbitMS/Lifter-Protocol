import { Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Field, Label, PrimaryButton, Subtitle } from '@/components/ui';
import { LineChart, type ChartPoint } from '@/components/LineChart';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import { radius, spacing, type Palette } from '@/constants/theme';
import { PATTERNS, getExerciseInfo, photosUrl, videoUrl } from '@/constants/exerciseInfo';
import { alternativesFor } from '@/engine/exercises';
import { baseExerciseName } from '@/lib/metrics';
import { roundLoad } from '@/lib/load';
import { displayToKg, fmtWeight, kgToDisplay } from '@/lib/units';
import { entryBestE1RM, useLogStore, type LoggedSet } from '@/store/useLogStore';
import { useActiveProfile, useProfileStore } from '@/store/useProfileStore';
import { useSettingsStore } from '@/store/useSettingsStore';

export default function ExerciseDetail() {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const params = useLocalSearchParams<{ name: string; target?: string; slot?: string; peers?: string }>();
  const slot = typeof params.slot === 'string' ? params.slot : undefined;
  const peers = typeof params.peers === 'string' ? params.peers.split('|').filter(Boolean) : [];

  const activeId = useProfileStore((s) => s.activeId) ?? '';
  const setOverride = useProfileStore((s) => s.setOverride);
  const clearOverride = useProfileStore((s) => s.clearOverride);
  const overrides = useActiveProfile()?.overrides ?? {};
  const allLogs = useLogStore((s) => s.logs);
  const addEntry = useLogStore((s) => s.addEntry);
  const removeEntry = useLogStore((s) => s.removeEntry);
  const units = useSettingsStore((s) => s.units);

  // the exercise currently shown (respects a saved swap for this slot)
  const [currentName, setCurrentName] = useState(
    () => (slot && overrides[slot]) || (typeof params.name === 'string' ? params.name : ''),
  );
  const info = getExerciseInfo(currentName);
  const meta = PATTERNS[info.pattern];
  const isSwapped = !!(slot && overrides[slot]);

  const entries = activeId ? allLogs[activeId]?.[baseExerciseName(currentName)] ?? [] : [];

  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [rpe, setRpe] = useState('');
  const [draft, setDraft] = useState<LoggedSet[]>([]);
  const [showSwap, setShowSwap] = useState(false);

  const addDraftSet = () => {
    const w = Number(weight);
    const r = Number(reps);
    if (!w || !r) return;
    setDraft((d) => [...d, { weight: roundLoad(displayToKg(w, units)), reps: r, rpe: rpe ? Number(rpe) : undefined }]);
    setWeight('');
    setReps('');
    setRpe('');
  };
  const saveSession = () => {
    if (draft.length === 0 || !activeId) return;
    addEntry(activeId, info.name, draft);
    setDraft([]);
  };

  const swapTo = (choice: string) => {
    if (slot) setOverride(slot, choice);
    setCurrentName(choice);
    setShowSwap(false);
  };
  const resetSwap = () => {
    if (slot) clearOverride(slot);
    setCurrentName(slot ?? currentName);
    setShowSwap(false);
  };

  const chartData: ChartPoint[] = entries.map((e, i) => ({
    x: i,
    y: kgToDisplay(entryBestE1RM(e), units),
    label: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
  }));

  return (
    <>
      <Stack.Screen options={{ title: info.name, headerShown: true }} />
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
        <View style={[styles.banner, { backgroundColor: meta.color + '22', borderColor: meta.color }]}>
          <Text style={styles.bannerEmoji}>{info.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>{info.label}</Text>
            <Text style={styles.bannerSub}>
              {info.primaryMuscles.join(' · ')}{info.equipment ? ` · ${info.equipment}` : ''}
            </Text>
          </View>
        </View>

        {params.target ? <Subtitle>Today’s target: {params.target}</Subtitle> : null}

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(videoUrl(info.name))}>
            <Text style={styles.linkText}>▶  Watch video</Text>
          </Pressable>
          <Pressable style={styles.linkBtn} onPress={() => Linking.openURL(photosUrl(info.name))}>
            <Text style={styles.linkText}>🖼  Photos</Text>
          </Pressable>
        </View>

        {/* swap exercise */}
        {slot ? (
          <View style={{ gap: spacing.sm }}>
            <Pressable style={styles.swapBtn} onPress={() => setShowSwap((v) => !v)}>
              <Text style={styles.swapBtnText}>
                {showSwap ? 'Close' : isSwapped ? `Swapped from ${slot} — change` : 'Don’t like it? Swap exercise'}
              </Text>
            </Pressable>
            {showSwap && (
              <View style={styles.card}>
                <Text style={styles.swapHint}>Same movement pattern — keeps your session’s intent:</Text>
                {alternativesFor(slot)
                  .filter((alt) => alt === currentName || !peers.includes(alt))
                  .map((alt) => (
                  <Pressable key={alt} style={styles.altRow} onPress={() => swapTo(alt)}>
                    <Text style={[styles.altName, alt === currentName && { color: c.accent }]}>
                      {alt}
                    </Text>
                    {alt === currentName ? <Text style={styles.altCur}>current</Text> : null}
                  </Pressable>
                ))}
                {isSwapped && (
                  <Pressable style={styles.altRow} onPress={resetSwap}>
                    <Text style={[styles.altName, { color: c.textMuted }]}>↺ Reset to {slot}</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>
        ) : null}

        <View style={{ gap: spacing.xs }}>
          <Text style={styles.section}>HOW TO PERFORM</Text>
          {info.instructions.map((step, i) => (
            <View key={i} style={styles.step}>
              <Text style={styles.stepNum}>{i + 1}</Text>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text style={styles.section}>KEY CUES</Text>
          {info.cues.map((c, i) => (
            <Text key={i} style={styles.cue}>• {c}</Text>
          ))}
        </View>

        {chartData.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={styles.section}>EST. 1RM OVER TIME</Text>
            <View style={styles.card}>
              <LineChart data={chartData} />
            </View>
          </View>
        )}

        <View style={{ gap: spacing.sm }}>
          <Text style={styles.section}>LOG THIS EXERCISE</Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <View style={{ flex: 1 }}>
              <Label>Weight ({units})</Label>
              <Field keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder="100" />
            </View>
            <View style={{ flex: 1 }}>
              <Label>Reps</Label>
              <Field keyboardType="number-pad" value={reps} onChangeText={setReps} placeholder="5" />
            </View>
            <View style={{ flex: 1 }}>
              <Label>RPE</Label>
              <Field keyboardType="decimal-pad" value={rpe} onChangeText={setRpe} placeholder="8" />
            </View>
          </View>
          <Pressable style={styles.addSet} onPress={addDraftSet}>
            <Text style={styles.addSetText}>+ Add set</Text>
          </Pressable>
          {draft.map((s, i) => (
            <Text key={i} style={styles.draftSet}>
              Set {i + 1}: {fmtWeight(s.weight, units)} × {s.reps}{s.rpe ? ` @ RPE ${s.rpe}` : ''}
            </Text>
          ))}
          {draft.length > 0 && <PrimaryButton label={`Save session (${draft.length} sets)`} onPress={saveSession} />}
        </View>

        {entries.length > 0 && (
          <View style={{ gap: spacing.xs }}>
            <Text style={styles.section}>HISTORY</Text>
            {[...entries].reverse().map((e) => (
              <View key={e.id} style={styles.card}>
                <View style={styles.histHead}>
                  <Text style={styles.histDate}>{new Date(e.date).toLocaleDateString()}</Text>
                  <Pressable onPress={() => removeEntry(activeId, info.name, e.id)}>
                    <Text style={styles.del}>Delete</Text>
                  </Pressable>
                </View>
                {e.sets.map((s, i) => (
                  <Text key={i} style={styles.histSet}>
                    {fmtWeight(s.weight, units)} × {s.reps}{s.rpe ? ` @ RPE ${s.rpe}` : ''}
                  </Text>
                ))}
                <Text style={styles.histE1rm}>Est. 1RM: {fmtWeight(entryBestE1RM(e), units)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  bannerEmoji: { fontSize: 40 },
  bannerTitle: { color: c.text, fontSize: 18, fontWeight: '700' },
  bannerSub: { color: c.textMuted, fontSize: 13, marginTop: 2 },
  section: { color: c.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  linkBtn: {
    flex: 1,
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  linkText: { color: c.text, fontWeight: '600' },
  swapBtn: {
    borderWidth: 1,
    borderColor: c.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  swapBtnText: { color: c.accent, fontWeight: '700' },
  swapHint: { color: c.textMuted, fontSize: 13, marginBottom: spacing.xs },
  altRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: c.border,
  },
  altName: { color: c.text, fontSize: 15 },
  altCur: { color: c.accent, fontSize: 11, fontWeight: '700' },
  step: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  stepNum: {
    color: c.bg,
    backgroundColor: c.accent,
    fontWeight: '800',
    fontSize: 12,
    width: 20,
    height: 20,
    borderRadius: 10,
    textAlign: 'center',
    lineHeight: 20,
    overflow: 'hidden',
  },
  stepText: { color: c.text, flex: 1, lineHeight: 21 },
  cue: { color: c.textMuted, lineHeight: 21 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
    gap: 2,
  },
  addSet: {
    borderWidth: 1,
    borderColor: c.accent,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  addSetText: { color: c.accent, fontWeight: '700' },
  draftSet: { color: c.text },
  histHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  histDate: { color: c.text, fontWeight: '700' },
  del: { color: c.textMuted, fontSize: 12 },
  histSet: { color: c.textMuted },
  histE1rm: { color: c.success, fontWeight: '700', marginTop: 4 },
});
