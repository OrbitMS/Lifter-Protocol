import { computeRecoveryIndex, bucketRecovery } from '../recovery';
import { generateProgram } from '../generator';
import { adjustFromSession, adjustForLift } from '../autoregulation';
import type { RecoveryProfile, TrainingHistory, UserProfile, DietGoal } from '@/types/profile';
import type { ProgramConfig, ProgramType, SessionLog } from '@/types/program';

const history: TrainingHistory = {
  yearsTraining: 3,
  frequencyPreference: 'high',
  maxes: { squat: 180, bench: 120, deadlift: 220 },
};

const goodRecovery: RecoveryProfile = { jobActivity: 1, lifeStress: 1, recoverySpeed: 5, sleepHours: 8 };
const poorRecovery: RecoveryProfile = { jobActivity: 5, lifeStress: 5, recoverySpeed: 1, sleepHours: 5 };

const config: ProgramConfig = {
  type: 'power-combo',
  daysPerWeek: 4,
  trainingDays: ['mon', 'tue', 'thu', 'fri'],
  bbToPlRatio: 40,
  upperFocus: ['back', 'chest'],
  lowerFocus: ['quads', 'hamstrings'],
};

const prof = (recovery: RecoveryProfile, extra: Partial<UserProfile> = {}): UserProfile => ({
  history,
  recovery,
  ...extra,
});

describe('recovery index', () => {
  it('rates good lifestyle higher than poor', () => {
    expect(computeRecoveryIndex(goodRecovery)).toBeGreaterThan(computeRecoveryIndex(poorRecovery));
  });
  it('buckets extremes correctly', () => {
    expect(bucketRecovery(computeRecoveryIndex(goodRecovery))).toBe('high');
    expect(bucketRecovery(computeRecoveryIndex(poorRecovery))).toBe('low');
  });
});

describe('program generation', () => {
  it('builds blocks with sessions for each training day', () => {
    const program = generateProgram(prof(goodRecovery), config);
    expect(program.blocks.length).toBeGreaterThan(0);
    const week1 = program.blocks[0].weeks[0];
    expect(week1.sessions).toHaveLength(config.daysPerWeek);
    expect(week1.sessions[0].exercises[0].category).toBe('squat');
  });

  it('gives lower-recovery athletes fewer sets than high-recovery', () => {
    const high = generateProgram(prof(goodRecovery), config);
    const low = generateProgram(prof(poorRecovery), config);
    const highSets = high.blocks[0].weeks[0].sessions[0].exercises[0].sets;
    const lowSets = low.blocks[0].weeks[0].sessions[0].exercises[0].sets;
    expect(lowSets).toBeLessThan(highSets);
  });

  it('builds a full session (main + support + accessories), not just the main lift', () => {
    const session = generateProgram(prof(goodRecovery), config).blocks[0].weeks[0].sessions[0];
    expect(session.exercises.length).toBeGreaterThanOrEqual(4);
    expect(session.exercises[0].role).toBe('main');
    const roles = session.exercises.map((e) => e.role);
    expect(roles).toContain('accessory');
    expect(roles.some((r) => r === 'variation' || r === 'secondary')).toBe(true);
  });

  it('honours focus areas in accessory selection', () => {
    const week = generateProgram(prof(goodRecovery), {
      ...config,
      type: 'powerbuilding',
      bbToPlRatio: 70,
      trainingDays: ['mon', 'tue', 'thu'],
      daysPerWeek: 3,
      upperFocus: ['arms'],
    }).blocks[0].weeks[0];
    const benchDay = week.sessions[1];
    expect(benchDay.exercises[0].category).toBe('bench');
    expect(/Curl|Triceps/i.test(benchDay.exercises.map((e) => e.name).join(' '))).toBe(true);
  });

  it('powerbuilding programs carry more accessories than powerlifting', () => {
    const countAcc = (type: ProgramType) => {
      const p = generateProgram(prof(goodRecovery), {
        ...config,
        type,
        bbToPlRatio: type === 'powerbuilding' ? 70 : 10,
      });
      return p.blocks[0].weeks[0].sessions[0].exercises.filter((e) => e.role === 'accessory').length;
    };
    expect(countAcc('powerbuilding')).toBeGreaterThan(countAcc('powerlifting'));
  });
});

describe('questionnaire is fully applied', () => {
  it('competition prep adds a peaking (realization) phase to powerbuilding', () => {
    const pb: ProgramConfig = { ...config, type: 'powerbuilding', bbToPlRatio: 60 };
    const normal = generateProgram(prof(goodRecovery), pb);
    const comp = generateProgram(prof(goodRecovery), { ...pb, competing: true });
    expect(normal.blocks.map((b) => b.phase)).not.toContain('realization');
    expect(comp.blocks.map((b) => b.phase)).toContain('realization');
  });

  it('a bulking diet programs more accessory volume than a cut', () => {
    const acc = (dietGoal: DietGoal) => {
      const p = generateProgram(prof(goodRecovery, { nutrition: { tracksMacros: false, dietGoal } }), {
        ...config,
        type: 'powerbuilding',
        bbToPlRatio: 60,
      });
      return p.blocks[0].weeks[0].sessions[0].exercises.filter((e) => e.role === 'accessory').length;
    };
    expect(acc('gain')).toBeGreaterThan(acc('lose'));
  });

  it('beginners are capped at a lower RPE than advanced lifters', () => {
    const novice = generateProgram(prof(goodRecovery, { history: { ...history, yearsTraining: 1 } }), config);
    const expert = generateProgram(prof(goodRecovery, { history: { ...history, yearsTraining: 8 } }), config);
    const rpe = (p: ReturnType<typeof generateProgram>) =>
      p.blocks[0].weeks[0].sessions[0].exercises[0].intensity.rpe ?? 0;
    expect(rpe(novice)).toBeLessThan(rpe(expert));
  });
});

describe('auto-regulation', () => {
  it('raises load when sets are logged easy', () => {
    const log: SessionLog = {
      date: new Date().toISOString(),
      weekIndex: 1,
      day: 'mon',
      exercises: [{ exerciseName: 'Squat', sets: [{ weight: 140, reps: 5, rpe: 7, completed: true }] }],
    };
    expect(adjustFromSession(log, 9).loadMultiplier).toBeGreaterThan(1);
  });

  it('adjustForLift bumps an easy lift and backs off a grindy one', () => {
    expect(adjustForLift([{ weight: 140, reps: 5, rpe: 7, completed: true }], 9).loadMultiplier).toBeGreaterThan(1);
    expect(adjustForLift([{ weight: 160, reps: 5, rpe: 10, completed: true }], 8).loadMultiplier).toBeLessThan(1);
  });
});
