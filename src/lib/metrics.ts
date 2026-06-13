/** Estimated 1RM via the Epley formula. reps=1 returns the weight itself. */
export function estimate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return weight;
  return Math.round(weight * (1 + reps / 30));
}

/** Best estimated 1RM across a list of sets. */
export function bestE1RM(sets: { weight: number; reps: number }[]): number {
  return sets.reduce((best, s) => Math.max(best, estimate1RM(s.weight, s.reps)), 0);
}

/**
 * Strip the load hint the generator appends to main/variation lifts
 * ("Squat — 140kg" → "Squat") so logs and exercise info key on the base name.
 */
export function baseExerciseName(name: string): string {
  return name.split(' — ')[0].trim();
}
