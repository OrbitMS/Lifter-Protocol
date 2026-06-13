import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { baseExerciseName, bestE1RM } from '@/lib/metrics';

export interface LoggedSet {
  weight: number;
  reps: number;
  rpe?: number;
}

export interface ExerciseEntry {
  id: string;
  date: string; // ISO
  sets: LoggedSet[];
}

type ProfileLogs = Record<string, ExerciseEntry[]>; // exercise base name -> entries

interface LogState {
  /** profileId -> exercise name -> entries */
  logs: Record<string, ProfileLogs>;
  addEntry: (profileId: string, exerciseName: string, sets: LoggedSet[], date?: string) => void;
  removeEntry: (profileId: string, exerciseName: string, id: string) => void;
  entriesFor: (profileId: string, exerciseName: string) => ExerciseEntry[];
  logsForProfile: (profileId: string) => ProfileLogs;
  clearProfile: (profileId: string) => void;
}

export function entryBestE1RM(entry: ExerciseEntry): number {
  return bestE1RM(entry.sets);
}

export function entryTopWeight(entry: ExerciseEntry): number {
  return entry.sets.reduce((m, s) => Math.max(m, s.weight), 0);
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: {},

      addEntry: (profileId, exerciseName, sets, date) => {
        if (!profileId) return;
        const key = baseExerciseName(exerciseName);
        const clean = sets.filter((s) => s.weight > 0 && s.reps > 0);
        if (clean.length === 0) return;
        const entry: ExerciseEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date: date ?? new Date().toISOString(),
          sets: clean,
        };
        set((state) => {
          const pl = state.logs[profileId] ?? {};
          const next = [...(pl[key] ?? []), entry].sort((a, b) => a.date.localeCompare(b.date));
          return { logs: { ...state.logs, [profileId]: { ...pl, [key]: next } } };
        });
      },

      removeEntry: (profileId, exerciseName, id) => {
        const key = baseExerciseName(exerciseName);
        set((state) => {
          const pl = state.logs[profileId];
          if (!pl) return {} as Partial<LogState>;
          return {
            logs: { ...state.logs, [profileId]: { ...pl, [key]: (pl[key] ?? []).filter((e) => e.id !== id) } },
          };
        });
      },

      entriesFor: (profileId, exerciseName) =>
        get().logs[profileId]?.[baseExerciseName(exerciseName)] ?? [],

      logsForProfile: (profileId) => get().logs[profileId] ?? {},

      clearProfile: (profileId) =>
        set((state) => {
          const next = { ...state.logs };
          delete next[profileId];
          return { logs: next };
        }),
    }),
    {
      name: 'lifter-protocol-logs',
      version: 2,
      storage: createJSONStorage(() => AsyncStorage),
      // v1 stored logs as a flat name->entries map (pre-multi-profile, unreleased).
      migrate: (persisted: unknown, version: number) => {
        if (version < 2) return { logs: {} };
        return persisted as { logs: Record<string, ProfileLogs> };
      },
    },
  ),
);
