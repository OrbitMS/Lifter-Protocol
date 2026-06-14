import type { ExercisePrescription } from '@/types/program';
import { TRAINING_MAX_RATIO } from '@/engine/periodization';

export type MainLift = 'squat' | 'bench' | 'deadlift';
export type TrainingMaxes = Record<MainLift, number>;

export const roundLoad = (n: number, step = 2.5) => Math.round(n / step) * step;

const MAIN: MainLift[] = ['squat', 'bench', 'deadlift'];
const isMain = (c: string): c is MainLift => (MAIN as string[]).includes(c);

/** Starting training maxes = ~90% of entered 1RMs. */
export function trainingMaxesFromMaxes(maxes: { squat: number; bench: number; deadlift: number }): TrainingMaxes {
  return {
    squat: roundLoad(maxes.squat * TRAINING_MAX_RATIO),
    bench: roundLoad(maxes.bench * TRAINING_MAX_RATIO),
    deadlift: roundLoad(maxes.deadlift * TRAINING_MAX_RATIO),
  };
}

/**
 * Computed top-set load for a prescription: main lifts & competition variations
 * are %-based off the (adaptive) training max; accessories return null (the
 * athlete logs their own working weight).
 */
export function exerciseLoad(ex: ExercisePrescription, tms?: TrainingMaxes): number | null {
  const pct = ex.intensity.percentOf1RM;
  if (pct == null || !tms || !isMain(ex.category)) return null;
  return roundLoad(tms[ex.category] * pct);
}

export interface WarmupSet {
  weight: number;
  reps: number;
}

/**
 * Ramp-up warm-up sets toward a working top set: empty bar, then ~50/70/85%.
 * Returns an ascending list strictly below the top weight (kg). Bar defaults
 * to a 20 kg barbell.
 */
export function warmupSets(topKg: number, bar = 20): WarmupSet[] {
  if (topKg <= bar) return [];
  const steps: { pct: number; reps: number }[] = [
    { pct: 0, reps: 8 }, // bar
    { pct: 0.5, reps: 5 },
    { pct: 0.7, reps: 3 },
    { pct: 0.85, reps: 2 },
  ];
  const out: WarmupSet[] = [];
  for (const { pct, reps } of steps) {
    const weight = pct === 0 ? bar : roundLoad(topKg * pct);
    if (weight >= bar && weight < topKg && (out.length === 0 || weight > out[out.length - 1].weight)) {
      out.push({ weight, reps });
    }
  }
  return out;
}
