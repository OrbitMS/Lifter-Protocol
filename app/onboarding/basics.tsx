import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import {
  Field,
  Label,
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

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');

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

      <Label>Profile name (optional)</Label>
      <Field value={name} onChangeText={setName} placeholder="e.g. Marcel" autoCapitalize="words" />

      <Label>Gender</Label>
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

      <Label>Age</Label>
      <Field keyboardType="number-pad" value={age} onChangeText={setAge} placeholder="28" />
      <Label>Height (cm)</Label>
      <Field keyboardType="number-pad" value={height} onChangeText={setHeight} placeholder="180" />
      <Label>Weight (kg)</Label>
      <Field keyboardType="decimal-pad" value={weight} onChangeText={setWeight} placeholder="85" />

      <PrimaryButton label="Continue" onPress={next} disabled={!valid} />
    </ScrollView>
  );
}
