import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Subtitle, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/useProfileStore';

// Progress — placeholder for e1RM charts, tonnage and PRs (Phase 2).
export default function Progress() {
  const maxes = useProfileStore((s) => s.profile.history?.maxes);

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>Progress</Title>
      <Subtitle>Estimated 1RMs update as you log RPE-based sets.</Subtitle>

      {maxes &&
        (['squat', 'bench', 'deadlift'] as const).map((lift) => (
          <View key={lift} style={styles.stat}>
            <Text style={styles.lift}>{lift}</Text>
            <Text style={styles.value}>{maxes[lift]} kg</Text>
          </View>
        ))}

      <Subtitle>📈 Charts & PR history arrive in Phase 2 (auto-regulation).</Subtitle>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  stat: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  lift: { color: colors.textMuted, fontSize: 16, textTransform: 'capitalize' },
  value: { color: colors.text, fontSize: 16, fontWeight: '700' },
});
