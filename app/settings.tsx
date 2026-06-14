import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { Field, Label, OptionCard, Subtitle } from '@/components/ui';
import { useTheme, useThemedStyles, useThemeStore, type ThemeMode } from '@/lib/useTheme';
import { radius, spacing, type Palette } from '@/constants/theme';
import { coachIsOnline } from '@/coaching';
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
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);
  const router = useRouter();
  const units = useSettingsStore((s) => s.units);
  const setUnits = useSettingsStore((s) => s.setUnits);
  const coachApiUrl = useSettingsStore((s) => s.coachApiUrl);
  const setCoachApiUrl = useSettingsStore((s) => s.setCoachApiUrl);
  const coachOnline = coachIsOnline();

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
    <ScrollView style={{ backgroundColor: c.bg }} contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
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
        <Label>Appearance</Label>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          {(['system', 'light', 'dark'] as ThemeMode[]).map((m) => (
            <View key={m} style={{ flex: 1 }}>
              <OptionCard
                title={m[0].toUpperCase() + m.slice(1)}
                selected={themeMode === m}
                onPress={() => setThemeMode(m)}
              />
            </View>
          ))}
        </View>
        <Subtitle>Match your device appearance, or force light / dark.</Subtitle>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={[styles.statusDot, { backgroundColor: coachOnline ? c.success : c.textMuted }]} />
          <Subtitle>{coachOnline ? 'AI coach connected' : 'Offline — using built-in cues'}</Subtitle>
        </View>
        <Subtitle>Override the coach proxy URL. Leave blank to use the app default. A localhost URL only works while developing — shipped builds fall back to offline cues.</Subtitle>
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
          <Text style={[styles.btnText, { color: c.danger }]}>Wipe all data</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

const makeStyles = (c: Palette) => StyleSheet.create({
  btn: {
    backgroundColor: c.surface,
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnText: { color: c.text, fontWeight: '700' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  danger: { borderColor: c.danger },
  export: { minHeight: 160, fontSize: 11, textAlignVertical: 'top' },
});
