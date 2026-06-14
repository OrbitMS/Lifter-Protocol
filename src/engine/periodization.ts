import type { PhaseName, ProgramType } from '@/types/program';

export interface PhaseSpec {
  phase: PhaseName;
  weeks: number;
  /** main-lift rep target for the block */
  mainReps: number;
  /** main-lift top-set intensity as %1RM */
  mainPercent: number;
  /** baseline accessory set count before focus/recovery modifiers */
  accessorySets: number;
  /** baseline accessory rep target */
  accessoryReps: number;
}

/**
 * Block-periodized templates per program type. A program is built by repeating
 * these phases. Powerlifting drives intensity up toward a realization (peak);
 * powerbuilding spends more weeks accumulating hypertrophy volume; power-combo
 * alternates strength and hypertrophy blocks.
 */
export const PHASE_TEMPLATES: Record<ProgramType, PhaseSpec[]> = {
  powerlifting: [
    { phase: 'accumulation', weeks: 4, mainReps: 5, mainPercent: 0.75, accessorySets: 3, accessoryReps: 8 },
    { phase: 'intensification', weeks: 3, mainReps: 3, mainPercent: 0.85, accessorySets: 2, accessoryReps: 6 },
    { phase: 'realization', weeks: 2, mainReps: 1, mainPercent: 0.93, accessorySets: 1, accessoryReps: 5 },
    { phase: 'deload', weeks: 1, mainReps: 5, mainPercent: 0.6, accessorySets: 1, accessoryReps: 10 },
  ],
  powerbuilding: [
    { phase: 'hypertrophy', weeks: 4, mainReps: 8, mainPercent: 0.7, accessorySets: 4, accessoryReps: 12 },
    { phase: 'accumulation', weeks: 3, mainReps: 5, mainPercent: 0.78, accessorySets: 4, accessoryReps: 10 },
    { phase: 'intensification', weeks: 2, mainReps: 4, mainPercent: 0.85, accessorySets: 3, accessoryReps: 8 },
    { phase: 'deload', weeks: 1, mainReps: 8, mainPercent: 0.6, accessorySets: 2, accessoryReps: 12 },
  ],
  'power-combo': [
    { phase: 'hypertrophy', weeks: 3, mainReps: 8, mainPercent: 0.72, accessorySets: 4, accessoryReps: 12 },
    { phase: 'accumulation', weeks: 3, mainReps: 5, mainPercent: 0.78, accessorySets: 3, accessoryReps: 10 },
    { phase: 'intensification', weeks: 2, mainReps: 3, mainPercent: 0.87, accessorySets: 2, accessoryReps: 6 },
    { phase: 'realization', weeks: 1, mainReps: 1, mainPercent: 0.92, accessorySets: 1, accessoryReps: 5 },
    { phase: 'deload', weeks: 1, mainReps: 6, mainPercent: 0.6, accessorySets: 1, accessoryReps: 10 },
  ],
};

/**
 * Competition build for powerbuilding: keep the early hypertrophy work but end
 * with a true intensification → realization (peak) → deload sequence so the
 * athlete arrives at the meet expressing maximal strength on S/B/D.
 */
const POWERBUILDING_PEAK: PhaseSpec[] = [
  { phase: 'hypertrophy', weeks: 3, mainReps: 8, mainPercent: 0.7, accessorySets: 4, accessoryReps: 12 },
  { phase: 'accumulation', weeks: 3, mainReps: 5, mainPercent: 0.8, accessorySets: 3, accessoryReps: 10 },
  { phase: 'intensification', weeks: 2, mainReps: 3, mainPercent: 0.88, accessorySets: 2, accessoryReps: 6 },
  { phase: 'realization', weeks: 1, mainReps: 1, mainPercent: 0.93, accessorySets: 1, accessoryReps: 5 },
  { phase: 'deload', weeks: 1, mainReps: 5, mainPercent: 0.6, accessorySets: 1, accessoryReps: 10 },
];

/**
 * Pick the phase sequence for a program. Powerlifting and power-combo already
 * peak; when competing, powerbuilding switches to a peaking build (above).
 */
export function getPhases(type: ProgramType, competing: boolean): PhaseSpec[] {
  if (competing && type === 'powerbuilding') return POWERBUILDING_PEAK;
  return PHASE_TEMPLATES[type];
}

/**
 * Working max convention (à la 5/3/1 / Juggernaut): prescribe against ~90% of
 * the true 1RM so early sessions stay submaximal and progress has headroom.
 */
export const TRAINING_MAX_RATIO = 0.9;
