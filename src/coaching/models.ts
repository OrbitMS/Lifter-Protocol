// Claude model IDs used by the coaching layer.
//
// Default to the most capable model. Cues are short and latency-sensitive, so
// if cost/latency at scale becomes a concern you can switch CUE_MODEL to
// `claude-haiku-4-5` — that's a deliberate downgrade decision, not a default.
export const CUE_MODEL = 'claude-opus-4-8';
export const SUMMARY_MODEL = 'claude-opus-4-8';

// Cues/feedback are <60 words; keep the output ceiling tight.
export const MAX_TOKENS = 256;

// Conversational coach (Q&A) — answers run longer than cues, so allow more room.
export const CHAT_MODEL = 'claude-opus-4-8';
export const CHAT_MAX_TOKENS = 700;
