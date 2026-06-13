import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Subtitle, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/useProfileStore';

// Program overview — the macrocycle: blocks → weeks → session count.
export default function ProgramOverview() {
  const program = useProfileStore((s) => s.program);

  if (!program) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg }}>
        <Title>No program</Title>
      </View>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md }}>
      <Title>Your macrocycle</Title>
      <Subtitle>
        {program.type} · {program.config.daysPerWeek} days/week
      </Subtitle>

      {program.blocks.map((block, i) => (
        <View key={i} style={styles.block}>
          <Text style={styles.phase}>{block.phase.toUpperCase()}</Text>
          <Text style={styles.weeks}>
            {block.weeks.length} weeks · {block.weeks[0].sessions.length} sessions/week
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  block: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  phase: { color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  weeks: { color: colors.textMuted, marginTop: 4 },
});
