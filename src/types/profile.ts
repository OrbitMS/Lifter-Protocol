// User profile — captured during onboarding (steps 1–6).

export type Units = 'metric' | 'imperial';
export type Gender = 'male' | 'female' | 'other';

/** Step 1 — Basics */
export interface Basics {
  /** optional display name for the profile */
  name?: string;
  gender: Gender;
  age: number;
  /** stored in cm regardless of display units */
  heightCm: number;
  /** stored in kg regardless of display units */
  weightKg: number;
  units: Units;
}

export type FrequencyPreference = 'low' | 'high';

/** Step 2 — Training history. Maxes are best estimates of a true 1RM. */
export interface TrainingHistory {
  yearsTraining: number;
  frequencyPreference: FrequencyPreference;
  maxes: { squat: number; bench: number; deadlift: number };
}

// Step 3 — Recovery profile. Each axis is a 1–5 scale.
export type JobActivity = 1 | 2 | 3 | 4 | 5; // 1 = sedentary, 5 = heavy labor
export type LifeStress = 1 | 2 | 3 | 4 | 5; // 1 = none, 5 = very high
export type RecoverySpeed = 1 | 2 | 3 | 4 | 5; // 1 = slow, 5 = very fast

export interface RecoveryProfile {
  jobActivity: JobActivity;
  lifeStress: LifeStress;
  recoverySpeed: RecoverySpeed;
  sleepHours: number;
  /** derived by the engine; see engine/recovery.ts */
  recoveryIndex?: number;
  recoveryBucket?: 'low' | 'moderate' | 'high';
}

export type DietGoal = 'lose' | 'maintain' | 'gain';

/** Step 5 — Nutrition & goals */
export interface Nutrition {
  tracksMacros: boolean;
  dietGoal: DietGoal;
}

export interface UserProfile {
  basics?: Basics;
  history?: TrainingHistory;
  recovery?: RecoveryProfile;
  nutrition?: Nutrition;
}
