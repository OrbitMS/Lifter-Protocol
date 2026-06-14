import type {
  ExercisePrescription,
  LowerFocus,
  PhaseName,
  ProgramType,
  UpperFocus,
} from '@/types/program';
import type { PhaseSpec } from './periodization';
import { baseExerciseName } from '@/lib/metrics';
import { getExerciseInfo } from '@/constants/exerciseInfo';

export type MainLiftKey = 'squat' | 'bench' | 'deadlift';

/**
 * Competition-style VARIATIONS — used as the second movement in strength work.
 * They carry over directly to the main lift (same pattern, sub-maximal load).
 */
export const VARIATIONS: Record<MainLiftKey, string[]> = {
  squat: ['Pause Squat', 'Front Squat', 'Tempo Squat (3s eccentric)'],
  bench: ['Close-Grip Bench Press', 'Spoto Press', 'Larsen Press'],
  deadlift: ['Deficit Deadlift', 'Pause Deadlift', 'Block Pull'],
};

/**
 * SECONDARY compounds — used as the second movement in hypertrophy work.
 * Same region as the main lift, driven for reps rather than maximal load.
 */
export const SECONDARY: Record<MainLiftKey, string[]> = {
  squat: ['Hack Squat', 'Leg Press', 'Bulgarian Split Squat'],
  bench: ['Incline Barbell Press', 'Incline DB Press', 'Weighted Dip'],
  deadlift: ['Romanian Deadlift', 'Pendlay Row', 'Barbell Hip Thrust'],
};

/** Accessory pools keyed by the focus area they develop. */
const UPPER_POOL: Record<UpperFocus, string[]> = {
  chest: ['Incline DB Press', 'Weighted Dip', 'Cable Fly', 'Machine Chest Press', 'Decline DB Press'],
  back: ['Barbell Row', 'Lat Pulldown', 'Chest-Supported Row', 'Pull-Up', 'Seated Cable Row', 'Straight-Arm Pulldown'],
  shoulders: ['Overhead Press', 'Lateral Raise', 'Face Pull', 'DB Shoulder Press', 'Rear-Delt Fly'],
  arms: ['EZ-Bar Curl', 'Triceps Pushdown', 'Hammer Curl', 'Overhead Triceps Extension', 'Incline DB Curl'],
};

const LOWER_POOL: Record<LowerFocus, string[]> = {
  quads: ['Leg Press', 'Bulgarian Split Squat', 'Leg Extension', 'Hack Squat', 'Walking Lunge'],
  hamstrings: ['Romanian Deadlift', 'Lying Leg Curl', 'Seated Leg Curl', 'Good Morning', 'Nordic Curl'],
  glutes: ['Barbell Hip Thrust', 'Cable Pull-Through', 'Walking Lunge', 'Glute Kickback', 'Reverse Hyper'],
};

/** Core / trunk finishers — rotated in on non-peaking sessions. */
const CORE_POOL = ['Hanging Leg Raise', 'Cable Crunch', 'Ab Wheel Rollout', 'Plank', 'Back Extension', 'Pallof Press'];

const STRENGTH_PHASES: PhaseName[] = ['intensification', 'realization'];
const isHypertrophyPhase = (p: PhaseName) => p === 'hypertrophy' || p === 'accumulation';

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));
const dedupe = <T>(xs: T[]) => Array.from(new Set(xs));

/**
 * Round-robin pick `n` distinct exercises across the given pools, rotating the
 * starting index by week so the stimulus varies block-to-block.
 */
function pickFromPools(
  pools: string[][],
  n: number,
  week: number,
  exclude: Set<string>,
): string[] {
  const out: string[] = [];
  const offset = Math.max(0, week - 1);
  for (let depth = 0; out.length < n && depth < 12; depth++) {
    for (let p = 0; p < pools.length && out.length < n; p++) {
      const pool = pools[p];
      if (pool.length === 0) continue;
      const name = pool[(offset + depth) % pool.length];
      if (!exclude.has(name) && !out.includes(name)) out.push(name);
    }
  }
  return out;
}

export interface SupportWorkOptions {
  lift: MainLiftKey;
  phase: PhaseName;
  programType: ProgramType;
  bbToPlRatio: number;
  upperFocus: UpperFocus[];
  lowerFocus: LowerFocus[];
  /** recovery-derived set modifier (-1 / 0 / +1) */
  setMod: number;
  /** recovery-derived RPE ceiling */
  rpeCeiling: number;
  /** 1-based week within the block (rotates selection) */
  week: number;
  phaseSpec: PhaseSpec;
  /** accessory-count modifier from frequency pref, diet goal, experience, age */
  accessoryMod: number;
  /** competition prep — taper accessories harder in the strength/peak phases */
  competing: boolean;
}

/**
 * Build the support work for a session (everything after the main lift):
 *   1. a competition variation (strength) OR a secondary compound (hypertrophy)
 *   2. focus-weighted accessories, count scaled by program type + BB/PL ratio + recovery
 *   3. a core/prehab finisher (skipped while peaking/deloading)
 *
 * The result is questionnaire-driven: powerlifting leans on variations and few
 * accessories; powerbuilding leans on secondary compounds and more accessories;
 * power-combo alternates by phase. Upper days always include a pulling movement
 * for balance; lower days bias toward the day's lift (squat→quads, deadlift→hams).
 */
export function selectSupportWork(opts: SupportWorkOptions): ExercisePrescription[] {
  const {
    lift, phase, programType, bbToPlRatio, upperFocus, lowerFocus,
    setMod, rpeCeiling, week, phaseSpec, accessoryMod, competing,
  } = opts;

  const region: 'upper' | 'lower' = lift === 'bench' ? 'upper' : 'lower';
  const accRpe = Math.min(rpeCeiling, 8);
  const accSets = clamp(phaseSpec.accessorySets + setMod, 1, 5);
  const out: ExercisePrescription[] = [];
  const used = new Set<string>();

  // 1. variation (strength) vs secondary compound (hypertrophy)
  let supportKind: 'variation' | 'secondary' | 'none';
  if (phase === 'deload') supportKind = 'none';
  else if (programType === 'powerlifting') supportKind = 'variation';
  else if (programType === 'powerbuilding') supportKind = 'secondary';
  else supportKind = STRENGTH_PHASES.includes(phase) ? 'variation' : 'secondary';

  if (supportKind === 'variation') {
    const name = VARIATIONS[lift][(week - 1) % VARIATIONS[lift].length];
    const pct = clamp(phaseSpec.mainPercent - 0.1, 0.6, 0.8);
    used.add(name);
    out.push({
      name,
      category: lift,
      role: 'variation',
      sets: clamp(3 + setMod, 2, 4),
      reps: phaseSpec.mainReps + 2,
      intensity: { percentOf1RM: pct, rpe: accRpe },
    });
  } else if (supportKind === 'secondary') {
    const name = SECONDARY[lift][(week - 1) % SECONDARY[lift].length];
    used.add(name);
    out.push({
      name,
      category: 'accessory',
      role: 'secondary',
      sets: clamp(3 + setMod, 2, 4),
      reps: isHypertrophyPhase(phase) ? 10 : 8,
      intensity: { rpe: accRpe },
    });
  }

  // 2. how many accessories this session carries
  let base: number;
  if (programType === 'powerlifting') base = 2;
  else if (programType === 'powerbuilding') base = Math.round((bbToPlRatio / 100) * 4) + 1;
  else base = 3; // power-combo
  if (isHypertrophyPhase(phase)) base += 1;
  if (phase === 'realization' || phase === 'deload') base -= 1;
  // competition prep tapers accessory volume in the strength/peak phases
  if (competing && STRENGTH_PHASES.includes(phase)) base -= 1;
  const accCount = clamp(base + accessoryMod, 1, 5);

  // 3. focus-weighted accessory pools
  let pools: string[][];
  if (region === 'upper') {
    const order: UpperFocus[] = upperFocus.length ? [...upperFocus] : ['back', 'chest'];
    if (!order.includes('back')) order.push('back'); // always train pulling
    pools = order.map((f) => UPPER_POOL[f]);
  } else {
    let order: LowerFocus[] = lowerFocus.length ? [...lowerFocus] : ['quads', 'hamstrings'];
    order = lift === 'deadlift'
      ? dedupe(['hamstrings', 'glutes', ...order])
      : dedupe(['quads', 'glutes', ...order]);
    pools = order.map((f) => LOWER_POOL[f]);
  }
  for (const name of pickFromPools(pools, accCount, week, used)) {
    used.add(name);
    out.push({
      name,
      category: 'accessory',
      role: 'accessory',
      sets: accSets,
      reps: phaseSpec.accessoryReps,
      intensity: { rpe: accRpe },
    });
  }

  // 4. core / prehab finisher (skip while peaking or deloading)
  if (phase !== 'realization' && phase !== 'deload') {
    const core = CORE_POOL[(week - 1 + (region === 'upper' ? 1 : 0)) % CORE_POOL.length];
    out.push({
      name: core,
      category: 'accessory',
      role: 'core',
      sets: 3,
      reps: 15,
      intensity: { rpe: accRpe },
    });
  }

  return out;
}

/** Every exercise the engine can program — used to offer substitutions. */
export const ALL_EXERCISES: string[] = Array.from(
  new Set<string>([
    'Squat',
    'Bench Press',
    'Deadlift',
    ...Object.values(VARIATIONS).flat(),
    ...Object.values(SECONDARY).flat(),
    ...Object.values(UPPER_POOL).flat(),
    ...Object.values(LOWER_POOL).flat(),
    ...CORE_POOL,
  ]),
).sort();

/**
 * Alternatives for an exercise the athlete doesn't like — same movement pattern,
 * so the swap keeps the session's intent intact.
 */
export function alternativesFor(name: string): string[] {
  const base = baseExerciseName(name);
  const pattern = getExerciseInfo(base).pattern;
  return ALL_EXERCISES.filter((e) => e !== base && getExerciseInfo(e).pattern === pattern);
}
