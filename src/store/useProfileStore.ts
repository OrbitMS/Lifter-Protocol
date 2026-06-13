import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type {
  Basics,
  Nutrition,
  RecoveryProfile,
  TrainingHistory,
  UserProfile,
} from '@/types/profile';
import type { Program, ProgramConfig } from '@/types/program';
import { enrichRecovery } from '@/engine/recovery';
import { generateProgram } from '@/engine/generator';

interface ProfileState {
  profile: UserProfile;
  config: Partial<ProgramConfig>;
  program?: Program;
  onboardingComplete: boolean;

  setBasics: (b: Basics) => void;
  setHistory: (h: TrainingHistory) => void;
  setRecovery: (r: RecoveryProfile) => void;
  setNutrition: (n: Nutrition) => void;
  setConfig: (c: Partial<ProgramConfig>) => void;

  buildProgram: () => void;
  reset: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profile: {},
      config: {},
      onboardingComplete: false,

      setBasics: (basics) =>
        set((s) => ({ profile: { ...s.profile, basics } })),
      setHistory: (history) =>
        set((s) => ({ profile: { ...s.profile, history } })),
      setRecovery: (recovery) =>
        set((s) => ({ profile: { ...s.profile, recovery: enrichRecovery(recovery) } })),
      setNutrition: (nutrition) =>
        set((s) => ({ profile: { ...s.profile, nutrition } })),
      setConfig: (c) => set((s) => ({ config: { ...s.config, ...c } })),

      buildProgram: () => {
        const { profile, config } = get();
        if (!profile.history || !profile.recovery || !config.type) return;
        const program = generateProgram(
          profile.history,
          profile.recovery,
          config as ProgramConfig,
        );
        set({ program, onboardingComplete: true });
      },

      reset: () =>
        set({ profile: {}, config: {}, program: undefined, onboardingComplete: false }),
    }),
    {
      name: 'lifter-protocol-profile',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
