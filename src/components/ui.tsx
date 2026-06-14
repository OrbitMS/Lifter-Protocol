import { ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, shadow, spacing, typography } from '@/constants/theme';

export function Screen({ children }: { children: ReactNode }) {
  return <View style={styles.screen}>{children}</View>;
}

export function Title({ children }: { children: ReactNode }) {
  return <Text style={styles.title}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  return <Text style={styles.subtitle}>{children}</Text>;
}

export function Label({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

/** Brand wordmark — "LIFTER" in foreground, "PROTOCOL" in the sky-blue accent. */
export function Wordmark({ size = 20 }: { size?: number }) {
  return (
    <Text style={[styles.wordmark, { fontSize: size }]}>
      LIFTER<Text style={styles.wordmarkAccent}> PROTOCOL</Text>
    </Text>
  );
}

type BadgeTone = 'neutral' | 'accent' | 'success' | 'warn';

/** Pill status badge matching the design language (neutral / accent / success / warn). */
export function Badge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
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
  return (
    <Pressable
      onPress={onPress}
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
  return (
    <Pressable
      onPress={onPress}
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
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      placeholderTextColor={colors.textFaint}
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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  title: { ...typography.title },
  subtitle: { ...typography.subtitle },
  label: { ...typography.label, marginBottom: spacing.xs },
  labelInline: { ...typography.label },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  helpDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpDotOpen: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  helpMark: { color: colors.textMuted, fontSize: 12, fontWeight: '800', lineHeight: 14 },
  helpMarkOpen: { color: colors.accent },
  helpBox: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  helpText: { color: colors.textMuted, fontSize: 13, lineHeight: 19 },
  progressTrack: {
    height: 8,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: colors.accent, borderRadius: radius.pill },
  wordmark: { color: colors.text, fontWeight: '900', letterSpacing: 0.5 },
  wordmarkAccent: { color: colors.accent },
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
  badge_neutral: { backgroundColor: colors.surfaceAlt, borderColor: colors.border },
  badge_accent: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  badge_success: { backgroundColor: colors.successSoft, borderColor: colors.success },
  badge_warn: { backgroundColor: '#3A2A0F80', borderColor: colors.warning },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dot_neutral: { backgroundColor: colors.textMuted },
  dot_accent: { backgroundColor: colors.accent },
  dot_success: { backgroundColor: colors.success },
  dot_warn: { backgroundColor: colors.warning },
  badgeText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, textTransform: 'uppercase' },
  badgeText_neutral: { color: colors.textMuted },
  badgeText_accent: { color: colors.accent },
  badgeText_success: { color: colors.success },
  badgeText_warn: { color: colors.warning },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonPressed: { backgroundColor: colors.accentBright, transform: [{ scale: 0.985 }] },
  buttonDisabled: { backgroundColor: colors.surfaceAlt },
  buttonText: { color: colors.onAccent, fontSize: 16, fontWeight: '800', letterSpacing: 0.2 },
  buttonTextDisabled: { color: colors.textFaint },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  cardPressed: { backgroundColor: colors.surfaceHover, borderColor: colors.borderStrong },
  cardSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700', flexShrink: 1 },
  cardDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkMark: { color: colors.onAccent, fontSize: 13, fontWeight: '900', lineHeight: 15 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
  inputFocused: { borderColor: colors.accent, backgroundColor: colors.bgElevated },
});
