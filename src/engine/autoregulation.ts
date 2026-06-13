import type { SessionLog, WeeklyCheckIn } from '@/types/program';

export interface AdjustmentResult {
  /** multiply next week's top-set load by this */
  loadMultiplier: number;
  /** add/subtract sets on main work */
  setDelta: number;
  reason: string;
}

/**
 * Per-session auto-regulation: compare logged RPE against the prescribed top-set
 * RPE and decide how to move load next time.
 *   - well below target (easy) → push load up
 *   - at/above target (grindy) → hold or back off
 */
export function adjustFromSession(
  log: SessionLog,
  targetRpe: number,
): AdjustmentResult {
  const topSets = log.exercises
    .flatMap((e) => e.sets)
    .filter((s) => s.completed && s.rpe != null);

  if (topSets.length === 0) {
    return { loadMultiplier: 1, setDelta: 0, reason: 'No RPE logged — holding.' };
  }

  const avgRpe =
    topSets.reduce((sum, s) => sum + (s.rpe ?? 0), 0) / topSets.length;
  const delta = targetRpe - avgRpe; // positive = easier than planned

  if (delta >= 1.5) {
    return { loadMultiplier: 1.035, setDelta: 0, reason: 'Sets felt easy — increasing load.' };
  }
  if (delta >= 0.5) {
    return { loadMultiplier: 1.02, setDelta: 0, reason: 'On track — small load bump.' };
  }
  if (delta <= -1) {
    return { loadMultiplier: 0.95, setDelta: -1, reason: 'Overshot RPE — backing off load & volume.' };
  }
  return { loadMultiplier: 1, setDelta: 0, reason: 'On target — holding load.' };
}

/**
 * Weekly check-in fatigue management. Poor sleep / high soreness / low
 * motivation trims next week's volume; strong recovery permits a bump.
 */
export function adjustFromCheckIn(checkIn: WeeklyCheckIn): AdjustmentResult {
  // 1 (bad) .. 5 (good) for sleep & motivation; soreness inverted (5 = very sore)
  const recoveryScore =
    checkIn.sleepQuality + checkIn.motivation + (6 - checkIn.soreness);
  // range 3..15

  if (recoveryScore <= 7) {
    return { loadMultiplier: 0.97, setDelta: -1, reason: 'Recovery markers low — reducing volume.' };
  }
  if (recoveryScore >= 13) {
    return { loadMultiplier: 1, setDelta: +1, reason: 'Recovering well — adding a set.' };
  }
  return { loadMultiplier: 1, setDelta: 0, reason: 'Recovery normal — no change.' };
}
