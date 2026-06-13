# Lifter Protocol

An adaptive powerlifting / powerbuilding training app. The
program is **generated** from an onboarding questionnaire and **auto-regulates**
week-to-week from logged RPE and recovery check-ins.

- **Engine:** rules-based periodization + RPE auto-regulation (deterministic, tested).
- **Coaching:** a separate LLM layer for natural-language cues only — it never
  prescribes loads. Swap `stubCoach` for a real Claude client (`claude-haiku-4-5`
  for cues, `claude-sonnet-4-6` for weekly summaries).
- **Platform:** React Native + Expo (Expo Router, file-based routing).

## Getting started

```bash
npm install
npm start          # then press i / a / w for iOS / Android / web
npm test           # engine unit tests
npm run typecheck
```

## Project structure

```
app/                      Expo Router screens
  index.tsx               entry → onboarding or tabs
  onboarding/             6-step wizard
    basics → history → recovery → program → nutrition → customize
  (tabs)/                 today · program · progress · profile
src/
  types/                  profile + program data model
  constants/              the 3 program definitions, theme
  store/                  zustand profile store (persisted via AsyncStorage)
  components/ui.tsx       shared dark-theme components
  engine/                 ← the IP
    recovery.ts           Recovery Index (lifestyle → volume scaling)
    periodization.ts      block-periodization templates per program type
    accessories.ts        focus-weighted accessory selection
    generator.ts          build a full program from profile + config
    autoregulation.ts     per-session RPE + weekly check-in adjustments
    coaching.ts           LLM coaching layer (kept separate from load math)
    __tests__/            engine unit tests
```

## How the engine works

1. **Recovery** — step-3 lifestyle answers fuse into a 0–1 *Recovery Index*,
   bucketed low/moderate/high. This scales set counts and caps RPE.
2. **Generation** — for the chosen program type, repeat its periodization phases;
   for each week/day assign a main lift (S/B/D) prescribed against ~90% training
   max, then layer accessories weighted by the BB/PL slider and focus areas.
3. **Auto-regulation** *(Phase 2)* — logged RPE vs. target moves next week's
   load; the weekly check-in trims or adds volume.

## Coaching (Claude)

`src/engine/coaching.ts` defines the `CoachingClient` interface (`complete(system, user)`)
and the system-prompt boundary: **the LLM only produces text — never sets, reps, or loads.**
Three implementations exist:

- `stubCoach` (in `engine/coaching.ts`) — offline fallback, no network.
- `createProxyCoach()` (`src/coaching/proxyClient.ts`) — **the mobile app's path.**
  Calls the backend proxy so the API key never ships in the bundle.
- `createAnthropicCoach()` (`src/coaching/anthropicClient.ts`) — direct Anthropic
  SDK client, **server-side only.** Uses `claude-opus-4-8`, `max_tokens: 256`.

`getCoach()` (`src/coaching/index.ts`) picks the proxy when `expo.extra.coachApiUrl`
is set in `app.json`, else the stub. The Today screen uses it and falls back to a
static cue on failure.

### Running the coach backend

> ⚠️ Never instantiate `createAnthropicCoach()` inside the React Native app — the
> `ANTHROPIC_API_KEY` would be extractable from the bundle. The app talks to the
> proxy; only the proxy holds the key.

```bash
cp .env.example .env        # set ANTHROPIC_API_KEY
export ANTHROPIC_API_KEY=sk-ant-...   # or use your shell's env
npm run coach:server        # serves POST /coach on :8787
```

`app.json → expo.extra.coachApiUrl` points the app at it (default `http://localhost:8787`;
use your machine's LAN IP for a physical device). The reference server in `server/index.ts`
is intentionally thin — add auth, rate limiting, and per-user quotas before shipping.

## Roadmap

- **Phase 1 (this scaffold):** onboarding, all 3 programs, generation, logging UI.
- **Phase 2:** RPE auto-regulation, e1RM charts, deload/plateau detection.
- **Phase 3:** nutrition macro targets, subscription gating (RevenueCat).
- **Phase 4:** coaching tips, exercise video library, Health sync.
```
