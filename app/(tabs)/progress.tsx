import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Subtitle, Title } from '@/components/ui';
import { LineChart, type ChartPoint } from '@/components/LineChart';
import { colors, radius, spacing } from '@/constants/theme';
import { entryBestE1RM, useLogStore } from '@/store/useLogStore';
import { useProfileStore } from '@/store/useProfileStore';

// Progress — visualizes logged numbers (est. 1RM trend per tracked exercise).
export default function Progress() {
  const router = useRouter();
  const maxes = useProfileStore((s) => s.profile.history?.maxes);
  const logs = useLogStore((s) => s.logs);

  const tracked = Object.keys(logs)
    .filter((k) => (logs[k]?.length ?? 0) > 0)
    .sort();

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
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
                <Text style={styles.statVal}>{maxes[lift]}</Text>
                <Text style={styles.statUnit}>kg</Text>
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
              y: entryBestE1RM(e),
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
                  <Text style={styles.best}>
                    {best} kg
                    {delta > 0 ? <Text style={styles.up}>  ▲{delta}</Text> : null}
                  </Text>
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

const styles = StyleSheet.create({
  section: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
  },
  statLift: { color: colors.textMuted, fontSize: 12, textTransform: 'capitalize' },
  statVal: { color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 2 },
  statUnit: { color: colors.textMuted, fontSize: 11 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { color: colors.text, fontSize: 16, fontWeight: '700', flexShrink: 1 },
  best: { color: colors.text, fontWeight: '700' },
  up: { color: colors.success, fontWeight: '700' },
  count: { color: colors.textMuted, fontSize: 12 },
  empty: { color: colors.textMuted, lineHeight: 20 },
});
