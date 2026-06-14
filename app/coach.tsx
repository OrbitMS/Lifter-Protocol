import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { summarizeTraining, summarizeTechnique } from '@/lib/trainingSummary';
import {
  dbGetLatestCheckin,
  dbGetRecentTechnique,
  dbUpsertCheckin,
  type DailyCheckin,
} from '@/lib/db';
import { flattenDays } from '@/lib/days';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import {
  createModelDownload,
  isModelDownloaded,
  MODEL_SIZE_MB,
  type DownloadProgress,
} from '@/lib/modelManager';
import {
  detectExercise,
  exercisesInProgram,
  formatCheckin,
  formatRecentSessions,
} from '@/lib/ragUtils';
import { useActiveProfile } from '@/store/useProfileStore';
import { useLogStore } from '@/store/useLogStore';
import { useSettingsStore } from '@/store/useSettingsStore';

const PLACEHOLDER_PROMPTS = [
  'Why is my bench stalling?',
  'How should I manage fatigue this week?',
  'What can I do to improve my squat depth?',
  'Am I recovering well enough to push harder?',
];

const SLEEP_OPTIONS = [5, 6, 7, 8, 9] as const;
const SORENESS_LABELS = ['', '1 — fine', '2 — mild', '3 — moderate', '4 — heavy', '5 — very sore'];

type ScreenState = 'checking' | 'needs-download' | 'downloading' | 'ready';

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function CoachChat() {
  const router = useRouter();
  const { palette: c } = useTheme();
  const styles = useThemedStyles(makeStyles);

  const active = useActiveProfile();
  const profileId = active?.id ?? '';
  const logsForProfile = useLogStore((s) => s.logsForProfile);
  const units = useSettingsStore((s) => s.units);

  // ── Model download gate ───────────────────────────────────────────────────────
  const [screen, setScreen] = useState<ScreenState>('checking');
  const [dlProgress, setDlProgress] = useState<DownloadProgress>({
    bytesDownloaded: 0,
    bytesTotal: 0,
    fraction: 0,
  });
  const downloadRef = useRef<ReturnType<typeof createModelDownload> | null>(null);

  useEffect(() => {
    isModelDownloaded().then((ready) => setScreen(ready ? 'ready' : 'needs-download'));
  }, []);

  const startDownload = useCallback(async () => {
    setScreen('downloading');
    const dl = createModelDownload(setDlProgress);
    downloadRef.current = dl;
    try {
      await dl.downloadAsync();
      await initCoach();
      setScreen('ready');
    } catch {
      setScreen('needs-download');
    }
  }, []);

  const cancelDownload = useCallback(() => {
    downloadRef.current?.pauseAsync();
    setScreen('needs-download');
  }, []);

  // ── Static system prompt (built once per session/profile) ────────────────────
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
    const recentTechnique = dbGetRecentTechnique(profileId, 5);
    const techniqueSummary = summarizeTechnique(recentTechnique);
    return chatSystemPrompt({ profileLine, cycleLine, trainingSummary, techniqueSummary });
  }, [active, profileId, logsForProfile, screen]);

  // ── Exercise names from program — used for per-message RAG detection ──────────
  const knownExercises = useMemo(
    () => exercisesInProgram(active?.program),
    [active?.program],
  );

  // ── Daily check-in state ──────────────────────────────────────────────────────
  const [checkin, setCheckin] = useState<DailyCheckin | null>(null);
  const [ciExpanded, setCiExpanded] = useState(false);
  const [ciSleep, setCiSleep] = useState<number | null>(null);
  const [ciSoreness, setCiSoreness] = useState<number | null>(null);

  useEffect(() => {
    if (screen === 'ready' && profileId) setCheckin(dbGetLatestCheckin(profileId));
  }, [screen, profileId]);

  const openCheckin = useCallback(() => {
    // Pre-fill if today's check-in exists
    if (checkin && checkin.date === todayISO()) {
      setCiSleep(checkin.sleep_hours);
      setCiSoreness(checkin.soreness);
    } else {
      setCiSleep(null);
      setCiSoreness(null);
    }
    setCiExpanded(true);
  }, [checkin]);

  const saveCheckin = useCallback(() => {
    if (ciSleep === null || ciSoreness === null || !profileId) return;
    const today = todayISO();
    const row: DailyCheckin = {
      id: `ci-${profileId}-${today}`,
      profile_id: profileId,
      date: today,
      sleep_hours: ciSleep,
      soreness: ciSoreness,
    };
    dbUpsertCheckin(row);
    setCheckin(row);
    setCiExpanded(false);
  }, [ciSleep, ciSoreness, profileId]);

  // ── Chat state ────────────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, loading]);

  // ── Send — enriches system prompt per-message with RAG context ─────────────
  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || !systemPrompt) return;

      // 1. Exercise RAG: detect which lift the user is asking about, pull last 3 sessions
      let enriched = systemPrompt;
      const detected = detectExercise(trimmed, knownExercises);
      if (detected) {
        const entries = useLogStore.getState().recentEntriesFor(profileId, detected, 3);
        if (entries.length > 0) {
          enriched +=
            `\n\nFOCUSED CONTEXT — user is asking about ${detected}:\n` +
            formatRecentSessions(entries, detected, units);
        }
      }

      // 2. Check-in context: inject if available (today's or most recent)
      if (checkin) {
        enriched += '\n' + formatCheckin({
          sleepHours: checkin.sleep_hours,
          soreness: checkin.soreness,
          date: checkin.date,
        });
      }

      const userMsg: ChatMessage = { role: 'user', content: trimmed };
      const next = [...messages, userMsg];
      setMessages(next);
      setInput('');
      setLoading(true);

      try {
        const reply = await getCoach().chat(enriched, next);
        setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content:
              'Something went wrong. The model may still be loading — try again in a moment.',
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, messages, systemPrompt, profileId, knownExercises, units, checkin],
  );

  // ── Shared header ─────────────────────────────────────────────────────────────
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

  // ── Check-in bar (shown between header and chat when model is ready) ──────────
  const ciIsToday = checkin?.date === todayISO();
  const checkinBar = screen === 'ready' && (
    <View style={styles.ciBar}>
      {!ciExpanded ? (
        <Pressable onPress={openCheckin} style={styles.ciCollapsed}>
          {ciIsToday && checkin ? (
            <>
              <Text style={styles.ciStatus}>
                💤 {checkin.sleep_hours}h sleep · 💪 {checkin.soreness}/5 soreness
              </Text>
              <Text style={styles.ciUpdate}>Update</Text>
            </>
          ) : (
            <Text style={styles.ciPrompt}>Log how you feel today › (feeds the coach)</Text>
          )}
        </Pressable>
      ) : (
        <View style={styles.ciForm}>
          <Text style={styles.ciFormLabel}>Hours of sleep</Text>
          <View style={styles.ciRow}>
            {SLEEP_OPTIONS.map((h) => (
              <Pressable
                key={h}
                style={[styles.ciChip, ciSleep === h && styles.ciChipOn]}
                onPress={() => setCiSleep(h)}
              >
                <Text style={[styles.ciChipText, ciSleep === h && styles.ciChipTextOn]}>
                  {h === 9 ? '9+' : `${h}`}h
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={styles.ciFormLabel}>Soreness / fatigue</Text>
          <View style={styles.ciRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Pressable
                key={s}
                style={[styles.ciChip, styles.ciChipWide, ciSoreness === s && styles.ciChipOn]}
                onPress={() => setCiSoreness(s)}
              >
                <Text style={[styles.ciChipText, ciSoreness === s && styles.ciChipTextOn]}>
                  {SORENESS_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.ciActions}>
            <Pressable onPress={() => setCiExpanded(false)}>
              <Text style={styles.ciCancel}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[
                styles.ciSaveBtn,
                (ciSleep === null || ciSoreness === null) && styles.ciSaveBtnOff,
              ]}
              onPress={saveCheckin}
              disabled={ciSleep === null || ciSoreness === null}
            >
              <Text style={styles.ciSaveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  // ── Gate screens ──────────────────────────────────────────────────────────────
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

  if (screen === 'needs-download') {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
        {header}
        <View style={styles.centred}>
          <Text style={styles.emptyTitle}>Download AI model</Text>
          <Text style={styles.emptySub}>
            The coach runs 100% on your device — no cloud, no API key. A one-time download is
            required (~{MODEL_SIZE_MB} MB, use Wi-Fi).
          </Text>
          <Pressable style={styles.downloadBtn} onPress={startDownload}>
            <Text style={styles.downloadBtnText}>Download now</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (screen === 'downloading') {
    const pct = Math.round(dlProgress.fraction * 100);
    const mb = (dlProgress.bytesDownloaded / 1_000_000).toFixed(0);
    const total =
      dlProgress.bytesTotal > 0
        ? (dlProgress.bytesTotal / 1_000_000).toFixed(0)
        : MODEL_SIZE_MB.toString();
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: c.bg }} edges={['bottom']}>
        {header}
        <View style={styles.centred}>
          <Text style={styles.emptyTitle}>Downloading model…</Text>
          <Text style={styles.emptySub}>
            {mb} / {total} MB · {pct}%
          </Text>
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding" keyboardVerticalOffset={8}>
        {header}
        {checkinBar}

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
                Your recent training data is loaded — ask about stalls, fatigue, nutrition or
                technique.
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
                style={[
                  styles.bubble,
                  msg.role === 'user' ? styles.bubbleUser : styles.bubbleCoach,
                ]}
              >
                {msg.role === 'assistant' && <Text style={styles.bubbleLabel}>COACH</Text>}
                <Text
                  style={msg.role === 'user' ? styles.bubbleTextUser : styles.bubbleTextCoach}
                >
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
    // ── Layout ──────────────────────────────────────────────────────────────────
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

    // ── Check-in bar ────────────────────────────────────────────────────────────
    ciBar: {
      borderBottomWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    ciCollapsed: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    ciStatus: { color: c.text, fontSize: 13 },
    ciUpdate: { color: c.accent, fontSize: 13, fontWeight: '700' },
    ciPrompt: { color: c.textMuted, fontSize: 13 },
    ciForm: { padding: spacing.md, gap: spacing.sm },
    ciFormLabel: {
      color: c.textMuted,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: 2,
    },
    ciRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    ciChip: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.sm,
      paddingVertical: 5,
      paddingHorizontal: spacing.sm,
    },
    ciChipWide: { paddingHorizontal: spacing.xs },
    ciChipOn: { borderColor: c.accent, backgroundColor: c.accentSoft },
    ciChipText: { color: c.textMuted, fontSize: 13 },
    ciChipTextOn: { color: c.accent, fontWeight: '700' },
    ciActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.xs,
    },
    ciCancel: { color: c.textMuted, fontSize: 14 },
    ciSaveBtn: {
      backgroundColor: c.accent,
      borderRadius: radius.pill,
      paddingVertical: 6,
      paddingHorizontal: spacing.md,
    },
    ciSaveBtnOff: { opacity: 0.4 },
    ciSaveText: { color: c.onAccent, fontWeight: '800', fontSize: 14 },

    // ── Gate screens ────────────────────────────────────────────────────────────
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

    // ── Chat ────────────────────────────────────────────────────────────────────
    msgList: { padding: spacing.md, gap: spacing.sm },
    msgListEmpty: { flex: 1 },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      gap: spacing.md,
      paddingVertical: spacing.xl,
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
    bubbleLabel: {
      color: c.accent,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 1,
      marginBottom: 4,
    },
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
