import { bmr, computeTargets } from '../nutrition';

describe('nutrition targets', () => {
  test('Mifflin–St Jeor BMR matches known values', () => {
    // 80kg, 180cm, 30y male => 10*80 + 6.25*180 - 5*30 + 5 = 1780
    expect(bmr(80, 180, 30, 'male')).toBe(1780);
    // female constant -161 => 1614
    expect(bmr(80, 180, 30, 'female')).toBe(1614);
    // other = midpoint (-78)
    expect(bmr(80, 180, 30, 'other')).toBe(1697);
  });

  test('goal adjusts calories around maintenance', () => {
    const base = { weightKg: 80, heightCm: 180, age: 30, gender: 'male' as const, jobActivity: 2, daysPerWeek: 4 };
    const lose = computeTargets({ ...base, goal: 'lose' });
    const maintain = computeTargets({ ...base, goal: 'maintain' });
    const gain = computeTargets({ ...base, goal: 'gain' });
    expect(lose.calories).toBeLessThan(maintain.calories);
    expect(gain.calories).toBeGreaterThan(maintain.calories);
    expect(maintain.calories).toBe(Math.round((maintain.tdee / 10)) * 10);
  });

  test('macros are protein-first and sum back to calories (approximately)', () => {
    const t = computeTargets({ weightKg: 80, heightCm: 180, age: 30, gender: 'male', jobActivity: 3, daysPerWeek: 4, goal: 'maintain' });
    expect(t.protein).toBe(Math.round(80 * 1.8)); // 144g
    const fromMacros = t.protein * 4 + t.carbs * 4 + t.fat * 9;
    expect(Math.abs(fromMacros - t.calories)).toBeLessThanOrEqual(12); // rounding slack
  });

  test('higher activity raises TDEE', () => {
    const sedentary = computeTargets({ weightKg: 80, heightCm: 180, age: 30, gender: 'male', jobActivity: 1, daysPerWeek: 3, goal: 'maintain' });
    const active = computeTargets({ weightKg: 80, heightCm: 180, age: 30, gender: 'male', jobActivity: 5, daysPerWeek: 6, goal: 'maintain' });
    expect(active.tdee).toBeGreaterThan(sedentary.tdee);
  });
});
