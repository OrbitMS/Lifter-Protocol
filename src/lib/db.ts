import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('lifterprotocol.db');

type LogRow = {
  id: string;
  profile_id: string;
  exercise_name: string;
  date: string;
  sets_json: string;
};

/** Create tables and indexes. Safe to call multiple times (IF NOT EXISTS). */
export function initDB(): void {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS log_entries (
      id           TEXT PRIMARY KEY,
      profile_id   TEXT NOT NULL,
      exercise_name TEXT NOT NULL,
      date         TEXT NOT NULL,
      sets_json    TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_entries_lookup
      ON log_entries (profile_id, exercise_name, date);
  `);
}

export function dbInsertEntry(
  id: string,
  profileId: string,
  exerciseName: string,
  date: string,
  setsJson: string,
): void {
  db.runSync(
    'INSERT OR REPLACE INTO log_entries (id, profile_id, exercise_name, date, sets_json) VALUES (?, ?, ?, ?, ?)',
    [id, profileId, exerciseName, date, setsJson],
  );
}

export function dbDeleteEntry(id: string): void {
  db.runSync('DELETE FROM log_entries WHERE id = ?', [id]);
}

export function dbDeleteProfile(profileId: string): void {
  db.runSync('DELETE FROM log_entries WHERE profile_id = ?', [profileId]);
}

/** Load all entries sorted oldest-first (used on app init to hydrate in-memory state). */
export function dbGetAllRows(): LogRow[] {
  return db.getAllSync<LogRow>('SELECT * FROM log_entries ORDER BY date ASC');
}

/** Recent entries for a specific exercise — used by the RAG layer when building coach context. */
export function dbGetRecentRows(profileId: string, exerciseName: string, limit: number): LogRow[] {
  return db.getAllSync<LogRow>(
    'SELECT * FROM log_entries WHERE profile_id = ? AND exercise_name = ? ORDER BY date DESC LIMIT ?',
    [profileId, exerciseName, limit],
  );
}

/**
 * One-time migration: reads the old Zustand/AsyncStorage JSON blob and inserts
 * all entries into SQLite. Skipped on subsequent launches (table already has rows).
 * Deletes the old AsyncStorage key on success so it only runs once.
 */
export async function migrateLegacyLogs(): Promise<void> {
  const existing = db.getFirstSync<{ c: number }>('SELECT COUNT(*) AS c FROM log_entries');
  if (existing && existing.c > 0) return;

  try {
    const raw = await AsyncStorage.getItem('lifter-protocol-logs');
    if (!raw) return;
    const parsed = JSON.parse(raw) as {
      state?: { logs?: Record<string, Record<string, Array<{ id: string; date: string; sets: unknown }>>> };
    };
    const logs = parsed.state?.logs ?? {};

    db.withTransactionSync(() => {
      for (const [profileId, exercises] of Object.entries(logs)) {
        for (const [exerciseName, entries] of Object.entries(exercises)) {
          for (const entry of entries) {
            db.runSync(
              'INSERT OR IGNORE INTO log_entries (id, profile_id, exercise_name, date, sets_json) VALUES (?, ?, ?, ?, ?)',
              [entry.id, profileId, exerciseName, entry.date, JSON.stringify(entry.sets)],
            );
          }
        }
      }
    });

    await AsyncStorage.removeItem('lifter-protocol-logs');
  } catch {
    // Ignore migration errors — user starts fresh; old data can be re-entered.
  }
}

export type { LogRow };
