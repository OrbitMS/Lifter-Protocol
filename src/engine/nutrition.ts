// Nutrition targets — calorie & macro math derived from the onboarding profile.
//
// Deliberately deterministic and transparent (no LLM): BMR via Mifflin–St Jeor,
// an activity factor from job activity + training frequency, a goal adjustment,
// then macros split protein-first (per kg bodyweight), fat as a % of calories,
// carbs as the remainder.

import type { DietGoal, Gender } from '@/types/profile';

export interface NutritionInput {
  weightKg: number;
  heightCm: number;
  age: number;
  gender: Gender;
  /** 1 = sedentary job … 5 = heavy labor (RecoveryProfile.jobActivity) */
  jobActivity?: number;
  /** training sessions per week (ProgramConfig.daysPerWeek) */
  daysPerWeek?: number;
  goal: DietGoal;
}

export interface MacroTargets {
  calories: number;
  protein: number; // grams
  carbs: number; // grams
  fat: number; // grams
  bmr: number;
  tdee: number;
  activityFactor: number;
}

/** Mifflin–St Jeor BMR (kcal/day). 'other' averages the male/female constants. */
export function bmr(weightKg: number, heightCm: number, age: number, gender: Gender): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  const constant = gender === 'male' ? 5 : gender === 'female' ? -161 : -78; // 'other' = midpoint
  return base + constant;
}

// Standard activity multipliers keyed by job activity (sedentary → very active).
const JOB_FACTOR: Record<number, number> = { 1: 1.2, 2: 1.375, 3: 1.55, 4: 1.725, 5: 1.9 };

const GOAL_ADJUST: Record<DietGoal, number> = { lose: 0.8, maintain: 1.0, gain: 1.1 };
// Protein grams per kg bodyweight — higher in a deficit to protect muscle.
const PROTEIN_PER_KG: Record<DietGoal, number> = { lose: 2.2, maintain: 1.8, gain: 2.0 };

export function computeTargets(input: NutritionInput): MacroTargets {
  const { weightKg, heightCm, age, gender, goal } = input;
  const job = Math.min(5, Math.max(1, Math.round(input.jobActivity ?? 2)));
  const days = Math.min(7, Math.max(0, input.daysPerWeek ?? 3));

  const restingBmr = bmr(weightKg, heightCm, age, gender);
  // job baseline + a small bump for training volume (~0.015 per session/week)
  const activityFactor = Math.round((JOB_FACTOR[job] + days * 0.015) * 100) / 100;
  const tdee = restingBmr * activityFactor;
  const calories = Math.round((tdee * GOAL_ADJUST[goal]) / 10) * 10;

  const protein = Math.round(weightKg * PROTEIN_PER_KG[goal]);
  const fat = Math.round((calories * 0.25) / 9); // 25% of calories from fat
  const carbCals = calories - protein * 4 - fat * 9;
  const carbs = Math.max(0, Math.round(carbCals / 4));

  return {
    calories,
    protein,
    carbs,
    fat,
    bmr: Math.round(restingBmr),
    tdee: Math.round(tdee),
    activityFactor,
  };
}

export const GOAL_LABEL: Record<DietGoal, string> = {
  lose: 'Lose weight',
  maintain: 'Maintain',
  gain: 'Gain weight',
};
