import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Subtitle, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { getProgramMeta } from '@/constants/programs';
import { useProfileStore } from '@/store/useProfileStore';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={{ gap: spacing.xs }}>
      <Text style={styles.section}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({ k, v }: { k: string; v: ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.k}>{k}</Text>
      <Text style={styles.v}>{v ?? '—'}</Text>
    </View>
  );
}

const cap = (s?: string) => (s ? s[0].toUpperCase() + s.slice(1) : '—');
const list = (xs?: string[]) => (xs && xs.length ? xs.map(cap).join(', ') : '—');

export default function ProfileTab() {
  const router = useRouter();
  const { profile, config, program, reset } = useProfileStore();
  const { basics, history, recovery, nutrition } = profile;

  const restart = () => {
    reset();
    router.replace('/onboarding/basics');
  };

  // training-plan summary
  const totalWeeks = program?.blocks.reduce((n, b) => n + b.weeks.length, 0) ?? 0;
  const perWeek = program?.config.daysPerWeek ?? config.daysPerWeek ?? 0;
  const totalSessions = totalWeeks * perWeek;
  const meta = program ? getProgramMeta(program.type) : config.type ? getProgramMeta(config.type) : null;

  return (
    <ScrollView
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, flexGrow: 1 }}
    >
      <View>
        <Title>{basics?.name || 'Your Profile'}</Title>
        <Subtitle>All settings and your training plan are saved on this device.</Subtitle>
      </View>

      <Section title="ATHLETE">
        <Row k="Gender" v={cap(basics?.gender)} />
        <Row k="Age" v={basics?.age ? `${basics.age}` : '—'} />
        <Row k="Height" v={basics?.heightCm ? `${basics.heightCm} cm` : '—'} />
        <Row k="Bodyweight" v={basics?.weightKg ? `${basics.weightKg} kg` : '—'} />
      </Section>

      <Section title="TRAINING">
        <Row k="Experience" v={history ? `${history.yearsTraining} yrs` : '—'} />
        <Row k="Frequency pref" v={cap(history?.frequencyPreference)} />
        <Row k="Squat 1RM" v={history ? `${history.maxes.squat} kg` : '—'} />
        <Row k="Bench 1RM" v={history ? `${history.maxes.bench} kg` : '—'} />
        <Row k="Deadlift 1RM" v={history ? `${history.maxes.deadlift} kg` : '—'} />
      </Section>

      <Section title="RECOVERY">
        <Row
          k="Recovery index"
          v={recovery?.recoveryIndex != null ? `${recovery.recoveryIndex.toFixed(2)} (${recovery.recoveryBucket})` : '—'}
        />
        <Row k="Sleep" v={recovery?.sleepHours ? `${recovery.sleepHours} h/night` : '—'} />
        <Row k="Life stress" v={recovery ? `${recovery.lifeStress}/5` : '—'} />
        <Row k="Job activity" v={recovery ? `${recovery.jobActivity}/5` : '—'} />
      </Section>

      <Section title="NUTRITION">
        <Row k="Diet goal" v={cap(nutrition?.dietGoal)} />
        <Row k="Tracks macros" v={nutrition ? (nutrition.tracksMacros ? 'Yes' : 'No') : '—'} />
      </Section>

      <Section title="PROGRAM">
        <Row k="Type" v={meta?.title ?? '—'} />
        <Row k="Days / week" v={perWeek || '—'} />
        <Row k="Training days" v={list(program?.config.trainingDays ?? config.trainingDays)} />
        <Row k="BB / PL split" v={
          (program?.config.bbToPlRatio ?? config.bbToPlRatio) != null
            ? `${program?.config.bbToPlRatio ?? config.bbToPlRatio}% / ${100 - (program?.config.bbToPlRatio ?? config.bbToPlRatio)!}%`
            : '—'
        } />
        <Row k="Upper focus" v={list(program?.config.upperFocus ?? config.upperFocus)} />
        <Row k="Lower focus" v={list(program?.config.lowerFocus ?? config.lowerFocus)} />
      </Section>

      <Section title="TRAINING PLAN">
        {program ? (
          <>
            <Row k="Blocks" v={`${program.blocks.length}`} />
            <Row k="Total weeks" v={`${totalWeeks}`} />
            <Row k="Sessions" v={`${totalSessions} (${perWeek}/wk)`} />
            <Row k="Phases" v={program.blocks.map((b) => cap(b.phase)).join(' → ')} />
            <Text style={styles.note}>Generated {new Date(program.generatedAt).toLocaleDateString()}</Text>
          </>
        ) : (
          <Text style={styles.note}>No plan yet — finish onboarding to generate one.</Text>
        )}
      </Section>

      <Subtitle>Restarting clears this profile and rebuilds the plan from scratch.</Subtitle>
      <PrimaryButton label="Restart onboarding" onPress={restart} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  section: { color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  k: { color: colors.textMuted, fontSize: 14 },
  v: { color: colors.text, fontSize: 14, fontWeight: '600', textTransform: 'capitalize', maxWidth: '60%', textAlign: 'right' },
  note: { color: colors.textMuted, fontSize: 13, paddingVertical: spacing.sm, fontStyle: 'italic' },
});
