import AsyncStorage from '@react-native-async-storage/async-storage';
import { useMemo } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { palettes, type Palette } from '@/constants/theme';

export type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: 'dark',
      setMode: (mode) => set({ mode }),
    }),
    {
      name: 'lifter-protocol-theme',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

/** Resolves the active palette from the stored mode + OS appearance. */
export function useTheme() {
  const mode = useThemeStore((s) => s.mode);
  const system = useColorScheme();
  const isDark = mode === 'system' ? system !== 'light' : mode === 'dark';
  return { palette: isDark ? palettes.dark : palettes.light, isDark, mode } as const;
}

/**
 * Builds a StyleSheet from the active palette, memoized per theme.
 * Usage: const styles = useThemedStyles(makeStyles) where makeStyles = (c) => StyleSheet.create({...}).
 */
export function useThemedStyles<T extends StyleSheet.NamedStyles<T>>(
  factory: (c: Palette) => T,
): T {
  const { palette } = useTheme();
  return useMemo(() => factory(palette), [palette, factory]);
}
