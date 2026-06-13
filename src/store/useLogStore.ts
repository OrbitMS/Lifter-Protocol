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

interface LogState {
  /** keyed by base exercise name */
  logs: Record<string, ExerciseEntry[]>;
  addEntry: (exerciseName: string, sets: LoggedSet[], date?: string) => void;
  removeEntry: (exerciseName: string, id: string) => void;
  entriesFor: (exerciseName: string) => ExerciseEntry[];
  trackedNames: () => string[];
}

/** Best estimated-1RM in an entry (across its sets). */
export function entryBestE1RM(entry: ExerciseEntry): number {
  return bestE1RM(entry.sets);
}

/** Heaviest single set (weight) in an entry. */
export function entryTopWeight(entry: ExerciseEntry): number {
  return entry.sets.reduce((m, s) => Math.max(m, s.weight), 0);
}

export const useLogStore = create<LogState>()(
  persist(
    (set, get) => ({
      logs: {},

      addEntry: (exerciseName, sets, date) => {
        const key = baseExerciseName(exerciseName);
        const entry: ExerciseEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date: date ?? new Date().toISOString(),
          sets: sets.filter((s) => s.weight > 0 && s.reps > 0),
        };
        if (entry.sets.length === 0) return;
        set((state) => {
          const prev = state.logs[key] ?? [];
          const next = [...prev, entry].sort((a, b) => a.date.localeCompare(b.date));
          return { logs: { ...state.logs, [key]: next } };
        });
      },

      removeEntry: (exerciseName, id) => {
        const key = baseExerciseName(exerciseName);
        set((state) => ({
          logs: { ...state.logs, [key]: (state.logs[key] ?? []).filter((e) => e.id !== id) },
        }));
      },

      entriesFor: (exerciseName) => get().logs[baseExerciseName(exerciseName)] ?? [],

      trackedNames: () =>
        Object.keys(get().logs)
          .filter((k) => (get().logs[k]?.length ?? 0) > 0)
          .sort(),
    }),
    {
      name: 'lifter-protocol-logs',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
