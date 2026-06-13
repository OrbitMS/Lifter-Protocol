import type {
  ExercisePrescription,
  LowerFocus,
  UpperFocus,
} from '@/types/program';

/** Accessory pools keyed by the focus area they develop. */
const UPPER_POOL: Record<UpperFocus, string[]> = {
  chest: ['Incline DB Press', 'Weighted Dip', 'Cable Fly'],
  back: ['Barbell Row', 'Lat Pulldown', 'Chest-Supported Row'],
  shoulders: ['Overhead Press', 'Lateral Raise', 'Face Pull'],
  arms: ['Close-Grip Bench', 'EZ-Bar Curl', 'Triceps Pushdown'],
};

const LOWER_POOL: Record<LowerFocus, string[]> = {
  quads: ['Leg Press', 'Bulgarian Split Squat', 'Leg Extension'],
  hamstrings: ['Romanian Deadlift', 'Lying Leg Curl', 'Good Morning'],
  glutes: ['Hip Thrust', 'Walking Lunge', 'Cable Pull-Through'],
};

/**
 * Pick accessory exercises for a session, weighted toward the user's chosen
 * focus areas. `slots` is how many accessory movements this session should hold.
 */
export function pickAccessories(
  region: 'upper' | 'lower',
  upperFocus: UpperFocus[],
  lowerFocus: LowerFocus[],
  slots: number,
  sets: number,
  reps: number,
): ExercisePrescription[] {
  const names: string[] = [];

  if (region === 'upper') {
    const focuses = upperFocus.length ? upperFocus : (['back', 'chest'] as UpperFocus[]);
    let i = 0;
    while (names.length < slots) {
      const f = focuses[i % focuses.length];
      const pool = UPPER_POOL[f];
      names.push(pool[Math.floor(i / focuses.length) % pool.length]);
      i++;
    }
  } else {
    const focuses = lowerFocus.length ? lowerFocus : (['quads', 'hamstrings'] as LowerFocus[]);
    let i = 0;
    while (names.length < slots) {
      const f = focuses[i % focuses.length];
      const pool = LOWER_POOL[f];
      names.push(pool[Math.floor(i / focuses.length) % pool.length]);
      i++;
    }
  }

  return names.map((name) => ({
    name,
    category: 'accessory' as const,
    sets,
    reps,
    intensity: { rpe: 8 },
  }));
}
