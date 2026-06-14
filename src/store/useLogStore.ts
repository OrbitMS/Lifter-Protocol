import { create } from 'zustand';
import { baseExerciseName, bestE1RM } from '@/lib/metrics';
import {
  dbDeleteEntry,
  dbDeleteProfile,
  dbGetAllRows,
  dbGetRecentRows,
  dbInsertEntry,
  migrateLegacyLogs,
  type LogRow,
} from '@/lib/db';

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
  /** profileId -> exercise base name -> entries (oldest-first) */
  logs: Record<string, ProfileLogs>;
  /** false until the DB has been read on app start */
  isReady: boolean;

  /** Load all entries from SQLite into memory (call once on app mount). */
  init: () => Promise<void>;

  addEntry: (profileId: string, exerciseName: string, sets: LoggedSet[], date?: string) => void;
  removeEntry: (profileId: string, exerciseName: string, id: string) => void;
  entriesFor: (profileId: string, exerciseName: string) => ExerciseEntry[];
  logsForProfile: (profileId: string) => ProfileLogs;
  clearProfile: (profileId: string) => void;

  /**
   * Recent entries for one exercise queried directly from SQLite.
   * Used by the RAG layer to build coach context without loading everything into memory.
   */
  recentEntriesFor: (profileId: string, exerciseName: string, limit?: number) => ExerciseEntry[];
}

function rowToEntry(row: LogRow): ExerciseEntry {
  return { id: row.id, date: row.date, sets: JSON.parse(row.sets_json) as LoggedSet[] };
}

export function entryBestE1RM(entry: ExerciseEntry): number {
  return bestE1RM(entry.sets);
}

export function entryTopWeight(entry: ExerciseEntry): number {
  return entry.sets.reduce((m, s) => Math.max(m, s.weight), 0);
}

export const useLogStore = create<LogState>()((set, get) => ({
  logs: {},
  isReady: false,

  init: async () => {
    await migrateLegacyLogs();
    const rows = dbGetAllRows();
    const logs: Record<string, ProfileLogs> = {};
    for (const row of rows) {
      const pl = (logs[row.profile_id] ??= {});
      const entries = (pl[row.exercise_name] ??= []);
      entries.push(rowToEntry(row));
    }
    set({ logs, isReady: true });
  },

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

    dbInsertEntry(entry.id, profileId, key, entry.date, JSON.stringify(clean));

    set((state) => {
      const pl = state.logs[profileId] ?? {};
      const next = [...(pl[key] ?? []), entry].sort((a, b) => a.date.localeCompare(b.date));
      return { logs: { ...state.logs, [profileId]: { ...pl, [key]: next } } };
    });
  },

  removeEntry: (profileId, exerciseName, id) => {
    const key = baseExerciseName(exerciseName);
    dbDeleteEntry(id);
    set((state) => {
      const pl = state.logs[profileId];
      if (!pl) return {} as Partial<LogState>;
      return {
        logs: {
          ...state.logs,
          [profileId]: { ...pl, [key]: (pl[key] ?? []).filter((e) => e.id !== id) },
        },
      };
    });
  },

  entriesFor: (profileId, exerciseName) =>
    get().logs[profileId]?.[baseExerciseName(exerciseName)] ?? [],

  logsForProfile: (profileId) => get().logs[profileId] ?? {},

  clearProfile: (profileId) => {
    dbDeleteProfile(profileId);
    set((state) => {
      const next = { ...state.logs };
      delete next[profileId];
      return { logs: next };
    });
  },

  recentEntriesFor: (profileId, exerciseName, limit = 10) => {
    const key = baseExerciseName(exerciseName);
    const rows = dbGetRecentRows(profileId, key, limit);
    return rows.map(rowToEntry).reverse(); // oldest-first for trend display
  },
}));
