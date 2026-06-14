import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { Units } from '@/lib/units';

interface SettingsState {
  units: Units;
  setUnits: (u: Units) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      units: 'kg',
      setUnits: (units) => set({ units }),
    }),
    {
      name: 'lifter-protocol-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
