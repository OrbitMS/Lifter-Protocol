import { baseExerciseName, estimate1RM } from '@/lib/metrics';
import { fmtWeight, type Units } from '@/lib/units';
import type { ExerciseEntry } from '@/store/useLogStore';
import type { Program } from '@/types/program';

// ─── Exercise detection ───────────────────────────────────────────────────────

/**
 * Maps words the user might say → fragment that should appear in the program
 * exercise name. Sorted longest-first so "bench press" beats "bench".
 */
const KEYWORD_MAP: [keyword: string, fragment: string][] = [
  ['bench press', 'bench'],
  ['back squat', 'squat'],
  ['front squat', 'squat'],
  ['overhead press', 'overhead'],
  ['romanian deadlift', 'deadlift'],
  ['conventional deadlift', 'deadlift'],
  ['sumo deadlift', 'deadlift'],
  ['bent over row', 'row'],
  ['pendlay row', 'row'],
  ['barbell row', 'row'],
  ['deadlift', 'deadlift'],
  ['squat', 'squat'],
  ['bench', 'bench'],
  ['ohp', 'overhead'],
  ['overhead', 'overhead'],
  ['military', 'overhead'],
  ['rdl', 'deadlift'],
  ['sumo', 'deadlift'],
  ['row', 'row'],
  ['dl', 'deadlift'],
  ['sq', 'squat'],
  ['bp', 'bench'],
];

/** Extract unique base exercise names from a stored program. */
export function exercisesInProgram(program?: Program): string[] {
  if (!program) return [];
  const seen = new Set<string>();
  for (const block of program.blocks) {
    for (const week of block.weeks) {
      for (const session of week.sessions) {
        for (const ex of session.exercises) {
          seen.add(baseExerciseName(ex.name));
        }
      }
    }
  }
  return [...seen];
}

/**
 * Detect which exercise the user is asking about.
 *
 * Pass 1 — direct: does any known program exercise name appear verbatim in the message?
 * Pass 2 — alias: does a keyword alias appear? → find the matching program exercise.
 *
 * Returns the exact program exercise name (e.g. "Competition Squat"), or null.
 */
export function detectExercise(text: string, knownExercises: string[]): string | null {
  const lower = text.toLowerCase();

  // Pass 1: direct substring match (longest exercise names first to avoid short matches shadowing long ones)
  const sorted = [...knownExercises].sort((a, b) => b.length - a.length);
  for (const name of sorted) {
    if (lower.includes(name.toLowerCase())) return name;
  }

  // Pass 2: keyword alias → fragment → find matching program exercise
  for (const [keyword, fragment] of KEYWORD_MAP) {
    if (lower.includes(keyword)) {
      const match = knownExercises.find((n) => n.toLowerCase().includes(fragment));
      if (match) return match;
    }
  }

  return null;
}

// ─── Session formatter ────────────────────────────────────────────────────────

function fmtEntry(entry: ExerciseEntry, units: Units): string {
  const sets = entry.sets;
  if (sets.length === 0) return '';

  // Group consecutive sets with same weight/reps into "NxM @ W" notation
  const groups: string[] = [];
  let prev = sets[0];
  let count = 1;
  for (let i = 1; i <= sets.length; i++) {
    const cur = sets[i];
    if (cur && cur.weight === prev.weight && cur.reps === prev.reps) {
      count++;
    } else {
      const rpe = prev.rpe ? ` @RPE${prev.rpe}` : '';
      groups.push(`${count}×${prev.reps} ${fmtWeight(prev.weight, units)}${rpe}`);
      if (cur) { prev = cur; count = 1; }
    }
  }

  const e1rm = sets.reduce((m, s) => Math.max(m, estimate1RM(s.weight, s.reps)), 0);
  return `${groups.join(', ')} — est. 1RM ~${Math.round(e1rm)}kg`;
}

/**
 * Format the last N sessions for one exercise as a compact coach-readable block.
 * Injected into the system prompt when the user asks about that exercise.
 */
export function formatRecentSessions(
  entries: ExerciseEntry[],
  exerciseName: string,
  units: Units,
): string {
  if (entries.length === 0) return '';
  const recent = entries.slice(-3); // up to 3 most recent (entries are oldest-first)
  const lines = recent.map((e) => {
    const d = new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `  ${d}: ${fmtEntry(e, units)}`;
  });
  return `${exerciseName} — last ${recent.length} session(s):\n${lines.join('\n')}`;
}

// ─── Check-in formatter ───────────────────────────────────────────────────────

export interface CheckinSnapshot {
  sleepHours: number;
  soreness: number; // 1–5
  date: string;     // ISO date YYYY-MM-DD
}

const SORENESS_LABEL = ['', 'minimal', 'mild', 'moderate', 'significant', 'severe'];

export function formatCheckin(c: CheckinSnapshot): string {
  const d = new Date(c.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const sl = SORENESS_LABEL[c.soreness] ?? `${c.soreness}/5`;
  return `Athlete check-in (${d}): ${c.sleepHours}h sleep last night, ${sl} soreness today (${c.soreness}/5).`;
}
