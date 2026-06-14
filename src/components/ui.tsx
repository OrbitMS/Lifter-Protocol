import { ReactNode, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { colors, radius, spacing } from '@/constants/theme';

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
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${(step / total) * 100}%` }]} />
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
      style={[styles.button, disabled && styles.buttonDisabled]}
    >
      <Text style={styles.buttonText}>{label}</Text>
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
      style={[styles.card, selected && styles.cardSelected]}
    >
      <Text style={styles.cardTitle}>{title}</Text>
      {description ? <Text style={styles.cardDesc}>{description}</Text> : null}
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.textMuted}
      style={styles.input}
      {...props}
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
  title: { color: colors.text, fontSize: 26, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 15, lineHeight: 21 },
  label: { color: colors.text, fontSize: 14, fontWeight: '600', marginBottom: spacing.xs },
  labelInline: { color: colors.text, fontSize: 14, fontWeight: '600' },
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
    height: 6,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.sm,
    overflow: 'hidden',
  },
  progressFill: { height: 6, backgroundColor: colors.accent },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: 'auto',
  },
  buttonDisabled: { backgroundColor: colors.surfaceAlt },
  buttonText: { color: colors.text, fontSize: 16, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
  cardSelected: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '700' },
  cardDesc: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    fontSize: 16,
  },
});
