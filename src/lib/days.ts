import type { PhaseName, Program, Session } from '@/types/program';

export interface FlatDay {
  blockIndex: number;
  weekIndex: number;
  phase: PhaseName;
  weekOfBlock: number;
  weeksInBlock: number;
  session: Session;
}

/** Flatten the macrocycle into an ordered list of training days. */
export function flattenDays(program?: Program): FlatDay[] {
  if (!program) return [];
  const out: FlatDay[] = [];
  program.blocks.forEach((b, bi) =>
    b.weeks.forEach((w, wi) =>
      w.sessions.forEach((session) =>
        out.push({
          blockIndex: bi,
          weekIndex: wi,
          phase: b.phase,
          weekOfBlock: wi + 1,
          weeksInBlock: b.weeks.length,
          session,
        }),
      ),
    ),
  );
  return out;
}
