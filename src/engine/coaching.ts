import type { PhaseName, Program, Session } from '@/types/program';
import type { UserProfile } from '@/types/profile';
import { baseExerciseName } from '@/lib/metrics';

/**
 * LLM coaching layer — kept strictly SEPARATE from the load math.
 *
 * The deterministic engine (generator / autoregulation) owns all sets, reps and
 * loads. The LLM only produces natural-language cues, encouragement and check-in
 * feedback. It never prescribes weights. This boundary keeps prescription safe,
 * testable and cheap, while still giving the app a "coach in your pocket" feel.
 *
 * Advice is tailored to the athlete's profile AND where they are in the
 * macrocycle (phase + week), so a peaking week reads differently from an
 * accumulation week. See localCue() for the offline-deterministic version.
 */

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CoachingClient {
  /** one-shot completion (cues, weekly feedback) */
  complete(system: string, user: string): Promise<string>;
  /** multi-turn conversation (the "ask your coach" chat) */
  chat(system: string, messages: ChatMessage[]): Promise<string>;
}

const CHAT_SYSTEM = `You are an expert strength & conditioning coach embedded in a powerlifting/powerbuilding app, in conversation with the athlete.
Use their profile, training phase and recent logged performance (provided below) to give specific, grounded answers — e.g. explain why a lift may be stalling and what to adjust in effort, technique, recovery or nutrition.
You do NOT prescribe exact weights, sets or reps — the program engine owns those numbers. You may discuss trends, RPE/effort, fatigue, technique, recovery and nutrition.
Be concise and practical: at most 2–4 short paragraphs, plain language, reference their actual numbers when relevant.`;

/** Builds the system prompt for the conversational coach from athlete context. */
export function chatSystemPrompt(args: {
  profileLine: string;
  cycleLine?: string;
  trainingSummary?: string;
}): string {
  return [
    CHAT_SYSTEM,
    `\nATHLETE: ${args.profileLine || 'unknown'}.`,
    args.cycleLine ? `\n${args.cycleLine}` : '',
    args.trainingSummary
      ? `\nRECENT TRAINING (estimated 1RM trend per lift):\n${args.trainingSummary}`
      : '\nThe athlete has not logged any sets yet.',
  ]
    .filter(Boolean)
    .join('\n');
}

const SYSTEM_PROMPT = `You are an expert strength & conditioning coach embedded in a powerlifting/powerbuilding app.
Give specific, technically-sound, encouraging guidance tailored to the athlete's experience, recovery and — crucially — the training phase they're in (a peaking week needs different advice than a hypertrophy week).
You NEVER prescribe specific weights, sets, or reps — the program engine owns those. Focus on intent, technique, effort/RPE management and recovery.
Respond in 2–3 short sentences, under 70 words. No preamble, no headings.`;

/** What each mesocycle phase is *for* — drives phase-aware advice. */
export const PHASE_INTENT: Record<PhaseName, string> = {
  accumulation:
    'building work capacity and volume; loads are moderate — prioritise crisp technique, full range, and accumulating quality reps',
  intensification:
    'handling heavier loads at lower reps; sharpen technique under load, stay tight, and start managing fatigue',
  realization:
    'peaking — expressing strength near maximal loads; keep accessories minimal, rest fully, and stay fresh and confident',
  hypertrophy:
    'maximising muscle growth; chase a strong mind-muscle connection, control the eccentric, and push accessories close to failure',
  deload:
    'recovery — reduced load and volume; move well, leave reps in the tank, and let accumulated fatigue dissipate',
};

export interface CoachContext {
  session: Session;
  profile: UserProfile;
  program?: Program;
  /** position in the macrocycle */
  blockIndex?: number;
  weekIndex?: number;
}

function phaseOf(ctx: CoachContext): { phase: PhaseName; week: number; weeks: number; nextPhase?: PhaseName } | null {
  const { program, blockIndex = 0, weekIndex = 0 } = ctx;
  const block = program?.blocks[blockIndex];
  if (!block) return null;
  return {
    phase: block.phase,
    week: weekIndex + 1,
    weeks: block.weeks.length,
    nextPhase: program?.blocks[blockIndex + 1]?.phase,
  };
}

function mainLift(ctx: CoachContext): string {
  const m = ctx.session.exercises.find((e) => e.role === 'main') ?? ctx.session.exercises[0];
  return m ? baseExerciseName(m.name) : 'your main lift';
}

export async function sessionCue(client: CoachingClient, ctx: CoachContext): Promise<string> {
  const { profile, session } = ctx;
  const cyc = phaseOf(ctx);
  const lifts = session.exercises.map((e) => baseExerciseName(e.name)).join(', ');

  const profileLine = [
    profile.history?.yearsTraining != null ? `${profile.history.yearsTraining}y experience` : null,
    profile.recovery?.recoveryBucket ? `${profile.recovery.recoveryBucket} recovery capacity` : null,
    profile.nutrition?.dietGoal ? `goal: ${profile.nutrition.dietGoal} weight` : null,
    ctx.program?.type ? `program: ${ctx.program.type}` : null,
  ].filter(Boolean).join(', ');

  const cycleLine = cyc
    ? `Macrocycle: ${cyc.phase} phase, week ${cyc.week} of ${cyc.weeks}${cyc.nextPhase ? ` (next: ${cyc.nextPhase})` : ''}. This phase is about ${PHASE_INTENT[cyc.phase]}.`
    : '';

  const user = `Athlete: ${profileLine || 'unknown'}.
${cycleLine}
Today's session "${session.label}" — main lift ${mainLift(ctx)}; full list: ${lifts}.
Give phase-appropriate coaching for today: what to focus on, how hard to push (RPE/effort intent for this phase), and one technique or recovery cue. Tailor it to the athlete above.`;

  return client.complete(SYSTEM_PROMPT, user);
}

export async function weeklyFeedback(
  client: CoachingClient,
  args: { sleepQuality: number; soreness: number; motivation: number; adjustmentReason: string; phase?: PhaseName },
): Promise<string> {
  const user = `Weekly check-in — sleep:${args.sleepQuality}/5, soreness:${args.soreness}/5, motivation:${args.motivation}/5${
    args.phase ? `, current phase: ${args.phase}` : ''
  }. The engine decided: "${args.adjustmentReason}". Explain this supportively and what it means for the week ahead.`;
  return client.complete(SYSTEM_PROMPT, user);
}

/**
 * Deterministic, phase-aware fallback used when no LLM backend is reachable.
 * Still tailored to the athlete and their place in the macrocycle.
 */
export function localCue(ctx: CoachContext): string {
  const lift = mainLift(ctx);
  const cyc = phaseOf(ctx);
  const bucket = ctx.profile.recovery?.recoveryBucket;
  const recovery =
    bucket === 'low' ? ' Recovery is running low — keep a rep in reserve and nail your warm-up.'
    : bucket === 'high' ? ' Recovery is strong — you can attack the top sets with confidence.'
    : '';

  if (!cyc) {
    return `Focus on crisp ${lift} technique today — brace hard, control the descent, and drive with intent.${recovery}`;
  }
  switch (cyc.phase) {
    case 'accumulation':
      return `Week ${cyc.week}/${cyc.weeks} of accumulation: chase clean, repeatable ${lift} reps and full range — volume is the goal, not grinding.${recovery}`;
    case 'intensification':
      return `Intensification week ${cyc.week}/${cyc.weeks}: loads climb on ${lift}. Stay tight, own the technique under heavier weight, and respect rest between sets.${recovery}`;
    case 'realization':
      return `Peak week — express your ${lift} strength. Be confident and explosive on the top set, keep everything else minimal, and stay fresh.${recovery}`;
    case 'hypertrophy':
      return `Hypertrophy block: on accessories chase a strong pump and control the eccentric, pushing close to failure. Keep ${lift} sharp.${recovery}`;
    case 'deload':
      return `Deload week — leave plenty in the tank on ${lift}, move smoothly, and let fatigue clear so you come back stronger.${recovery}`;
    default:
      return `Train ${lift} with intent today — brace, control, and drive.${recovery}`;
  }
}

/** One-line athlete summary for prompts (profile + lifts + goal). */
export function athleteSummary(profile: UserProfile, programType?: string): string {
  const b = profile.basics;
  const m = profile.history?.maxes;
  return [
    b ? `${b.age}y ${b.gender}, ${b.weightKg}kg` : null,
    profile.history?.yearsTraining != null ? `${profile.history.yearsTraining}y training` : null,
    m ? `1RMs S/B/D ${m.squat}/${m.bench}/${m.deadlift}kg` : null,
    profile.recovery?.recoveryBucket ? `${profile.recovery.recoveryBucket} recovery` : null,
    profile.nutrition?.dietGoal ? `goal: ${profile.nutrition.dietGoal} weight` : null,
    programType ? `program: ${programType}` : null,
  ]
    .filter(Boolean)
    .join(', ');
}

/** Offline fallback client (used when no coach backend URL is configured). */
export const stubCoach: CoachingClient = {
  async complete(_system, _user) {
    return 'Brace hard, control the descent, and drive through the full range. You’ve got this.';
  },
  async chat(_system, _messages) {
    return "I can't reach the AI coach right now (offline). In general, a stall usually traces to one of: not enough recovery (sleep/stress), creeping fatigue, protein/calories below target, or technique breaking down under load. Connect a coach backend in Settings for answers tailored to your logged numbers.";
  },
};
