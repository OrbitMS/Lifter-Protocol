import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getCoach, initCoach } from '@/coaching';
import { radius, shadow, spacing, type Palette } from '@/constants/theme';
import { athleteSummary, chatSystemPrompt, type ChatMessage } from '@/engine/coaching';
import { summarizeTraining } from '@/lib/trainingSummary';
import { flattenDays } from '@/lib/days';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import {
  createModelDownload,
  isModelDownloaded,
  MODEL_SIZE_MB,
  type DownloadProgress,
} from '@/lib/modelManager';
import { useActiveProfile } from '@/store/useProfileStore';
import { useLogStore } from '@/store/useLogStore';

const PLACEHOLDER_PROMPTS = [
  'Why is my bench stalling?',
  'How should I manage fatigue this week?',
  'What can I do to improve my squat depth?',
  'Am I recovering well enough to push harder?',
];

type ScreenState = 'checking' | 'needs-download' | 'downloading' | 'ready';

export default function CoachChat() {
  const router = useRouter();
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const active = useActiveProfile();
  const profileId = active?.id ?? '';
  const logsForProfile = useLogStore((s) => s.logsForProfile);

  const [screen, setScreen] = useState<ScreenState>('checking');
  const [dlProgress, setDlProgress] = useState<DownloadProgress>({ bytesDownloaded: 0, bytesTotal: 0, fraction: 0 });
  const downloadRef = useRef<ReturnType<typeof createModelDownload> | null>(null);

  // Check model presence on mount
  useEffect(() => {
    isModelDownloaded().then((ready) => setScreen(ready ? 'ready' : 'needs-download'));
  }, []);

  const startDownload = useCallback(async () => {
    setScreen('downloading');
    const dl = createModelDownload(setDlProgress);
    downloadRef.current = dl;
    try {
      await dl.downloadAsync();
      await initCoach(); // re-activate coach now that model is on disk
      setScreen('ready');
    } catch {
      setScreen('needs-download');
    }
  }, []);

  const cancelDownload = useCallback(() => {
    downloadRef.current?.pauseAsync();
    setScreen('needs-download');
  }, []);

  // Build the system prompt once the chat is ready
  const systemPrompt = useMemo(() => {
    if (!active || screen !== 'ready') return '';
    const profileLine = athleteSummary(active.profile, active.config?.type);
    const days = flattenDays(active.program);
    const currentDay = days.find((_, i) => !active.completed?.[i]);
    const cycleLine = currentDay
      ? `Current phase: ${currentDay.phase}, week ${currentDay.weekOfBlock}/${currentDay.weeksInBlock}.`
      : undefined;
    const logs = logsForProfile(profileId);
    const trainingSummary = summarizeTraining(logs);
    return chatSystemPrompt({ profileLine, cycleLine, trainingSummary });
  }, [active, profileId, logsForProfile, screen]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, loading]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || !systemPrompt) return;

      const userMsg: ChatMessage = { role: 'user', content: trimmed };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput('');
      setLoading(true);

      try {
        const reply = await getCoach().chat(systemPrompt, next);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Something went wrong. The model may still be loading — try again in a moment.' },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, systemPrompt],
  );

  // ── Shared header ────────────────────────────────────────────────────────────
  const header = (
    <View style={styles.header}>
      <Pressable onPress={() => router.back()} style={styles.backBtn}>
        <Text style={styles.backText}>‹</Text>
      </Pressable>
      <View style={{ flex: 1 }}>
        <Text style={styles.headerTitle}>Coach</Text>
        {active && (
          <Text style={styles.headerSub} numberOfLines={1}>
            {active.profile.basics?.name ?? 'Athlete'} · {active.config?.type ?? 'program'}
          </Text>
        )}
      </View>
      <View style={[styles.statusDot, screen !== 'ready' && styles.statusDotOff]} />
    </View>
  );

  // ── No profile ───────────────────────────────────────────────────────────────
  if (!active) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
        {header}
        <View style={styles.centred}>
          <Text style={styles.emptyTitle}>No profile yet</Text>
          <Text style={styles.emptySub}>Complete onboarding to unlock coach chat.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Checking ─────────────────────────────────────────────────────────────────
  if (screen === 'checking') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
        {header}
        <View style={styles.centred}>
          <ActivityIndicator color={c.accent} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Download needed ───────────────────────────────────────────────────────────
  if (screen === 'needs-download') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
        {header}
        <View style={styles.centred}>
          <Text style={styles.emptyTitle}>Download AI model</Text>
          <Text style={styles.emptySub}>
            The coach runs 100% on your device — no cloud, no API key. A one-time download is required (~{MODEL_SIZE_MB} MB, use Wi-Fi).
          </Text>
          <Pressable style={styles.downloadBtn} onPress={startDownload}>
            <Text style={styles.downloadBtnText}>Download now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Downloading ──────────────────────────────────────────────────────────────
  if (screen === 'downloading') {
    const pct = Math.round(dlProgress.fraction * 100);
    const mb = (dlProgress.bytesDownloaded / 1_000_000).toFixed(0);
    const total = dlProgress.bytesTotal > 0
      ? (dlProgress.bytesTotal / 1_000_000).toFixed(0)
      : MODEL_SIZE_MB.toString();

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
        {header}
        <View style={styles.centred}>
          <Text style={styles.emptyTitle}>Downloading model…</Text>
          <Text style={styles.emptySub}>{mb} / {total} MB · {pct}%</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${pct}%` }]} />
          </View>
          <Pressable onPress={cancelDownload} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ── Chat ready ────────────────────────────────────────────────────────────────
  const isEmpty = messages.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {header}

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={[styles.msgList, isEmpty && styles.msgListEmpty]}
          keyboardShouldPersistTaps="handled"
        >
          {isEmpty ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Ask your coach anything</Text>
              <Text style={styles.emptySub}>
                Your recent training data is loaded — ask about stalls, fatigue, nutrition or technique.
              </Text>
              <View style={styles.suggestions}>
                {PLACEHOLDER_PROMPTS.map((p) => (
                  <Pressable key={p} style={styles.chip} onPress={() => send(p)}>
                    <Text style={styles.chipText}>{p}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          ) : (
            messages.map((msg, i) => (
              <View
                key={i}
                style={[styles.bubble, msg.role === 'user' ? styles.bubbleUser : styles.bubbleCoach]}
              >
                {msg.role === 'assistant' && <Text style={styles.bubbleLabel}>COACH</Text>}
                <Text style={msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextCoach}>
                  {msg.content}
                </Text>
              </View>
            ))
          )}

          {loading && (
            <View style={[styles.bubble, styles.bubbleCoach, styles.loadingBubble]}>
              <Text style={styles.bubbleLabel}>COACH</Text>
              <ActivityIndicator size="small" color={c.accent} style={{ marginTop: 4 }} />
            </View>
          )}
        </ScrollView>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask your coach…"
            placeholderTextColor={c.textMuted}
            multiline
            maxLength={500}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
            blurOnSubmit
          />
          <Pressable
            style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnOff]}
            onPress={() => send(input)}
            disabled={!input.trim() || loading}
          >
            <Text style={styles.sendText}>↑</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
    backText: { color: c.accent, fontSize: 28, lineHeight: 30 },
    headerTitle: { color: c.text, fontWeight: '800', fontSize: 16 },
    headerSub: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.success },
    statusDotOff: { backgroundColor: c.border },
    centred: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.md,
    },
    emptyTitle: { color: c.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
    emptySub: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      maxWidth: 300,
    },
    downloadBtn: {
      backgroundColor: c.accent,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xl,
      marginTop: spacing.sm,
      ...shadow.glow,
    },
    downloadBtnText: { color: c.onAccent, fontWeight: '800', fontSize: 16 },
    progressTrack: {
      width: '100%',
      height: 6,
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      overflow: 'hidden',
      marginTop: spacing.sm,
    },
    progressFill: { height: '100%', backgroundColor: c.accent, borderRadius: radius.pill },
    cancelBtn: { marginTop: spacing.sm, padding: spacing.sm },
    cancelText: { color: c.textMuted, fontSize: 14 },
    msgList: { padding: spacing.md, gap: spacing.sm },
    msgListEmpty: { flex: 1 },
    emptyState: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xl },
    suggestions: { gap: spacing.sm, marginTop: spacing.sm },
    chip: {
      backgroundColor: c.surface,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      alignSelf: 'flex-start',
    },
    chipText: { color: c.textMuted, fontSize: 14 },
    bubble: {
      maxWidth: '80%',
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.xs,
    },
    bubbleUser: {
      backgroundColor: c.accent,
      alignSelf: 'flex-end',
      borderBottomRightRadius: radius.sm,
      ...shadow.card,
    },
    bubbleCoach: {
      backgroundColor: c.surface,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: c.border,
      borderBottomLeftRadius: radius.sm,
    },
    loadingBubble: { paddingVertical: spacing.md },
    bubbleLabel: { color: c.accent, fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 4 },
    bubbleTextUser: { color: c.onAccent, lineHeight: 20 },
    bubbleTextCoach: { color: c.text, lineHeight: 20 },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
      padding: spacing.md,
      borderTopWidth: 1,
      borderColor: c.border,
      backgroundColor: c.bg,
    },
    input: {
      flex: 1,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
      color: c.text,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 15,
      maxHeight: 120,
    },
    sendBtn: {
      width: 44,
      height: 44,
      borderRadius: radius.pill,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.glow,
    },
    sendBtnOff: { opacity: 0.4 },
    sendText: { color: c.onAccent, fontSize: 20, fontWeight: '800' },
  });
