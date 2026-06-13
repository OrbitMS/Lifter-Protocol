import type { Session, WeeklyCheckIn } from '@/types/program';
import type { UserProfile } from '@/types/profile';

/**
 * LLM coaching layer — kept strictly SEPARATE from the load math.
 *
 * The deterministic engine (generator / autoregulation) owns all sets, reps and
 * loads. The LLM only produces natural-language cues, encouragement and check-in
 * feedback. It never prescribes weights. This boundary keeps prescription safe,
 * testable and cheap, while still giving the app a "coach in your pocket" feel.
 *
 * Recommended model: claude-haiku-4-5 for short cues (fast/cheap),
 * claude-sonnet-4-6 for the weekly narrative summary.
 */

export interface CoachingClient {
  complete(system: string, user: string): Promise<string>;
}

const SYSTEM_PROMPT = `You are a strength coach inside a powerlifting/powerbuilding app.
You give concise, encouraging, technically-sound cues. You NEVER prescribe specific
weights, sets, or reps — those come from the program engine. Keep responses under 60 words.`;

export async function sessionCue(
  client: CoachingClient,
  session: Session,
  profile: UserProfile,
): Promise<string> {
  const lifts = session.exercises.map((e) => e.name).join(', ');
  const user = `Today's session: "${session.label}" with ${lifts}. Athlete has ${
    profile.history?.yearsTraining ?? '?'
  } years experience. Give one focusing cue for the main lift.`;
  return client.complete(SYSTEM_PROMPT, user);
}

export async function weeklyFeedback(
  client: CoachingClient,
  checkIn: WeeklyCheckIn,
  adjustmentReason: string,
): Promise<string> {
  const user = `Weekly check-in — sleep:${checkIn.sleepQuality}/5, soreness:${checkIn.soreness}/5, motivation:${checkIn.motivation}/5. The engine decided: "${adjustmentReason}". Explain this to the athlete supportively.`;
  return client.complete(SYSTEM_PROMPT, user);
}

/** Offline fallback so the app works without network / before wiring an API key. */
export const stubCoach: CoachingClient = {
  async complete(_system, _user) {
    return 'Brace hard, control the descent, and drive through the full range. You’ve got this.';
  },
};
