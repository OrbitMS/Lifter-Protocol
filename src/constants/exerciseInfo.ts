import { baseExerciseName } from '@/lib/metrics';

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'horizontal-push'
  | 'vertical-push'
  | 'horizontal-pull'
  | 'vertical-pull'
  | 'lunge'
  | 'isolation'
  | 'core';

export interface PatternMeta {
  label: string;
  emoji: string;
  color: string;
  instructions: string[];
  cues: string[];
}

/** Movement-pattern defaults — every exercise resolves to one of these. */
export const PATTERNS: Record<Pattern, PatternMeta> = {
  squat: {
    label: 'Squat pattern',
    emoji: '🏋️',
    color: '#E63946',
    instructions: [
      'Set the bar on your upper back, brace your core, and unrack.',
      'Take a stance roughly shoulder-width with toes slightly out.',
      'Sit down and back, keeping knees tracking over your toes.',
      'Descend to at least parallel, then drive up through mid-foot.',
    ],
    cues: ['Big breath and brace before each rep', 'Knees out, chest up', 'Push the floor away'],
  },
  hinge: {
    label: 'Hip hinge',
    emoji: '🍑',
    color: '#2A9D8F',
    instructions: [
      'Set up with the load over mid-foot, soft knees.',
      'Push your hips back, keeping a flat, braced back.',
      'Feel the stretch in your hamstrings, then drive hips forward to stand tall.',
      'Lock out by squeezing the glutes — avoid leaning back.',
    ],
    cues: ['Hips back, not down', 'Flat back — no rounding', 'Squeeze glutes at the top'],
  },
  'horizontal-push': {
    label: 'Horizontal press',
    emoji: '💪',
    color: '#457B9D',
    instructions: [
      'Set shoulder blades back and down on the bench.',
      'Lower the load under control to the lower chest.',
      'Keep elbows tucked ~45° from the torso.',
      'Press up and slightly back to lockout.',
    ],
    cues: ['Tuck elbows, protect shoulders', 'Drive feet into the floor', 'Control the eccentric'],
  },
  'vertical-push': {
    label: 'Vertical press',
    emoji: '🙌',
    color: '#457B9D',
    instructions: [
      'Brace your core and glutes; bar/handles at shoulder height.',
      'Press overhead, moving your head slightly back then through.',
      'Lock out with the load stacked over mid-foot.',
      'Lower under control to the start.',
    ],
    cues: ['Squeeze glutes — no excessive lean', 'Head through at the top', 'Full lockout overhead'],
  },
  'horizontal-pull': {
    label: 'Horizontal pull (row)',
    emoji: '🚣',
    color: '#2A9D8F',
    instructions: [
      'Hinge or brace into position with a flat back.',
      'Pull the load toward your lower ribs/stomach.',
      'Drive your elbows back and squeeze the shoulder blades.',
      'Lower under control to a full stretch.',
    ],
    cues: ['Lead with the elbows', 'Squeeze shoulder blades', 'No torso heaving'],
  },
  'vertical-pull': {
    label: 'Vertical pull',
    emoji: '🧗',
    color: '#2A9D8F',
    instructions: [
      'Start from a dead hang or full stretch with a strong grip.',
      'Pull your elbows down toward your ribs.',
      'Bring chest toward the bar/handle; squeeze the lats.',
      'Lower under control to full extension.',
    ],
    cues: ['Pull elbows to pockets', 'Chest up to the bar', 'Control the lowering'],
  },
  lunge: {
    label: 'Single-leg / lunge',
    emoji: '🦵',
    color: '#E9C46A',
    instructions: [
      'Set up in a split or staggered stance.',
      'Lower the back/working knee under control.',
      'Keep the front shin vertical-ish and torso tall.',
      'Drive through the front foot to stand.',
    ],
    cues: ['Stay tall through the torso', 'Control the descent', 'Drive through the heel'],
  },
  isolation: {
    label: 'Isolation',
    emoji: '🎯',
    color: '#E9C46A',
    instructions: [
      'Set up so the target muscle does the work — minimal momentum.',
      'Move through a full range of motion.',
      'Pause briefly at peak contraction.',
      'Lower slowly to a full stretch.',
    ],
    cues: ['Slow and controlled', 'Full stretch and squeeze', 'No swinging'],
  },
  core: {
    label: 'Core / trunk',
    emoji: '🔥',
    color: '#F4A261',
    instructions: [
      'Brace your abs and keep the spine neutral.',
      'Move (or resist movement) under control.',
      'Exhale on the effort; avoid yanking with the hips.',
      'Keep tension on the abs throughout.',
    ],
    cues: ['Brace, don’t hold your breath', 'Control the range', 'Quality over speed'],
  },
};

export interface ExerciseInfo {
  pattern: Pattern;
  primaryMuscles: string[];
  equipment?: string;
  /** overrides the pattern default when present */
  instructions?: string[];
  cues?: string[];
}

/** Bespoke entries for the main lifts and a few key movements. */
const CATALOG: Record<string, ExerciseInfo> = {
  Squat: {
    pattern: 'squat',
    primaryMuscles: ['Quads', 'Glutes', 'Adductors'],
    equipment: 'Barbell',
    instructions: [
      'Unrack with the bar on your upper traps and take 2–3 steps back.',
      'Set a shoulder-width stance, toes slightly out, and brace hard.',
      'Break at the hips and knees together, sitting between your legs.',
      'Hit depth (hip crease below knee), then drive up keeping the bar over mid-foot.',
    ],
    cues: ['Brace 360° before unracking', 'Spread the floor with your feet', 'Stay over mid-foot'],
  },
  'Bench Press': {
    pattern: 'horizontal-push',
    primaryMuscles: ['Chest', 'Front Delts', 'Triceps'],
    equipment: 'Barbell',
    instructions: [
      'Set a slight arch, shoulder blades pinched back and down, feet planted.',
      'Grip just outside shoulder width; unrack to over your shoulders.',
      'Lower the bar to the lower chest/sternum with elbows ~45°.',
      'Press up and back to lockout over the shoulders.',
    ],
    cues: ['Pull the bar apart', 'Leg drive into the bench', 'Touch the same spot every rep'],
  },
  Deadlift: {
    pattern: 'hinge',
    primaryMuscles: ['Glutes', 'Hamstrings', 'Spinal Erectors', 'Lats'],
    equipment: 'Barbell',
    instructions: [
      'Bar over mid-foot, shins ~1 inch away. Hinge and grip just outside the legs.',
      'Drop hips, chest up, take the slack out of the bar (“pull the slack”).',
      'Brace and push the floor away, keeping the bar against your legs.',
      'Lock out by standing tall and squeezing glutes — don’t hyperextend.',
    ],
    cues: ['Pull the slack out first', 'Push the floor away', 'Bar stays on the legs'],
  },
  'Romanian Deadlift': {
    pattern: 'hinge',
    primaryMuscles: ['Hamstrings', 'Glutes'],
    equipment: 'Barbell',
    instructions: [
      'Start standing with the bar at your hips, soft knees.',
      'Push hips back, lowering the bar along your thighs.',
      'Stop when you feel a strong hamstring stretch (~mid-shin).',
      'Drive hips forward to stand tall.',
    ],
    cues: ['Hips back, bar close', 'Slight knee bend, no squatting', 'Feel the hamstrings'],
  },
  'Overhead Press': {
    pattern: 'vertical-push',
    primaryMuscles: ['Front Delts', 'Triceps', 'Upper Chest'],
    equipment: 'Barbell',
    instructions: [
      'Bar on the front delts, grip just outside shoulders, elbows slightly forward.',
      'Brace abs and glutes; press the bar straight up.',
      'Move your head back to clear the bar, then through at the top.',
      'Lock out with the bar over mid-foot; lower under control.',
    ],
    cues: ['Glutes tight, ribs down', 'Head through at lockout', 'Bar over the crown'],
  },
  'Pull-Up': {
    pattern: 'vertical-pull',
    primaryMuscles: ['Lats', 'Upper Back', 'Biceps'],
    equipment: 'Bodyweight',
    instructions: [
      'Hang from the bar with an overhand grip, shoulders active.',
      'Pull your elbows down and back, leading with the chest.',
      'Get your chin over the bar without kipping.',
      'Lower under control to a full hang.',
    ],
    cues: ['Start by depressing the shoulders', 'Chest to the bar', 'Full hang each rep'],
  },
  'Barbell Hip Thrust': {
    pattern: 'hinge',
    primaryMuscles: ['Glutes', 'Hamstrings'],
    equipment: 'Barbell',
    instructions: [
      'Upper back on a bench, bar across the hips (use a pad).',
      'Plant feet so shins are vertical at the top.',
      'Drive through your heels and thrust the hips up.',
      'Squeeze glutes hard at lockout; ribs down, chin tucked.',
    ],
    cues: ['Posterior pelvic tilt at the top', 'Chin tucked, ribs down', 'Squeeze, don’t hyperextend'],
  },
  'Bulgarian Split Squat': {
    pattern: 'lunge',
    primaryMuscles: ['Quads', 'Glutes'],
    equipment: 'Dumbbells',
    instructions: [
      'Rear foot elevated on a bench, front foot ~2 feet ahead.',
      'Lower straight down until the front thigh is about parallel.',
      'Keep most of the weight on the front foot.',
      'Drive up through the front heel.',
    ],
    cues: ['Weight in the front heel', 'Tall torso (or slight lean for glutes)', 'Control the depth'],
  },
  'Front Squat': {
    pattern: 'squat',
    primaryMuscles: ['Quads', 'Upper Back', 'Core'],
    equipment: 'Barbell',
    instructions: [
      'Rack the bar on your front delts with elbows high.',
      'Brace hard; squat down keeping the torso vertical.',
      'Keep elbows up to stop the bar tipping forward.',
      'Drive straight up out of the hole.',
    ],
    cues: ['Elbows high throughout', 'Stay upright', 'Brace the core hard'],
  },
};

/** Keyword inference for any exercise not explicitly in the catalog. */
function inferPattern(name: string): Pattern {
  const n = name.toLowerCase();
  if (/(plank|crunch|leg raise|ab |ab-|pallof|hanging|back extension|hollow)/.test(n)) return 'core';
  if (/(pull-?up|chin-?up|pulldown|lat )/.test(n)) return 'vertical-pull';
  if (/(row|face pull|straight-arm)/.test(n)) return 'horizontal-pull';
  if (/(overhead press|shoulder press|ohp|push press)/.test(n)) return 'vertical-push';
  if (/(bench|dip|chest press|fly|spoto|larsen|incline|decline)/.test(n)) return 'horizontal-push';
  if (/(deadlift|romanian|good morning|hip thrust|pull-through|kickback|reverse hyper|block pull|nordic)/.test(n)) return 'hinge';
  if (/(lunge|split squat)/.test(n)) return 'lunge';
  if (/(squat|leg press|hack)/.test(n)) return 'squat';
  if (/(curl|triceps|extension|raise|pushdown|leg extension|leg curl|calf)/.test(n)) return 'isolation';
  return 'isolation';
}

function inferMuscles(pattern: Pattern, name: string): string[] {
  const n = name.toLowerCase();
  if (/curl/.test(n) && !/leg/.test(n)) return ['Biceps'];
  if (/triceps|pushdown|overhead.*extension|close-grip|skull/.test(n)) return ['Triceps'];
  if (/lateral raise|rear-delt|face pull/.test(n)) return ['Side/Rear Delts'];
  if (/leg curl|nordic/.test(n)) return ['Hamstrings'];
  if (/leg extension/.test(n)) return ['Quads'];
  switch (pattern) {
    case 'squat': return ['Quads', 'Glutes'];
    case 'hinge': return ['Hamstrings', 'Glutes'];
    case 'horizontal-push': return ['Chest', 'Triceps'];
    case 'vertical-push': return ['Shoulders', 'Triceps'];
    case 'horizontal-pull': return ['Back', 'Biceps'];
    case 'vertical-pull': return ['Lats', 'Biceps'];
    case 'lunge': return ['Quads', 'Glutes'];
    case 'core': return ['Abs', 'Core'];
    default: return ['Target muscle'];
  }
}

export function getExerciseInfo(rawName: string): Required<Pick<ExerciseInfo, 'pattern' | 'primaryMuscles'>> & {
  name: string;
  instructions: string[];
  cues: string[];
  equipment?: string;
} {
  const name = baseExerciseName(rawName);
  const entry = CATALOG[name];
  const pattern = entry?.pattern ?? inferPattern(name);
  const meta = PATTERNS[pattern];
  return {
    name,
    pattern,
    primaryMuscles: entry?.primaryMuscles ?? inferMuscles(pattern, name),
    equipment: entry?.equipment,
    instructions: entry?.instructions ?? meta.instructions,
    cues: entry?.cues ?? meta.cues,
  };
}

/** External media links — always resolve, open in the browser. */
export function videoUrl(rawName: string): string {
  const q = encodeURIComponent(`${baseExerciseName(rawName)} proper form how to`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
export function photosUrl(rawName: string): string {
  const q = encodeURIComponent(`${baseExerciseName(rawName)} exercise`);
  return `https://www.google.com/search?tbm=isch&q=${q}`;
}
