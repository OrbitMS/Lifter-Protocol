import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Line, Text as SvgText } from 'react-native-svg';
import { spacing, radius, type Palette } from '@/constants/theme';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import { dbDeleteTechnique, dbGetTechniqueById, type TechniqueRow } from '@/lib/db';
import type { PoseAngles } from '@/lib/poseUtils';

function parseAngles(json: string): PoseAngles[] {
  try { return JSON.parse(json) as PoseAngles[]; } catch { return []; }
}

// ─── Tiny SVG line chart ──────────────────────────────────────────────────────

type Serie = { label: string; color: string; values: number[] };

function AngleChart({ series, width = 320, height = 120 }: { series: Serie[]; width?: number; height?: number }) {
  const pad = { top: 8, right: 8, bottom: 20, left: 28 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;

  const allVals = series.flatMap((s) => s.values);
  const minV = Math.max(0, Math.min(...allVals) - 10);
  const maxV = Math.min(180, Math.max(...allVals) + 10);
  const range = maxV - minV || 1;

  const toX = (i: number, n: number) => pad.left + (i / Math.max(n - 1, 1)) * innerW;
  const toY = (v: number) => pad.top + (1 - (v - minV) / range) * innerH;

  return (
    <Svg width={width} height={height}>
      {/* Y gridlines */}
      {[minV, (minV + maxV) / 2, maxV].map((v) => (
        <Line
          key={v}
          x1={pad.left} y1={toY(v)} x2={pad.left + innerW} y2={toY(v)}
          stroke="#444" strokeWidth={0.5}
        />
      ))}
      {/* Y labels */}
      {[minV, maxV].map((v) => (
        <SvgText key={v} x={pad.left - 4} y={toY(v) + 4} fontSize={9} fill="#888" textAnchor="end">
          {Math.round(v)}°
        </SvgText>
      ))}

      {/* Lines per series */}
      {series.map((s) =>
        s.values.map((v, i) => {
          if (i === 0) return null;
          return (
            <Line
              key={`${s.label}-${i}`}
              x1={toX(i - 1, s.values.length)} y1={toY(s.values[i - 1])}
              x2={toX(i, s.values.length)} y2={toY(v)}
              stroke={s.color} strokeWidth={2}
            />
          );
        })
      )}

      {/* Legend */}
      {series.map((s, si) => (
        <SvgText key={s.label} x={pad.left + si * 70} y={height - 4} fontSize={10} fill={s.color}>
          — {s.label}
        </SvgText>
      ))}
    </Svg>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function PlaybackScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>();
  const router = useRouter();
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const [session, setSession] = useState<TechniqueRow | null | undefined>(undefined);

  useEffect(() => {
    setSession(dbGetTechniqueById(sessionId ?? ''));
  }, [sessionId]);

  const angles = useMemo(() => (session ? parseAngles(session.angles_json) : []), [session]);

  const kneeValues = angles.map((a) => a.avgKnee);
  const hipValues = angles.map((a) => a.avgHip);
  const worstIdx = kneeValues.reduce((mi, v, i) => (v < kneeValues[mi] ? i : mi), 0);
  const worst = angles[worstIdx];

  const handleDelete = () => {
    if (!session) return;
    dbDeleteTechnique(session.id);
    router.back();
  };

  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <Text style={styles.headerTitle}>{session ? `${session.exercise_name} — Analysis` : 'Analysis'}</Text>
    </View>
  );

  if (session === undefined) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <View style={styles.centred}><Text style={styles.muted}>Loading…</Text></View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
        {header}
        <View style={styles.centred}><Text style={styles.muted}>Session not found.</Text></View>
      </SafeAreaView>
    );
  }

  const date = new Date(session.date).toLocaleDateString(undefined, {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }}>
      {header}
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>

        {/* Meta */}
        <View style={styles.card}>
          <Text style={styles.label}>EXERCISE</Text>
          <Text style={styles.bigText}>{session.exercise_name}</Text>
          <Text style={styles.muted}>{date} · {angles.length} frames</Text>
        </View>

        {/* Angle timeline */}
        {angles.length > 1 && (
          <View style={styles.card}>
            <Text style={styles.label}>ANGLE TIMELINE</Text>
            <View style={{ alignItems: 'center', marginTop: spacing.sm }}>
              <AngleChart
                series={[
                  { label: 'Knee', color: '#21B8E8', values: kneeValues },
                  { label: 'Hip', color: '#2FCC74', values: hipValues },
                ]}
                width={320}
                height={130}
              />
            </View>
          </View>
        )}

        {/* Worst frame stats */}
        {worst && (
          <View style={styles.card}>
            <Text style={styles.label}>DEEPEST / HARDEST FRAME</Text>
            <View style={styles.statsRow}>
              <StatBox label="Knee" value={`${worst.avgKnee}°`} color={c.accent} />
              <StatBox label="Hip" value={`${worst.avgHip}°`} color="#2FCC74" />
              {worst.kneeSymmetry > 8 && (
                <StatBox label="Asymmetry" value={`${worst.kneeSymmetry}°`} color="#F2922C" />
              )}
            </View>
          </View>
        )}

        {/* Coach summary */}
        <View style={styles.card}>
          <Text style={styles.label}>COACH NOTES</Text>
          <Text style={styles.summaryText}>{session.summary}</Text>
        </View>

        {/* Actions */}
        <Pressable
          style={styles.coachBtn}
          onPress={() => router.push('/coach')}
        >
          <Text style={styles.coachBtnText}>Ask coach about this session ›</Text>
        </Pressable>

        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Delete session</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color, fontSize: 22, fontWeight: '800' }}>{value}</Text>
      <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{label}</Text>
    </View>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backText: { color: c.accent, fontSize: 28, lineHeight: 30 },
    headerTitle: { color: c.text, fontWeight: '700', fontSize: 16 },
    centred: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      padding: spacing.md,
      gap: spacing.xs,
    },
    label: { color: c.accent, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
    bigText: { color: c.text, fontSize: 20, fontWeight: '800' },
    muted: { color: c.textMuted, fontSize: 13 },
    statsRow: { flexDirection: 'row', marginTop: spacing.sm },
    summaryText: { color: c.text, lineHeight: 22, fontSize: 15 },
    coachBtn: {
      backgroundColor: c.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    coachBtnText: { color: c.onAccent, fontWeight: '800', fontSize: 15 },
    deleteBtn: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    deleteBtnText: { color: c.textMuted, fontWeight: '600' },
  });
