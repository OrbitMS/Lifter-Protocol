import { computeRecoveryIndex, bucketRecovery } from '../recovery';
import { generateProgram } from '../generator';
import { adjustFromSession } from '../autoregulation';
import type { RecoveryProfile, TrainingHistory } from '@/types/profile';
import type { ProgramConfig, SessionLog } from '@/types/program';

const history: TrainingHistory = {
  yearsTraining: 3,
  frequencyPreference: 'high',
  maxes: { squat: 180, bench: 120, deadlift: 220 },
};

const goodRecovery: RecoveryProfile = {
  jobActivity: 1,
  lifeStress: 1,
  recoverySpeed: 5,
  sleepHours: 8,
};

const poorRecovery: RecoveryProfile = {
  jobActivity: 5,
  lifeStress: 5,
  recoverySpeed: 1,
  sleepHours: 5,
};

const config: ProgramConfig = {
  type: 'power-combo',
  daysPerWeek: 4,
  trainingDays: ['mon', 'tue', 'thu', 'fri'],
  bbToPlRatio: 40,
  upperFocus: ['back', 'chest'],
  lowerFocus: ['quads', 'hamstrings'],
};

describe('recovery index', () => {
  it('rates good lifestyle higher than poor', () => {
    expect(computeRecoveryIndex(goodRecovery)).toBeGreaterThan(
      computeRecoveryIndex(poorRecovery),
    );
  });
  it('buckets extremes correctly', () => {
    expect(bucketRecovery(computeRecoveryIndex(goodRecovery))).toBe('high');
    expect(bucketRecovery(computeRecoveryIndex(poorRecovery))).toBe('low');
  });
});

describe('program generation', () => {
  it('builds blocks with sessions for each training day', () => {
    const program = generateProgram(history, goodRecovery, config);
    expect(program.blocks.length).toBeGreaterThan(0);
    const week1 = program.blocks[0].weeks[0];
    expect(week1.sessions).toHaveLength(config.daysPerWeek);
    expect(week1.sessions[0].exercises[0].category).toBe('squat');
  });

  it('gives lower-recovery athletes fewer sets than high-recovery', () => {
    const high = generateProgram(history, goodRecovery, config);
    const low = generateProgram(history, poorRecovery, config);
    const highSets = high.blocks[0].weeks[0].sessions[0].exercises[0].sets;
    const lowSets = low.blocks[0].weeks[0].sessions[0].exercises[0].sets;
    expect(lowSets).toBeLessThan(highSets);
  });

  it('builds a full session (main + support + accessories), not just the main lift', () => {
    const program = generateProgram(history, goodRecovery, config);
    const session = program.blocks[0].weeks[0].sessions[0];
    // main lift + variation/secondary + accessories + core
    expect(session.exercises.length).toBeGreaterThanOrEqual(4);
    expect(session.exercises[0].role).toBe('main');
    const roles = session.exercises.map((e) => e.role);
    expect(roles).toContain('accessory');
    // non-deload sessions carry a variation or a secondary compound
    expect(roles.some((r) => r === 'variation' || r === 'secondary')).toBe(true);
  });

  it('honours focus areas in accessory selection', () => {
    const week = generateProgram(history, goodRecovery, {
      ...config,
      type: 'powerbuilding',
      bbToPlRatio: 70,
      trainingDays: ['mon', 'tue', 'thu'],
      daysPerWeek: 3,
      upperFocus: ['arms'],
    }).blocks[0].weeks[0];
    // day index 1 is the bench (upper) session
    const benchDay = week.sessions[1];
    expect(benchDay.exercises[0].category).toBe('bench');
    const names = benchDay.exercises.map((e) => e.name).join(' ');
    // an arms-focused upper day should program arm work
    expect(/Curl|Triceps/i.test(names)).toBe(true);
  });

  it('powerbuilding programs carry more accessories than powerlifting', () => {
    const countAcc = (type: 'powerlifting' | 'powerbuilding') => {
      const p = generateProgram(history, goodRecovery, {
        ...config,
        type,
        bbToPlRatio: type === 'powerbuilding' ? 70 : 10,
      });
      const s = p.blocks[0].weeks[0].sessions[0];
      return s.exercises.filter((e) => e.role === 'accessory').length;
    };
    expect(countAcc('powerbuilding')).toBeGreaterThan(countAcc('powerlifting'));
  });
});

describe('auto-regulation', () => {
  it('raises load when sets are logged easy', () => {
    const log: SessionLog = {
      date: new Date().toISOString(),
      weekIndex: 1,
      day: 'mon',
      exercises: [
        { exerciseName: 'Squat', sets: [{ weight: 140, reps: 5, rpe: 7, completed: true }] },
      ],
    };
    expect(adjustFromSession(log, 9).loadMultiplier).toBeGreaterThan(1);
  });
});
