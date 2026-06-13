import type { TrainingHistory, RecoveryProfile } from '@/types/profile';
import type {
  Block,
  ExercisePrescription,
  Program,
  ProgramConfig,
  Session,
  TrainingWeek,
  Weekday,
} from '@/types/program';
import { selectSupportWork } from './exercises';
import { PHASE_TEMPLATES, TRAINING_MAX_RATIO } from './periodization';
import {
  bucketRecovery,
  computeRecoveryIndex,
  recoveryRpeCeiling,
  recoveryVolumeModifier,
} from './recovery';

const MAIN_LIFTS = ['squat', 'bench', 'deadlift'] as const;
type MainLift = (typeof MAIN_LIFTS)[number];

const LIFT_LABEL: Record<MainLift, string> = {
  squat: 'Squat',
  bench: 'Bench Press',
  deadlift: 'Deadlift',
};

function round(n: number, step = 2.5): number {
  return Math.round(n / step) * step;
}

/**
 * Build a complete program from the profile + config.
 *
 * High level:
 *   1. recovery → volume + intensity modifiers
 *   2. for each periodization phase → for each week → for each training day:
 *        - assign a main lift focus (rotated across the week)
 *        - prescribe top sets against the training max
 *        - layer in accessories per bbToPlRatio + focus areas
 */
export function generateProgram(
  history: TrainingHistory,
  recovery: RecoveryProfile,
  config: ProgramConfig,
): Program {
  const index = recovery.recoveryIndex ?? computeRecoveryIndex(recovery);
  const bucket = recovery.recoveryBucket ?? bucketRecovery(index);
  const setMod = recoveryVolumeModifier(bucket);
  const rpeCeiling = recoveryRpeCeiling(bucket);

  // training maxes
  const tm: Record<MainLift, number> = {
    squat: history.maxes.squat * TRAINING_MAX_RATIO,
    bench: history.maxes.bench * TRAINING_MAX_RATIO,
    deadlift: history.maxes.deadlift * TRAINING_MAX_RATIO,
  };

  const phases = PHASE_TEMPLATES[config.type];
  const days = config.trainingDays.slice(0, config.daysPerWeek);

  const blocks: Block[] = phases.map((spec) => {
    const weeks: TrainingWeek[] = [];

    for (let w = 1; w <= spec.weeks; w++) {
      // simple wave: nudge intensity up across weeks within a block
      const weekBump = (w - 1) * 0.02;
      const sessions: Session[] = days.map((day, di) => {
        const mainLift = MAIN_LIFTS[di % MAIN_LIFTS.length];

        const topPercent = Math.min(0.95, spec.mainPercent + weekBump);
        const mainEx: ExercisePrescription = {
          // concrete top-set load attached as a hint via name suffix
          name: `${LIFT_LABEL[mainLift]} — ${round(tm[mainLift] * topPercent)}kg`,
          category: mainLift,
          role: 'main',
          sets: Math.max(1, 3 + setMod),
          reps: spec.mainReps,
          intensity: {
            percentOf1RM: topPercent,
            rpe: Math.min(rpeCeiling, 9),
          },
        };

        const support = selectSupportWork({
          lift: mainLift,
          phase: spec.phase,
          programType: config.type,
          bbToPlRatio: config.bbToPlRatio,
          upperFocus: config.upperFocus,
          lowerFocus: config.lowerFocus,
          setMod,
          rpeCeiling,
          week: w,
          phaseSpec: spec,
          trainingMax: tm[mainLift],
        });

        return {
          day: day as Weekday,
          label: `${LIFT_LABEL[mainLift]} Focus`,
          exercises: [mainEx, ...support],
        };
      });

      weeks.push({ index: w, sessions });
    }

    return { phase: spec.phase, weeks };
  });

  return {
    type: config.type,
    generatedAt: new Date().toISOString(),
    config,
    blocks,
  };
}
