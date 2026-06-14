import { baseExerciseName, bestE1RM, estimate1RM } from '../metrics';
import { exerciseLoad, trainingMaxesFromMaxes, warmupSets } from '../load';
import { displayToKg, fmtWeight, kgToDisplay } from '../units';
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

  it('gives Leg Press its own machine instructions/symbol — not barbell squat', () => {
    const info = getExerciseInfo('Leg Press');
    expect(info.emoji).toBe('🦵');
    expect(info.label.toLowerCase()).toContain('leg press');
    const text = info.instructions.join(' ').toLowerCase();
    // must NOT describe racking a barbell on the upper back
    expect(text).not.toContain('upper back');
    expect(text).not.toContain('unrack');
    expect(text).toContain('platform');
  });
});

describe('adaptive load', () => {
  const tms = trainingMaxesFromMaxes({ squat: 200, bench: 140, deadlift: 240 });

  it('derives training maxes at ~90% of 1RM', () => {
    expect(tms.squat).toBe(180);
  });
  it('computes a main-lift load from training max × percent', () => {
    const load = exerciseLoad(
      { name: 'Squat', category: 'squat', role: 'main', sets: 3, reps: 5, intensity: { percentOf1RM: 0.8, rpe: 8 } },
      tms,
    );
    expect(load).toBe(145); // round(180 × 0.8) to 2.5kg
  });
  it('returns null for accessories with no %1RM', () => {
    const load = exerciseLoad(
      { name: 'Leg Press', category: 'accessory', role: 'accessory', sets: 3, reps: 10, intensity: { rpe: 8 } },
      tms,
    );
    expect(load).toBeNull();
  });
});

describe('units', () => {
  it('passes kg through unchanged', () => {
    expect(kgToDisplay(100, 'kg')).toBe(100);
    expect(fmtWeight(100, 'kg')).toBe('100 kg');
  });
  it('converts kg → lb (rounded to 5)', () => {
    expect(kgToDisplay(100, 'lb')).toBe(220);
    expect(fmtWeight(100, 'lb')).toBe('220 lb');
  });
  it('round-trips display → kg', () => {
    expect(Math.round(displayToKg(kgToDisplay(140, 'lb'), 'lb'))).toBeGreaterThanOrEqual(138);
  });
});

describe('warm-ups', () => {
  it('ramps ascending and strictly below the top set', () => {
    const w = warmupSets(160);
    expect(w.length).toBeGreaterThan(0);
    expect(w.every((s) => s.weight < 160)).toBe(true);
    expect(w[0].weight).toBeLessThan(w[w.length - 1].weight);
  });
  it('returns none when the top set is at the bar', () => {
    expect(warmupSets(20).length).toBe(0);
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
