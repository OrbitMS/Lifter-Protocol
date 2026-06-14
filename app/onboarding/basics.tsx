import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Field,
  InfoLabel,
  OptionCard,
  PrimaryButton,
  ProgressBar,
  Subtitle,
  Title,
} from '@/components/ui';
import { spacing } from '@/constants/theme';
import { useProfileStore } from '@/store/useProfileStore';
import type { Gender } from '@/types/profile';

// Step 1 of 6 — Basics: gender, age, height, weight.
export default function Basics() {
  const router = useRouter();
  const setBasics = useProfileStore((s) => s.setBasics);
  const b = useProfileStore((s) => s.draft.profile.basics);

  const [name, setName] = useState(b?.name ?? '');
  const [gender, setGender] = useState<Gender>(b?.gender ?? 'male');
  const [age, setAge] = useState(b?.age ? String(b.age) : '');
  const [height, setHeight] = useState(b?.heightCm ? String(b.heightCm) : '');
  const [weight, setWeight] = useState(b?.weightKg ? String(b.weightKg) : '');

  const valid = age && height && weight;

  const next = () => {
    setBasics({
      name: name.trim() || undefined,
      gender,
      age: Number(age),
      heightCm: Number(height),
      weightKg: Number(weight),
      units: 'metric',
    });
    router.push('/onboarding/history');
  };

  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.md, flexGrow: 1 }}>
      <ProgressBar step={1} total={6} />
      <Title>About you</Title>
      <Subtitle>The basics let us calibrate volume and bodyweight targets.</Subtitle>

      <InfoLabel help="Just a label so you can tell profiles apart on the Profile tab. It doesn’t affect your plan.">
        Profile name (optional)
      </InfoLabel>
      <Field value={name} onChangeText={setName} placeholder="e.g. Marcel" autoCapitalize="words" />

      <InfoLabel help="Stored on your profile. Your loads come from your 1RMs, so this doesn’t change the program.">
        Gender
      </InfoLabel>
      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        {(['male', 'female', 'other'] as Gender[]).map((g) => (
          <View key={g} style={{ flex: 1 }}>
            <OptionCard
              title={g[0].toUpperCase() + g.slice(1)}
              selected={gender === g}
              onPress={() => setGender(g)}
            />
          </View>
        ))}
      </View>

      <InfoLabel help="From about 45+ we trim a little accessory volume, since recovery slows with age.">
        Age
      </InfoLabel>
      <Field keyboardType="number-pad" value={age} onChangeText={setAge} placeholder="28" />
      <InfoLabel help="Profile info only — it doesn’t change your sets, reps or loads.">Height (cm)</InfoLabel>
      <Field keyboardType="number-pad" value={height} onChangeText={setHeight} placeholder="180" />
      <InfoLabel help="Profile info only — your loads are based on your 1RMs, not bodyweight.">Weight (kg)</InfoLabel>
      <Field keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder="85" />

      <PrimaryButton label="Continue" onPress={next} disabled={!valid} />
    </ScrollView>
  );
}
