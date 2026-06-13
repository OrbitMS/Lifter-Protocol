import type { ProgramType } from '@/types/program';

export interface ProgramMeta {
  type: ProgramType;
  title: string;
  focus: string;
  freq: string; // display string
  length: 'medium' | 'medium-long';
  bestFor: string;
  /** default BB/PL ratio used to seed the customization slider */
  defaultBbToPlRatio: number;
}

/** The three premium program offerings shown on the selection screen (step 4). */
export const PROGRAMS: ProgramMeta[] = [
  {
    type: 'power-combo',
    title: 'Power Combo',
    focus:
      'Combines powerlifting-focused training for strength phases and powerbuilding for hypertrophy phases.',
    freq: '3–6×/week',
    length: 'medium',
    bestFor: 'Lifters who want both strength and size, periodized across phases.',
    defaultBbToPlRatio: 40,
  },
  {
    type: 'powerbuilding',
    title: 'Powerbuilding',
    focus:
      'Build muscle while improving squat, bench and deadlift. More focus on accessories.',
    freq: '3–6×/week',
    length: 'medium-long',
    bestFor: 'Those who are more flexible with time.',
    defaultBbToPlRatio: 60,
  },
  {
    type: 'powerlifting',
    title: 'Powerlifting',
    focus:
      'Get stronger in squat, bench and deadlift. Less focus on accessories.',
    freq: '3–6×/week',
    length: 'medium',
    bestFor: 'Those restricted by time.',
    defaultBbToPlRatio: 15,
  },
];

export const getProgramMeta = (type: ProgramType): ProgramMeta =>
  PROGRAMS.find((p) => p.type === type)!;
