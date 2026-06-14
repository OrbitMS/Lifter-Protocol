import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Units } from '@/lib/units';

interface SettingsState {
  units: Units;
  /** override for the coach backend; empty string = use app.json default */
  coachApiUrl: string;
  setUnits: (u: Units) => void;
  setCoachApiUrl: (u: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      units: 'kg',
      coachApiUrl: '',
      setUnits: (units) => set({ units }),
      setCoachApiUrl: (coachApiUrl) => set({ coachApiUrl }),
    }),
    {
      name: 'lifter-protocol-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
