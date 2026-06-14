import { stubCoach, type CoachingClient } from '@/engine/coaching';
import { isModelDownloaded } from '@/lib/modelManager';
import { llamaCoach } from './llamaClient';

let _coach: CoachingClient = stubCoach;
let _modelReady = false;

/**
 * Call once on app start (async, fast — just a file-existence check).
 * If the model is already on disk the llama client is activated immediately.
 * Call again after a successful download to activate without restarting.
 */
export async function initCoach(): Promise<void> {
  _modelReady = await isModelDownloaded();
  _coach = _modelReady ? llamaCoach : stubCoach;
}

/** The active coach. Returns the offline stub until the model is downloaded. */
export function getCoach(): CoachingClient {
  return _coach;
}

/** True once the GGUF model file is present on disk. */
export function coachIsOnline(): boolean {
  return _modelReady;
}
