import type { RecoveryProfile } from '@/types/profile';

/**
 * Recovery Index — fuses the four lifestyle answers from onboarding step 3 into
 * a single 0–1 score that scales training volume & intensity ceilings.
 *
 * Higher index = can tolerate more work.
 *   sleep        ↑ good
 *   recoverySpeed↑ good
 *   lifeStress   ↑ bad  (inverted)
 *   jobActivity  ↑ bad  (physical job eats into recovery; inverted)
 */
const WEIGHTS = {
  sleep: 0.35,
  recoverySpeed: 0.3,
  stress: 0.2,
  job: 0.15,
};

/** Normalize sleep hours to 0–1, plateauing at ~8h. */
function normalizeSleep(hours: number): number {
  const clamped = Math.max(4, Math.min(9, hours));
  return (clamped - 4) / (9 - 4);
}

/** 1–5 scale → 0–1. */
const scale5 = (v: number) => (Math.max(1, Math.min(5, v)) - 1) / 4;

export function computeRecoveryIndex(r: RecoveryProfile): number {
  const sleep = normalizeSleep(r.sleepHours);
  const recoverySpeed = scale5(r.recoverySpeed);
  const stress = 1 - scale5(r.lifeStress); // invert
  const job = 1 - scale5(r.jobActivity); // invert

  return (
    WEIGHTS.sleep * sleep +
    WEIGHTS.recoverySpeed * recoverySpeed +
    WEIGHTS.stress * stress +
    WEIGHTS.job * job
  );
}

export type RecoveryBucket = 'low' | 'moderate' | 'high';

export function bucketRecovery(index: number): RecoveryBucket {
  if (index < 0.4) return 'low';
  if (index < 0.7) return 'moderate';
  return 'high';
}

/** Set-count modifier applied per exercise based on recovery capacity. */
export function recoveryVolumeModifier(bucket: RecoveryBucket): number {
  switch (bucket) {
    case 'low':
      return -1;
    case 'high':
      return +1;
    default:
      return 0;
  }
}

/** Hard RPE ceiling so low-recovery athletes don't grind to failure. */
export function recoveryRpeCeiling(bucket: RecoveryBucket): number {
  switch (bucket) {
    case 'low':
      return 8;
    case 'moderate':
      return 9;
    case 'high':
      return 10;
  }
}

export function enrichRecovery(r: RecoveryProfile): RecoveryProfile {
  const recoveryIndex = computeRecoveryIndex(r);
  return { ...r, recoveryIndex, recoveryBucket: bucketRecovery(recoveryIndex) };
}
