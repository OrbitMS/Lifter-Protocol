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
import { roundLoad, trainingMaxesFromMaxes, type TrainingMaxes } from '@/lib/load';
import { useLogStore } from './useLogStore';

const genId = () => `p_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;

/** A completed, named athlete profile with its generated program. */
export interface StoredProfile {
  id: string;
  profile: UserProfile;
  config: ProgramConfig;
  program: Program;
  /** exercise substitutions: original base name -> replacement base name */
  overrides: Record<string, string>;
  /** adaptive training maxes — auto-regulation moves these over time */
  trainingMaxes?: TrainingMaxes;
  /** completed training days: flattened day index -> ISO date completed */
  completed?: Record<number, string>;
}

interface Draft {
  profile: UserProfile;
  config: Partial<ProgramConfig>;
}

interface ProfileState {
  profiles: StoredProfile[];
  activeId?: string;
  draft: Draft;
  /** when set, buildProgram updates this profile instead of creating a new one */
  editingId?: string;

  // onboarding setters write to the draft
  setBasics: (b: Basics) => void;
  setHistory: (h: TrainingHistory) => void;
  setRecovery: (r: RecoveryProfile) => void;
  setNutrition: (n: Nutrition) => void;
  setConfig: (c: Partial<ProgramConfig>) => void;

  /** commit the draft as a new profile and make it active */
  buildProgram: () => void;

  // multi-profile management
  startNewProfile: () => void;
  /** load the active profile's answers into the draft for editing */
  editActiveProfile: () => void;
  switchProfile: (id: string) => void;
  deleteProfile: (id: string) => void;

  // exercise substitution (active profile)
  setOverride: (slot: string, replacement: string) => void;
  clearOverride: (slot: string) => void;

  // adaptive loop (active profile)
  finishWorkout: (dayIndex: number, trainingMaxes: TrainingMaxes) => void;
  nudgeTrainingMaxes: (multiplier: number) => void;

  reset: () => void;
}

const emptyDraft = (): Draft => ({ profile: {}, config: {} });

export const useProfileStore = create<ProfileState>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeId: undefined,
      draft: emptyDraft(),
      editingId: undefined,

      setBasics: (basics) =>
        set((s) => ({ draft: { ...s.draft, profile: { ...s.draft.profile, basics } } })),
      setHistory: (history) =>
        set((s) => ({ draft: { ...s.draft, profile: { ...s.draft.profile, history } } })),
      setRecovery: (recovery) =>
        set((s) => ({ draft: { ...s.draft, profile: { ...s.draft.profile, recovery: enrichRecovery(recovery) } } })),
      setNutrition: (nutrition) =>
        set((s) => ({ draft: { ...s.draft, profile: { ...s.draft.profile, nutrition } } })),
      setConfig: (c) =>
        set((s) => ({ draft: { ...s.draft, config: { ...s.draft.config, ...c } } })),

      buildProgram: () => {
        const { draft, editingId } = get();
        if (!draft.profile.history || !draft.profile.recovery || !draft.config.type) return;
        const program = generateProgram(draft.profile, draft.config as ProgramConfig);
        const config = draft.config as ProgramConfig;
        const trainingMaxes = trainingMaxesFromMaxes(draft.profile.history.maxes);

        if (editingId) {
          // update in place — keep id, overrides and logs; reset completion to the new plan
          set((s) => ({
            profiles: s.profiles.map((p) =>
              p.id === editingId ? { ...p, profile: draft.profile, config, program, trainingMaxes, completed: {} } : p,
            ),
            activeId: editingId,
            editingId: undefined,
            draft: emptyDraft(),
          }));
          return;
        }

        const id = genId();
        const stored: StoredProfile = {
          id,
          profile: draft.profile,
          config,
          program,
          overrides: {},
          trainingMaxes,
          completed: {},
        };
        set((s) => ({ profiles: [...s.profiles, stored], activeId: id, draft: emptyDraft() }));
      },

      startNewProfile: () => set({ draft: emptyDraft(), editingId: undefined }),

      editActiveProfile: () => {
        const { profiles, activeId } = get();
        const p = profiles.find((x) => x.id === activeId);
        if (!p) return;
        set({ draft: { profile: p.profile, config: p.config }, editingId: p.id });
      },

      switchProfile: (id) => set({ activeId: id }),

      deleteProfile: (id) => {
        useLogStore.getState().clearProfile(id);
        set((s) => {
          const profiles = s.profiles.filter((p) => p.id !== id);
          const activeId = s.activeId === id ? profiles[0]?.id : s.activeId;
          return { profiles, activeId };
        });
      },

      setOverride: (slot, replacement) =>
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === s.activeId ? { ...p, overrides: { ...p.overrides, [slot]: replacement } } : p,
          ),
        })),

      clearOverride: (slot) =>
        set((s) => ({
          profiles: s.profiles.map((p) => {
            if (p.id !== s.activeId) return p;
            const overrides = { ...p.overrides };
            delete overrides[slot];
            return { ...p, overrides };
          }),
        })),

      finishWorkout: (dayIndex, trainingMaxes) =>
        set((s) => ({
          profiles: s.profiles.map((p) =>
            p.id === s.activeId
              ? {
                  ...p,
                  trainingMaxes,
                  completed: { ...(p.completed ?? {}), [dayIndex]: new Date().toISOString() },
                }
              : p,
          ),
        })),

      nudgeTrainingMaxes: (multiplier) =>
        set((s) => ({
          profiles: s.profiles.map((p) => {
            if (p.id !== s.activeId || !p.trainingMaxes) return p;
            const tm = p.trainingMaxes;
            return {
              ...p,
              trainingMaxes: {
                squat: roundLoad(tm.squat * multiplier),
                bench: roundLoad(tm.bench * multiplier),
                deadlift: roundLoad(tm.deadlift * multiplier),
              },
            };
          }),
        })),

      reset: () => set({ profiles: [], activeId: undefined, draft: emptyDraft(), editingId: undefined }),
    }),
    {
      name: 'lifter-protocol-profile',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // v1 stored a single { profile, config, program } — wrap it into a profile.
      migrate: (persisted: unknown, version: number) => {
        if (!persisted || typeof persisted !== 'object') return persisted as never;
        if (version < 2) {
          const old = persisted as { profile?: UserProfile; config?: Partial<ProgramConfig>; program?: Program };
          if (old.program) {
            const id = genId();
            return {
              profiles: [
                {
                  id,
                  profile: old.profile ?? {},
                  config: (old.config ?? {}) as ProgramConfig,
                  program: old.program,
                  overrides: {},
                },
              ],
              activeId: id,
              draft: emptyDraft(),
            };
          }
          return { profiles: [], activeId: undefined, draft: emptyDraft() };
        }
        return persisted as never;
      },
    },
  ),
);

/** The currently selected profile (or undefined before onboarding). */
export const useActiveProfile = () =>
  useProfileStore((s) => s.profiles.find((p) => p.id === s.activeId));

export const profileName = (p: StoredProfile, index: number): string =>
  p.profile.basics?.name?.trim() || `Athlete ${index + 1}`;

/** Current training maxes, falling back to ~90% of entered 1RMs for older profiles. */
export const effectiveTrainingMaxes = (p?: StoredProfile): TrainingMaxes | undefined => {
  if (!p) return undefined;
  if (p.trainingMaxes) return p.trainingMaxes;
  if (p.profile.history) return trainingMaxesFromMaxes(p.profile.history.maxes);
  return undefined;
};
