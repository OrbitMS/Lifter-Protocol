import { baseExerciseName, bestE1RM, estimate1RM } from '../metrics';
import { getExerciseInfo } from '@/constants/exerciseInfo';
import { alternativesFor } from '@/engine/exercises';

describe('metrics', () => {
  it('estimate1RM returns the weight at 1 rep', () => {
    expect(estimate1RM(200, 1)).toBe(200);
  });
  it('estimate1RM grows with reps (Epley)', () => {
    expect(estimate1RM(100, 5)).toBeGreaterThan(100);
    expect(estimate1RM(100, 10)).toBeGreaterThan(estimate1RM(100, 5));
  });
  it('estimate1RM guards against bad input', () => {
    expect(estimate1RM(0, 5)).toBe(0);
    expect(estimate1RM(100, 0)).toBe(0);
  });
  it('baseExerciseName strips the load hint', () => {
    expect(baseExerciseName('Squat — 140kg')).toBe('Squat');
    expect(baseExerciseName('Barbell Row')).toBe('Barbell Row');
  });
});

describe('exercise info', () => {
  it('returns bespoke info for a main lift', () => {
    const info = getExerciseInfo('Bench Press — 110kg');
    expect(info.name).toBe('Bench Press');
    expect(info.pattern).toBe('horizontal-push');
    expect(info.instructions.length).toBeGreaterThan(2);
  });
  it('infers a pattern for unlisted accessories', () => {
    expect(getExerciseInfo('EZ-Bar Curl').pattern).toBe('isolation');
    expect(getExerciseInfo('Seated Cable Row').pattern).toBe('horizontal-pull');
    expect(getExerciseInfo('Hanging Leg Raise').pattern).toBe('core');
  });
});

describe('exercise substitution', () => {
  it('offers same-pattern alternatives, excluding the exercise itself', () => {
    const alts = alternativesFor('Leg Press');
    expect(alts.length).toBeGreaterThan(0);
    expect(alts).not.toContain('Leg Press');
    // all alternatives share the squat pattern
    alts.forEach((a) => expect(getExerciseInfo(a).pattern).toBe(getExerciseInfo('Leg Press').pattern));
  });
});

describe('log e1RM', () => {
  it('takes the best estimated 1RM across a set list', () => {
    const sets = [
      { weight: 100, reps: 5 },
      { weight: 120, reps: 2 },
    ];
    expect(bestE1RM(sets)).toBe(estimate1RM(120, 2));
  });
});
