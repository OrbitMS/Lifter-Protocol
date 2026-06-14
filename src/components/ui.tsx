import { ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import * as haptics from '@/lib/haptics';
import { useTheme, useThemedStyles } from '@/lib/useTheme';
import { radius, shadow, spacing, typography, type Palette } from '@/constants/theme';

export function Screen({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return <View style={styles.screen}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  const styles = useThemedStyles(makeStyles);
  return <Text style={styles.label}>{children}</Text>;
}

/** Brand wordmark — "LIFTER" in foreground, "PROTOCOL" in the accent. */
export function Wordmark({ size = 20 }: { size?: number }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Text style={[styles.wordmark, { fontSize: size }]}>
      LIFTER<Text style={styles.wordmarkAccent}> PROTOCOL</Text>
    </Text>
  );
}

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warn';

/** Pill status badge matching the design language (neutral / accent / success / warn). */
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={[styles.badge, styles[`badge_${tone}`]]}>
      {tone !== 'neutral' ? <View style={[styles.dot, styles[`dot_${tone}`]]} /> : null}
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{label}</Text>
    </View>
  );
}

/**
 * A question label with a tappable "?" that expands a short explanation of how
 * the athlete's answer affects their training plan.
 */
export function InfoLabel({ children, help }: { children: ReactNode; help: string }) {
  const styles = useThemedStyles(makeStyles);
  const [open, setOpen] = useState(false);
  return (
    <View style={{ gap: spacing.xs }}>
      <View style={styles.infoRow}>
        <Text style={styles.labelInline}>{children}</Text>
        <Pressable
          onPress={() => setOpen((o) => !o)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Why this matters"
          style={[styles.helpDot, open && styles.helpDotOpen]}
        >
          <Text style={[styles.helpMark, open && styles.helpMarkOpen]}>?</Text>
        </Pressable>
      </View>
      {open ? (
        <View style={styles.helpBox}>
          <Text style={styles.helpText}>{help}</Text>
        </View>
      ) : null}
    </View>
  );
}

export function ProgressBar({ step, total }: { step: number; total: number }) {
  const styles = useThemedStyles(makeStyles);
  const pct = Math.max(0, Math.min(1, total ? step / total : 0)) * 100;
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${pct}%` }]} />
    </View>
  );
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={() => {
        haptics.tap();
        onPress();
      }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        !disabled && shadow.glow,
        pressed && !disabled && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}
    >
      <Text style={[styles.buttonText, disabled && styles.buttonTextDisabled]}>{label}</Text>
    </Pressable>
  );
}

export function OptionCard({
  title,
  description,
  selected,
  onPress,
}: {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={() => {
        haptics.select();
        onPress();
      }}
      style={({ pressed }) => [
        styles.card,
        shadow.card,
        selected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
    >
      <View style={styles.cardHead}>
        <Text style={styles.cardTitle}>{title}</Text>
        {selected ? (
          <View style={styles.check}>
            <Text style={styles.checkMark}>✓</Text>
          </View>
        ) : null}
      </View>
      {description ? <Text style={styles.cardDesc}>{description}</Text> : null}
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  const styles = useThemedStyles(makeStyles);
  const { palette: c } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={c.textFaint}
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      style={[styles.input, focused && styles.inputFocused, props.style]}
    />
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.bg,
      padding: spacing.lg,
      gap: spacing.md,
    },
    title: { ...typography.title, color: c.text },
    subtitle: { ...typography.subtitle, color: c.textMuted },
    label: { ...typography.label, color: c.text, marginBottom: spacing.xs },
    labelInline: { ...typography.label, color: c.text },
    infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    helpDot: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: c.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    helpDotOpen: { borderColor: c.accent, backgroundColor: c.accentSoft },
    helpMark: { color: c.textMuted, fontSize: 12, fontWeight: '800', lineHeight: 14 },
    helpMarkOpen: { color: c.accent },
    helpBox: {
      backgroundColor: c.surfaceAlt,
      borderRadius: radius.sm,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    helpText: { color: c.textMuted, fontSize: 13, lineHeight: 19 },
    progressTrack: {
      height: 8,
      backgroundColor: c.surfaceAlt,
      borderRadius: radius.pill,
      overflow: 'hidden',
    },
    progressFill: { height: 8, backgroundColor: c.accent, borderRadius: radius.pill },
    wordmark: { color: c.text, fontWeight: '900', letterSpacing: 0.5 },
    wordmarkAccent: { color: c.accent },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    badge_neutral: { backgroundColor: c.surfaceAlt, borderColor: c.border },
    badge_accent: { backgroundColor: c.accentSoft, borderColor: c.accentBorder },
    badge_success: { backgroundColor: c.successSoft, borderColor: c.success },
    badge_warn: { backgroundColor: c.warning + '22', borderColor: c.warning },
    dot: { width: 6, height: 6, borderRadius: 3 },
    dot_neutral: { backgroundColor: c.textMuted },
    dot_accent: { backgroundColor: c.accent },
    dot_success: { backgroundColor: c.success },
    dot_warn: { backgroundColor: c.warning },
    badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
    badgeText_neutral: { color: c.textMuted },
    badgeText_accent: { color: c.accent },
    badgeText_success: { color: c.success },
    badgeText_warn: { color: c.warning },
    button: {
      backgroundColor: c.accent,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      alignItems: 'center',
      marginTop: 'auto',
    },
    buttonPressed: { backgroundColor: c.accentBright, transform: [{ scale: 0.985 }] },
    buttonDisabled: { backgroundColor: c.surfaceAlt },
    buttonText: { color: c.onAccent, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
    buttonTextDisabled: { color: c.textFaint },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      gap: spacing.xs,
    },
    cardPressed: { backgroundColor: c.surfaceHover, borderColor: c.borderStrong },
    cardSelected: { borderColor: c.accent, backgroundColor: c.accentSoft },
    cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
    cardTitle: { color: c.text, fontSize: 17, fontWeight: '700', flexShrink: 1 },
    cardDesc: { color: c.textMuted, fontSize: 13, lineHeight: 18 },
    check: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkMark: { color: c.onAccent, fontSize: 13, fontWeight: '900', lineHeight: 15 },
    input: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.md,
      color: c.text,
      fontSize: 16,
    },
    inputFocused: { borderColor: c.accent, backgroundColor: c.bgElevated },
  });
