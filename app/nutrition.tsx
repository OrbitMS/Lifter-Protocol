import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { PrimaryButton, Subtitle, Title } from '@/components/ui';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import { radius, spacing, type Palette } from '@/constants/theme';
import { computeTargets, GOAL_LABEL } from '@/engine/nutrition';
import { useActiveProfile } from '@/store/useProfileStore';

export default function NutritionScreen() {
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const router = useRouter();
  const active = useActiveProfile();
  const p = active?.profile;
  const b = p?.basics;
  const n = p?.nutrition;

  if (!b || !n) {
    return (
      <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
        <Stack.Screen options={{ title: 'Nutrition', headerShown: true }} />
        <Title>Nutrition targets</Title>
        <Subtitle>Finish onboarding (basics + diet goal) and we’ll compute your calorie and macro targets.</Subtitle>
        <PrimaryButton label="Complete onboarding" onPress={() => router.push('/onboarding/basics')} />
      </ScrollView>
    );
  }

  const t = computeTargets({
    weightKg: b.weightKg,
    heightCm: b.heightCm,
    age: b.age,
    gender: b.gender,
    jobActivity: p.recovery?.jobActivity,
    daysPerWeek: active?.program?.config.daysPerWeek,
    goal: n.dietGoal,
  });

  const macros = [
    { key: 'Protein', grams: t.protein, cals: t.protein * 4, color: c.accent },
    { key: 'Carbs', grams: t.carbs, cals: t.carbs * 4, color: c.warning },
    { key: 'Fat', grams: t.fat, cals: t.fat * 9, color: c.success },
  ];
  const totalCals = macros.reduce((s, m) => s + m.cals, 0) || 1;

  return (
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Nutrition', headerShown: true }} />

      <View>
        <Title>Daily targets</Title>
        <Subtitle>Goal: {GOAL_LABEL[n.dietGoal]} · estimated from your profile</Subtitle>
      </View>

      {/* calories hero */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>CALORIES / DAY</Text>
        <Text style={styles.heroValue}>{t.calories.toLocaleString()}</Text>
        <Text style={styles.heroSub}>BMR {t.bmr.toLocaleString()} · maintenance ≈ {t.tdee.toLocaleString()} kcal</Text>
      </View>

      {/* macro split bar */}
      <View style={styles.splitBar}>
        {macros.map((m) => (
          <View key={m.key} style={{ width: `${(m.cals / totalCals) * 100}%`, backgroundColor: m.color }} />
        ))}
      </View>

      {/* macro cards */}
      <View style={styles.macroRow}>
        {macros.map((m) => (
          <View key={m.key} style={styles.macro}>
            <View style={[styles.dot, { backgroundColor: m.color }]} />
            <Text style={styles.macroLabel}>{m.key}</Text>
            <Text style={styles.macroGrams}>{m.grams}g</Text>
            <Text style={styles.macroPct}>{Math.round((m.cals / totalCals) * 100)}%</Text>
          </View>
        ))}
      </View>

      <Text style={styles.note}>
        Protein is set to {(t.protein / b.weightKg).toFixed(1)} g per kg of bodyweight, fat at ~25% of calories, and carbohydrates
        fill the remainder. Targets update automatically when you edit your profile or diet goal.
      </Text>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  hero: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.lg,
    alignItems: 'center',
    gap: 4,
  },
  heroLabel: { color: c.textMuted, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  heroValue: { color: c.accent, fontSize: 48, fontWeight: '900', letterSpacing: -1 },
  heroSub: { color: c.textMuted, fontSize: 13 },
  splitBar: {
    flexDirection: 'row',
    height: 14,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: c.surfaceAlt,
  },
  macroRow: { flexDirection: 'row', gap: spacing.sm },
  macro: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: c.border,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  dot: { width: 10, height: 10, borderRadius: 5, marginBottom: 2 },
  macroLabel: { color: c.textMuted, fontSize: 12, fontWeight: '700' },
  macroGrams: { color: c.text, fontSize: 22, fontWeight: '800' },
  macroPct: { color: c.textFaint, fontSize: 12 },
  note: { color: c.textMuted, fontSize: 13, lineHeight: 20 },
});
