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
import { getCoach } from '@/coaching';
import { radius, shadow, spacing, type Palette } from '@/constants/theme';
import {
  athleteSummary,
  chatSystemPrompt,
  type ChatMessage,
} from '@/engine/coaching';
import { summarizeTraining } from '@/lib/trainingSummary';
import { flattenDays } from '@/lib/days';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import { useActiveProfile } from '@/store/useProfileStore';
import { useLogStore } from '@/store/useLogStore';

const PLACEHOLDER_PROMPTS = [
  'Why is my bench stalling?',
  'How should I manage fatigue this week?',
  'What can I do to improve my squat depth?',
  'Am I recovering well enough to push harder?',
];

export default function CoachChat() {
  const router = useRouter();
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const active = useActiveProfile();
  const profileId = active?.id ?? '';
  const logsForProfile = useLogStore((s) => s.logsForProfile);

  // Build the system prompt once per screen open
  const systemPrompt = useMemo(() => {
    if (!active) return '';
    const profileLine = athleteSummary(active.profile, active.config?.type);
    const days = flattenDays(active.program);
    const currentDay = days.find((_, i) => !active.completed?.[i]);
    const cycleLine = currentDay
      ? `Current phase: ${currentDay.phase}, week ${currentDay.weekOfBlock}/${currentDay.weeksInBlock}.`
      : undefined;
    const logs = logsForProfile(profileId);
    const trainingSummary = summarizeTraining(logs);
    return chatSystemPrompt({ profileLine, cycleLine, trainingSummary });
  }, [active, profileId, logsForProfile]);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  // Auto-scroll to bottom when new messages arrive
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
          {
            role: 'assistant',
            content:
              "I couldn't reach the coach right now. Check your connection or configure the coach URL in Settings.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, systemPrompt],
  );

  if (!active) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg, padding: spacing.lg }}>
        <Text style={{ color: c.text }}>Complete onboarding to unlock coach chat.</Text>
      </SafeAreaView>
    );
  }

  const isEmpty = messages.length === 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Coach</Text>
            <Text style={styles.headerSub} numberOfLines={1}>
              {active.profile.basics?.name ?? 'Athlete'} · {active.config?.type ?? 'program'}
            </Text>
          </View>
          <View style={styles.statusDot} />
        </View>

        {/* Messages */}
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
                Your recent training data is already loaded — ask about stalls, fatigue, nutrition or technique.
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
                {msg.role === 'assistant' && (
                  <Text style={styles.bubbleLabel}>COACH</Text>
                )}
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

        {/* Input */}
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
    backBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    backText: { color: c.accent, fontSize: 28, lineHeight: 30 },
    headerTitle: { color: c.text, fontWeight: '800', fontSize: 16 },
    headerSub: { color: c.textMuted, fontSize: 12, marginTop: 1 },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: c.success,
    },
    msgList: { padding: spacing.md, gap: spacing.sm },
    msgListEmpty: { flex: 1 },
    emptyState: { flex: 1, justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.xl },
    emptyTitle: { color: c.text, fontSize: 20, fontWeight: '800', textAlign: 'center' },
    emptySub: {
      color: c.textMuted,
      fontSize: 14,
      lineHeight: 20,
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
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
