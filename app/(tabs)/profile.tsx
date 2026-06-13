import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Subtitle, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/useProfileStore';

export default function ProfileTab() {
  const router = useRouter();
  const { profile, reset } = useProfileStore();
  const rec = profile.recovery;

  const restart = () => {
    reset();
    router.replace('/onboarding/basics');
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
      <Title>Profile</Title>

      <View style={styles.card}>
        <Text style={styles.k}>Recovery index</Text>
        <Text style={styles.v}>
          {rec?.recoveryIndex != null ? rec.recoveryIndex.toFixed(2) : '—'} ({rec?.recoveryBucket ?? '—'})
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.k}>Diet goal</Text>
        <Text style={styles.v}>{profile.nutrition?.dietGoal ?? '—'}</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.k}>Experience</Text>
        <Text style={styles.v}>{profile.history?.yearsTraining ?? '—'} years</Text>
      </View>

      <Subtitle>Editing any answer rebuilds your program.</Subtitle>
      <PrimaryButton label="Restart onboarding" onPress={restart} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  k: { color: colors.textMuted, fontSize: 15 },
  v: { color: colors.text, fontSize: 15, fontWeight: '600', textTransform: 'capitalize' },
});
