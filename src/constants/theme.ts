// Shared design tokens — "Lifter Protocol" brand system.
//
// Dark mode is the active theme: charcoal/slate surfaces with an Electric Sky
// Blue primary accent and an Energetic Green for success / active states.
// Existing token names are preserved so every screen keeps working.
//
// `lightColors` mirrors the brand's light palette (off-white + Cobalt Blue +
// Warm Orange). It is scaffolding for a future light/dark toggle and is not
// wired up yet — the app currently runs dark-only.

import { Platform, TextStyle, ViewStyle } from 'react-native';

export const colors = {
  // Backgrounds — charcoal with layered slate elevation.
  bg: '#101317',
  bgElevated: '#161A20',
  surface: '#1C2128',
  surfaceAlt: '#252B34',
  surfaceHover: '#2E353F',

  // Borders
  border: '#2C333D',
  borderStrong: '#3C4450',

  // Text — off-white with slate-grey muted tones.
  text: '#F2F5F8',
  textMuted: '#9AA4B1',
  textFaint: '#646E7B',

  // Accent — Electric Sky Blue (primary action) + companions.
  accent: '#21B8E8',
  accentBright: '#4FCBF2',
  accentSoft: '#0C2A3680', // translucent so it sits over any surface
  accentBorder: '#21B8E859',
  onAccent: '#06222C',

  // Success / active — Energetic Green.
  success: '#2FCC74',
  successSoft: '#0E2A1C80',
  onSuccess: '#04210F',

  // Other semantics
  warning: '#F2922C', // Warm Orange
  danger: '#FF5A63',
};

// Brand light palette — reserved for a future light/dark toggle.
export const lightColors = {
  bg: '#F4F6F9', // Off-White
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceAlt: '#EBEEF3', // Pale Grey
  surfaceHover: '#E2E6EC',

  border: '#D8DDE5',
  borderStrong: '#C2C9D4',

  text: '#1B2330', // Dark Grey
  textMuted: '#5C6675',
  textFaint: '#8B95A3',

  accent: '#1E5BD6', // Cobalt Blue
  accentBright: '#3D74E8',
  accentSoft: '#1E5BD61A',
  accentBorder: '#1E5BD64D',
  onAccent: '#FFFFFF',

  success: '#1FAE62',
  successSoft: '#1FAE621A',
  onSuccess: '#FFFFFF',

  warning: '#F2922C', // Warm Orange
  danger: '#E5484D',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 22,
  pill: 999,
};

// Reusable typography presets (use directly or spread into a style).
export const typography = {
  display: { fontSize: 32, fontWeight: '800', letterSpacing: -0.6, color: colors.text } as TextStyle,
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.4, color: colors.text } as TextStyle,
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.textMuted } as TextStyle,
  body: { fontSize: 15, lineHeight: 22, color: colors.text } as TextStyle,
  label: { fontSize: 14, fontWeight: '600', color: colors.text } as TextStyle,
  overline: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: colors.textMuted,
  } as TextStyle,
};

// Elevation presets — cross-platform (iOS shadow + Android elevation).
const elevation = (color: string, opacity: number, radius: number, y: number, e: number): ViewStyle =>
  Platform.select<ViewStyle>({
    ios: {
      shadowColor: color,
      shadowOpacity: opacity,
      shadowRadius: radius,
      shadowOffset: { width: 0, height: y },
    },
    android: { elevation: e },
    default: {},
  })!;

export const shadow = {
  card: elevation('#000000', 0.35, 12, 6, 4),
  raised: elevation('#000000', 0.45, 20, 10, 8),
  // Cool glow under the primary accent button.
  glow: elevation(colors.accent, 0.5, 16, 8, 8),
};
