import { useRouter } from 'expo-router';
import { ReactNode } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Subtitle, Title } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { getProgramMeta } from '@/constants/programs';
import {
  profileName,
  useActiveProfile,
  useProfileStore,
} from '@/store/useProfileStore';

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
  const profiles = useProfileStore((s) => s.profiles);
  const activeId = useProfileStore((s) => s.activeId);
  const switchProfile = useProfileStore((s) => s.switchProfile);
  const deleteProfile = useProfileStore((s) => s.deleteProfile);
  const startNewProfile = useProfileStore((s) => s.startNewProfile);
  const active = useActiveProfile();

  const newProfile = () => {
    startNewProfile();
    router.push('/onboarding/basics');
  };

  const confirmDelete = (id: string, name: string) => {
    const doDelete = () => {
      deleteProfile(id);
      if (useProfileStore.getState().profiles.length === 0) router.replace('/onboarding/basics');
    };
    if (Platform.OS === 'web') {
      // RN-web Alert only shows one button; use confirm
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined' && window.confirm(`Delete profile “${name}”? This removes its plan and logs.`)) doDelete();
      return;
    }
    Alert.alert('Delete profile', `Delete “${name}”? This removes its plan and logs.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  const p = active;
  const basics = p?.profile.basics;
  const history = p?.profile.history;
  const recovery = p?.profile.recovery;
  const nutrition = p?.profile.nutrition;
  const program = p?.program;
  const totalWeeks = program?.blocks.reduce((n, b) => n + b.weeks.length, 0) ?? 0;
  const perWeek = program?.config.daysPerWeek ?? 0;
  const meta = program ? getProgramMeta(program.type) : null;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, flexGrow: 1 }}>
      <View>
        <Title>{p ? profileName(p, profiles.findIndex((x) => x.id === p.id)) : 'Profiles'}</Title>
        <Subtitle>Switch between athletes or add a new profile — each keeps its own plan and logs.</Subtitle>
      </View>

      {/* profile switcher */}
      <View style={{ gap: spacing.sm }}>
        <Text style={styles.section}>PROFILES</Text>
        {profiles.map((sp, i) => {
          const isActive = sp.id === activeId;
          return (
            <Pressable
              key={sp.id}
              onPress={() => switchProfile(sp.id)}
              style={[styles.profRow, isActive && styles.profRowActive]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.profName}>{profileName(sp, i)}</Text>
                <Text style={styles.profMeta}>
                  {getProgramMeta(sp.program.type).title} · {sp.program.config.daysPerWeek}d/wk
                </Text>
              </View>
              {isActive ? <Text style={styles.activeTag}>ACTIVE</Text> : null}
              <Pressable hitSlop={10} onPress={() => confirmDelete(sp.id, profileName(sp, i))}>
                <Text style={styles.del}>Delete</Text>
              </Pressable>
            </Pressable>
          );
        })}
        <Pressable style={styles.addProf} onPress={newProfile}>
          <Text style={styles.addProfText}>+ New profile</Text>
        </Pressable>
      </View>

      {!p ? (
        <Subtitle>No active profile. Add one to get started.</Subtitle>
      ) : (
        <>
          <Section title="ATHLETE">
            <Row k="Name" v={basics?.name || '—'} />
            <Row k="Gender" v={cap(basics?.gender)} />
            <Row k="Age" v={basics?.age ? `${basics.age}` : '—'} />
            <Row k="Height" v={basics?.heightCm ? `${basics.heightCm} cm` : '—'} />
            <Row k="Bodyweight" v={basics?.weightKg ? `${basics.weightKg} kg` : '—'} />
          </Section>

          <Section title="TRAINING">
            <Row k="Experience" v={history ? `${history.yearsTraining} yrs` : '—'} />
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
          </Section>

          <Section title="NUTRITION">
            <Row k="Diet goal" v={cap(nutrition?.dietGoal)} />
            <Row k="Tracks macros" v={nutrition ? (nutrition.tracksMacros ? 'Yes' : 'No') : '—'} />
          </Section>

          <Section title="PROGRAM">
            <Row k="Type" v={meta?.title ?? '—'} />
            <Row k="Days / week" v={perWeek || '—'} />
            <Row k="Training days" v={list(program?.config.trainingDays)} />
            <Row k="Upper focus" v={list(program?.config.upperFocus)} />
            <Row k="Lower focus" v={list(program?.config.lowerFocus)} />
          </Section>

          <Section title="TRAINING PLAN">
            <Row k="Blocks" v={`${program?.blocks.length ?? 0}`} />
            <Row k="Total weeks" v={`${totalWeeks}`} />
            <Row k="Sessions" v={`${totalWeeks * perWeek} (${perWeek}/wk)`} />
            <Row k="Phases" v={program?.blocks.map((b) => cap(b.phase)).join(' → ')} />
          </Section>

          <PrimaryButton label="+ New profile" onPress={newProfile} />
        </>
      )}
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
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm },
  k: { color: colors.textMuted, fontSize: 14 },
  v: { color: colors.text, fontSize: 14, fontWeight: '600', textTransform: 'capitalize', maxWidth: '60%', textAlign: 'right' },
  profRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  profRowActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  profName: { color: colors.text, fontSize: 16, fontWeight: '700' },
  profMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  activeTag: { color: colors.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  del: { color: colors.textMuted, fontSize: 12 },
  addProf: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderStyle: 'dashed',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  addProfText: { color: colors.accent, fontWeight: '700' },
});
