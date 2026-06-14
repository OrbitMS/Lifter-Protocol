import type { UserProfile } from '@/types/profile';
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
import { getPhases } from './periodization';
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

/**
 * Build a complete program from the full profile + config. Every onboarding
 * answer feeds in:
 *   - recovery (job, stress, recovery speed, sleep) → Recovery Index → sets + RPE cap
 *   - training maxes (S/B/D)                         → top-set loads
 *   - experience (years training)                    → volume + RPE ceiling
 *   - frequency preference (low/high)                → accessory volume per session
 *   - diet goal (lose/maintain/gain)                 → accessory volume
 *   - age                                            → recovery-driven volume
 *   - program type, BB/PL ratio, focus areas, days   → split, emphasis, selection
 *   - competing                                      → peaking macrocycle + taper
 */
export function generateProgram(profile: UserProfile, config: ProgramConfig): Program {
  const history = profile.history!;
  const recovery = profile.recovery!;

  const index = recovery.recoveryIndex ?? computeRecoveryIndex(recovery);
  const bucket = recovery.recoveryBucket ?? bucketRecovery(index);
  const setMod = recoveryVolumeModifier(bucket); // affects sets per exercise

  // experience tier → volume + how hard we let them push
  const years = history.yearsTraining ?? 1;
  const tier = years < 1.5 ? 'beginner' : years <= 4 ? 'intermediate' : 'advanced';
  const expVol = tier === 'beginner' ? -1 : tier === 'advanced' ? 1 : 0;
  const expRpeCap = tier === 'beginner' ? 8 : tier === 'advanced' ? 10 : 9;
  const rpeCeiling = Math.min(recoveryRpeCeiling(bucket), expRpeCap);

  // frequency preference: low frequency concentrates volume into each session
  const freqVol = history.frequencyPreference === 'high' ? -1 : 1;
  // diet goal: a surplus supports more volume, a deficit warrants less
  const goal = profile.nutrition?.dietGoal;
  const dietVol = goal === 'gain' ? 1 : goal === 'lose' ? -1 : 0;
  // age: older athletes recover slower → trim accessory volume
  const age = profile.basics?.age ?? 30;
  const ageVol = age >= 55 ? -2 : age >= 45 ? -1 : 0;

  const accessoryMod = freqVol + dietVol + expVol + ageVol;
  const competing = !!config.competing;

  const phases = getPhases(config.type, competing);
  const days = config.trainingDays.slice(0, config.daysPerWeek);

  const blocks: Block[] = phases.map((spec) => {
    const weeks: TrainingWeek[] = [];

    for (let w = 1; w <= spec.weeks; w++) {
      const weekBump = (w - 1) * 0.02;
      const sessions: Session[] = days.map((day, di) => {
        const mainLift = MAIN_LIFTS[di % MAIN_LIFTS.length];

        const topPercent = Math.min(0.95, spec.mainPercent + weekBump);
        const mainEx: ExercisePrescription = {
          name: LIFT_LABEL[mainLift],
          category: mainLift,
          role: 'main',
          sets: Math.max(1, 3 + setMod + (expVol > 0 ? 1 : 0)),
          reps: spec.mainReps,
          intensity: { percentOf1RM: topPercent, rpe: Math.min(rpeCeiling, 9) },
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
          accessoryMod,
          competing,
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

  return { type: config.type, generatedAt: new Date().toISOString(), config, blocks };
}
