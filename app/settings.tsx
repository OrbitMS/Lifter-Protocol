import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Field, Label, OptionCard, Subtitle } from '@/components/ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useLogStore } from '@/store/useLogStore';
import { useProfileStore } from '@/store/useProfileStore';
import { useSettingsStore } from '@/store/useSettingsStore';
import type { Units } from '@/lib/units';

function confirm(message: string, onYes: () => void) {
  if (Platform.OS === 'web') {
    // eslint-disable-next-line no-alert
    if (typeof window !== 'undefined' && window.confirm(message)) onYes();
    return;
  }
  Alert.alert('Are you sure?', message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Confirm', style: 'destructive', onPress: onYes },
  ]);
}

export default function Settings() {
  const router = useRouter();
  const units = useSettingsStore((s) => s.units);
  const setUnits = useSettingsStore((s) => s.setUnits);
  const coachApiUrl = useSettingsStore((s) => s.coachApiUrl);
  const setCoachApiUrl = useSettingsStore((s) => s.setCoachApiUrl);

  const [showExport, setShowExport] = useState(false);

  const exportJson = () =>
    JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        profiles: useProfileStore.getState().profiles,
        activeId: useProfileStore.getState().activeId,
        logs: useLogStore.getState().logs,
        settings: { units, coachApiUrl },
      },
      null,
      2,
    );

  const shareData = async () => {
    try {
      await Share.share({ message: exportJson() });
    } catch {
      setShowExport(true); // fall back to on-screen copyable text
    }
  };

  const wipe = () =>
    confirm('This permanently deletes all profiles, plans and logs on this device.', () => {
      useProfileStore.getState().reset();
      useLogStore.setState({ logs: {} });
      router.replace('/onboarding/basics');
    });

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <Stack.Screen options={{ title: 'Settings', headerShown: true }} />

      <View style={{ gap: spacing.sm }}>
        <Label>Units</Label>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['kg', 'lb'] as Units[]).map((u) => (
            <View key={u} style={{ flex: 1 }}>
              <OptionCard title={u.toUpperCase()} selected={units === u} onPress={() => setUnits(u)} />
            </View>
          ))}
        </View>
        <Subtitle>Weights are stored in kg and shown in your chosen unit.</Subtitle>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label>Coach backend URL</Label>
        <Field
          value={coachApiUrl}
          onChangeText={setCoachApiUrl}
          placeholder="https://your-coach-proxy.example.com"
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Subtitle>Override the default coach proxy. Leave blank to use the app default; empty falls back to offline cues.</Subtitle>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Label>Data</Label>
        <Pressable style={styles.btn} onPress={shareData}>
          <Text style={styles.btnText}>Export data (JSON)</Text>
        </Pressable>
        {showExport ? (
          <Field value={exportJson()} editable={false} multiline numberOfLines={8} style={styles.export} />
        ) : null}
        <Pressable style={[styles.btn, styles.danger]} onPress={wipe}>
          <Text style={[styles.btnText, { color: colors.accent }]}>Wipe all data</Text>
        </Pressable>
      </View>

      <Subtitle>Theme switching (light mode) is coming in a future update.</Subtitle>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btn: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnText: { color: colors.text, fontWeight: '700' },
  danger: { borderColor: colors.accent },
  export: { minHeight: 160, fontSize: 11, textAlignVertical: 'top' },
});
