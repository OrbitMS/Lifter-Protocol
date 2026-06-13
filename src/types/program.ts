// Program configuration (step 4 + 6) and the generated program tree.

export type ProgramType = 'power-combo' | 'powerbuilding' | 'powerlifting';

export type Weekday =
  | 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export type UpperFocus = 'chest' | 'back' | 'shoulders' | 'arms';
export type LowerFocus = 'quads' | 'hamstrings' | 'glutes';

/** Step 4 + step 6 — everything needed to build a program. */
export interface ProgramConfig {
  type: ProgramType;
  daysPerWeek: number; // 3–6
  trainingDays: Weekday[];
  /** powerbuilding split: % bodybuilding vs powerlifting (0–100). 30 = 30% BB / 70% PL */
  bbToPlRatio: number;
  upperFocus: UpperFocus[];
  lowerFocus: LowerFocus[];
}

export type PhaseName =
  | 'accumulation'
  | 'intensification'
  | 'realization'
  | 'hypertrophy'
  | 'deload';

/** Intensity is prescribed as either %1RM or a target RPE. */
export interface Intensity {
  percentOf1RM?: number; // 0–1
  rpe?: number; // 6–10
}

/** What slot an exercise fills in a session, for display grouping & ordering. */
export type ExerciseRole = 'main' | 'variation' | 'secondary' | 'accessory' | 'core';

export interface ExercisePrescription {
  name: string;
  /** main lift this slots under, for progression tracking */
  category: 'squat' | 'bench' | 'deadlift' | 'accessory';
  /** session slot — defaults to 'accessory' for legacy data */
  role?: ExerciseRole;
  sets: number;
  reps: number;
  intensity: Intensity;
}

export interface Session {
  day: Weekday;
  label: string; // e.g. "Squat Focus" / "Upper Hypertrophy"
  exercises: ExercisePrescription[];
}

export interface TrainingWeek {
  index: number; // 1-based within the block
  sessions: Session[];
}

export interface Block {
  phase: PhaseName;
  weeks: TrainingWeek[];
}

export interface Program {
  type: ProgramType;
  generatedAt: string; // ISO date
  config: ProgramConfig;
  blocks: Block[];
}

// ---- Logging (feeds auto-regulation) ----

export interface SetLog {
  weight: number;
  reps: number;
  rpe?: number;
  completed: boolean;
}

export interface ExerciseLog {
  exerciseName: string;
  sets: SetLog[];
}

export interface SessionLog {
  date: string; // ISO
  weekIndex: number;
  day: Weekday;
  exercises: ExerciseLog[];
}

/** Weekly self-report that nudges next week's volume. */
export interface WeeklyCheckIn {
  weekIndex: number;
  sleepQuality: 1 | 2 | 3 | 4 | 5;
  soreness: 1 | 2 | 3 | 4 | 5;
  motivation: 1 | 2 | 3 | 4 | 5;
}
