import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Badge, Subtitle, Title } from '@/components/ui';
import { LineChart, type ChartPoint } from '@/components/LineChart';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import { radius, spacing, type Palette } from '@/constants/theme';
import { entryBestE1RM, useLogStore } from '@/store/useLogStore';
import { useActiveProfile } from '@/store/useProfileStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import { kgToDisplay } from '@/lib/units';

// Progress — visualizes logged numbers (est. 1RM trend per tracked exercise).
export default function Progress() {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const active = useActiveProfile();
  const maxes = active?.profile.history?.maxes;
  const units = useSettingsStore((s) => s.units);
  const allLogs = useLogStore((s) => s.logs);
  const logs = active ? allLogs[active.id] ?? {} : {};

  const tracked = Object.keys(logs)
    .filter((k) => (logs[k]?.length ?? 0) > 0)
    .sort();

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <View>
        <Title>Progress</Title>
        <Subtitle>Estimated 1RM trends from your logged sets.</Subtitle>
      </View>

      {maxes && (
        <View style={{ gap: spacing.xs }}>
          <Text style={styles.section}>STARTING 1RM</Text>
          <View style={styles.statRow}>
            {(['squat', 'bench', 'deadlift'] as const).map((lift) => (
              <View key={lift} style={styles.stat}>
                <Text style={styles.statLift}>{lift}</Text>
                <Text style={styles.statVal}>{kgToDisplay(maxes[lift], units)}</Text>
                <Text style={styles.statUnit}>{units}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      <View style={{ gap: spacing.md }}>
        <Text style={styles.section}>TRACKED EXERCISES</Text>
        {tracked.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.empty}>
              No logs yet. Open an exercise from Today and log your sets — your estimated-1RM trend
              will plot here automatically.
            </Text>
          </View>
        ) : (
          tracked.map((name) => {
            const entries = logs[name];
            const data: ChartPoint[] = entries.map((e, i) => ({
              x: i,
              y: kgToDisplay(entryBestE1RM(e), units),
              label: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
            }));
            const best = Math.max(...data.map((d) => d.y));
            const first = data[0]?.y ?? 0;
            const delta = best - first;
            return (
              <Pressable
                key={name}
                style={styles.card}
                onPress={() => router.push({ pathname: '/exercise/[name]', params: { name } })}
              >
                <View style={styles.cardHead}>
                  <Text style={styles.cardTitle}>{name}</Text>
                  <View style={styles.headRight}>
                    <Text style={styles.best}>{best} {units}</Text>
                    {delta > 0 ? <Badge label={`▲ ${delta}`} tone="success" /> : null}
                  </View>
                </View>
                <LineChart data={data} />
                <Text style={styles.count}>{entries.length} session{entries.length === 1 ? '' : 's'} logged</Text>
              </Pressable>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  section: { color: c.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLift: { color: c.textMuted, fontSize: 12, textTransform: 'capitalize' },
  statVal: { color: c.text, fontSize: 22, fontWeight: '800', marginTop: 2 },
  statUnit: { color: c.textMuted, fontSize: 11 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  headRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  cardTitle: { color: c.text, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  best: { color: c.text, fontWeight: '700' },
  count: { color: c.textMuted, fontSize: 12 },
  empty: { color: c.textMuted, lineHeight: 20 },
});
