import { entryBestE1RM, type ExerciseEntry } from '@/store/useLogStore';
import type { TechniqueRow } from '@/lib/db';

/**
 * Compact, text summary of recent logged performance for the coach prompt.
 * One line per lift: recent estimated-1RM points + a trend/stall flag.
 */
export function summarizeTraining(
  logs: Record<string, ExerciseEntry[]>,
  opts: { maxLifts?: number; maxPoints?: number } = {},
): string {
  const { maxLifts = 8, maxPoints = 5 } = opts;
  const lifts = Object.keys(logs)
    .filter((k) => (logs[k]?.length ?? 0) > 0)
    .sort((a, b) => (logs[b].length ?? 0) - (logs[a].length ?? 0))
    .slice(0, maxLifts);

  const lines = lifts.map((name) => {
    const pts = logs[name].slice(-maxPoints).map((e: ExerciseEntry) => ({
      date: new Date(e.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      e1rm: entryBestE1RM(e),
    }));
    const series = pts.map((p) => `${p.date} ${p.e1rm}kg`).join(' → ');
    const first = pts[0]?.e1rm ?? 0;
    const last = pts[pts.length - 1]?.e1rm ?? 0;
    const delta = last - first;
    const trend =
      pts.length < 2 ? 'only one session'
      : delta > 0 ? `up ${delta}kg`
      : delta < 0 ? `down ${Math.abs(delta)}kg`
      : 'flat — possible stall';
    return `- ${name}: ${series} (${trend})`;
  });

  return lines.join('\n');
}

/** Compact text of recent technique sessions for the coach prompt. */
export function summarizeTechnique(sessions: TechniqueRow[]): string {
  if (sessions.length === 0) return '';
  const lines = sessions.slice(0, 3).map((s) => {
    const d = new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return `- ${s.exercise_name} (${d}): ${s.summary}`;
  });
  return 'Recent technique analysis:\n' + lines.join('\n');
}
