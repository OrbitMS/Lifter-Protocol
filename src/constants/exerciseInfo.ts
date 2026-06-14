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
  /** per-exercise overrides (fall back to the movement-pattern default) */
  emoji?: string;
  label?: string;
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

  // --- squat-pattern variations & machines ---
  'Pause Squat': {
    pattern: 'squat', emoji: '🏋️', primaryMuscles: ['Quads', 'Glutes'], equipment: 'Barbell',
    instructions: ['Squat to depth under control.', 'Hold a dead-stop pause (2–3s) at the bottom, staying tight.', 'Drive up explosively without bouncing.'],
    cues: ['Stay braced through the pause', 'No bounce out of the hole'],
  },
  'Tempo Squat (3s eccentric)': {
    pattern: 'squat', emoji: '🏋️', primaryMuscles: ['Quads', 'Glutes'], equipment: 'Barbell', label: 'Tempo squat',
    instructions: ['Lower over a slow 3-second count.', 'Keep the bar over mid-foot the whole way down.', 'Hit depth, then stand up at normal speed.'],
    cues: ['Control every inch of the descent', 'Stay tight, no collapsing'],
  },
  'Hack Squat': {
    pattern: 'squat', emoji: '🦵', primaryMuscles: ['Quads', 'Glutes'], equipment: 'Machine', label: 'Machine squat (quad-focused)',
    instructions: ['Set your back flat against the pad, feet mid-platform.', 'Unlock and lower until thighs are at least parallel.', 'Drive through the whole foot back to near lockout.'],
    cues: ['Back flat on the pad', 'Knees track over the toes', 'Don’t lock out hard'],
  },
  'Leg Press': {
    pattern: 'squat', emoji: '🦵', primaryMuscles: ['Quads', 'Glutes'], equipment: 'Machine', label: 'Leg press (machine)',
    instructions: ['Sit back with feet shoulder-width on the platform.', 'Lower the sled until your knees reach ~90° (no lower-back rounding).', 'Press back up through the whole foot without locking the knees hard.'],
    cues: ['Keep your lower back on the seat', 'Don’t let the knees cave in', 'Control the negative'],
  },
  'Leg Extension': {
    pattern: 'isolation', emoji: '🦵', primaryMuscles: ['Quads'], equipment: 'Machine', label: 'Quad isolation',
    instructions: ['Set the pad on your lower shins, knees at the pivot.', 'Extend to straight legs and squeeze the quads.', 'Lower under control to a full stretch.'],
    cues: ['Pause and squeeze at the top', 'Slow on the way down'],
  },
  'Walking Lunge': {
    pattern: 'lunge', emoji: '🦵', primaryMuscles: ['Quads', 'Glutes'], equipment: 'Dumbbells',
    instructions: ['Step forward into a lunge, lowering the back knee toward the floor.', 'Keep the front shin fairly vertical and torso tall.', 'Drive through the front foot and step into the next rep.'],
    cues: ['Tall chest', 'Push through the front heel'],
  },

  // --- hinge / posterior chain ---
  'Deficit Deadlift': {
    pattern: 'hinge', emoji: '🏋️', primaryMuscles: ['Hamstrings', 'Glutes', 'Erectors'], equipment: 'Barbell',
    instructions: ['Stand on a 2–4cm plate/block to increase range.', 'Set up like a deadlift; chest up, slack out.', 'Push the floor away and lock out tall.'],
    cues: ['Stay tight off the floor', 'Bar against the legs'],
  },
  'Pause Deadlift': {
    pattern: 'hinge', emoji: '🏋️', primaryMuscles: ['Hamstrings', 'Glutes', 'Back'], equipment: 'Barbell',
    instructions: ['Break the bar off the floor and pause just below the knee (1–2s).', 'Stay braced and tight through the pause.', 'Complete the lockout.'],
    cues: ['Hold position, don’t sag', 'Lats tight'],
  },
  'Block Pull': {
    pattern: 'hinge', emoji: '🏋️', primaryMuscles: ['Glutes', 'Back', 'Traps'], equipment: 'Barbell',
    instructions: ['Set the bar on blocks at/just below the knee.', 'Brace, take the slack out, and pull to lockout.', 'Lower under control to the blocks.'],
    cues: ['Push the floor away', 'Finish with glutes'],
  },
  'Good Morning': {
    pattern: 'hinge', emoji: '🏋️', primaryMuscles: ['Hamstrings', 'Erectors', 'Glutes'], equipment: 'Barbell',
    instructions: ['Bar on your upper back, soft knees.', 'Hinge at the hips with a flat back until you feel a strong hamstring stretch.', 'Drive hips forward to stand tall.'],
    cues: ['Hips back, flat back', 'Light load, controlled'],
  },
  'Lying Leg Curl': {
    pattern: 'isolation', emoji: '🦵', primaryMuscles: ['Hamstrings'], equipment: 'Machine',
    instructions: ['Lie face down, pad on your lower calves.', 'Curl your heels toward your glutes and squeeze.', 'Lower slowly to a full stretch.'],
    cues: ['No hip pop — keep hips down', 'Squeeze at the top'],
  },
  'Seated Leg Curl': {
    pattern: 'isolation', emoji: '🦵', primaryMuscles: ['Hamstrings'], equipment: 'Machine',
    instructions: ['Sit with the pad on your lower calves, thighs strapped.', 'Curl the heels down and under, squeezing the hamstrings.', 'Return slowly to a full stretch.'],
    cues: ['Big stretch each rep', 'Control the return'],
  },
  'Nordic Curl': {
    pattern: 'isolation', emoji: '🦵', primaryMuscles: ['Hamstrings'], equipment: 'Bodyweight',
    instructions: ['Anchor your ankles, kneel tall, hips extended.', 'Lower your torso forward as slowly as possible using the hamstrings.', 'Catch with your hands, push back, and curl yourself up.'],
    cues: ['Fight the descent', 'Keep hips extended'],
  },

  // --- glutes ---
  'Cable Pull-Through': {
    pattern: 'hinge', emoji: '🍑', primaryMuscles: ['Glutes', 'Hamstrings'], equipment: 'Cable',
    instructions: ['Face away from a low cable, rope between your legs.', 'Hinge back letting the hands travel between your legs.', 'Drive hips forward and squeeze the glutes to stand.'],
    cues: ['It’s a hinge, not a squat', 'Squeeze glutes at the top'],
  },
  'Glute Kickback': {
    pattern: 'isolation', emoji: '🍑', primaryMuscles: ['Glutes'], equipment: 'Cable',
    instructions: ['Anchor a cuff to your ankle, hinge slightly forward.', 'Drive the leg back and up, squeezing the glute.', 'Return under control without arching the lower back.'],
    cues: ['Squeeze the glute, not the back', 'Controlled tempo'],
  },
  'Reverse Hyper': {
    pattern: 'hinge', emoji: '🍑', primaryMuscles: ['Glutes', 'Hamstrings', 'Erectors'], equipment: 'Machine',
    instructions: ['Lie face down on the pad, legs hanging.', 'Swing the legs up to hip height by squeezing glutes/hams.', 'Lower under control — no aggressive swinging.'],
    cues: ['Squeeze, don’t fling', 'Smooth tempo'],
  },

  // --- chest / horizontal push ---
  'Incline Barbell Press': {
    pattern: 'horizontal-push', emoji: '🏋️', primaryMuscles: ['Upper Chest', 'Front Delts', 'Triceps'], equipment: 'Barbell',
    instructions: ['Set the bench to ~30°, shoulder blades retracted.', 'Lower the bar to the upper chest with elbows tucked.', 'Press up and slightly back to lockout.'],
    cues: ['Don’t flare the elbows', 'Touch the upper chest'],
  },
  'Incline DB Press': {
    pattern: 'horizontal-push', emoji: '💪', primaryMuscles: ['Upper Chest', 'Front Delts'], equipment: 'Dumbbells',
    instructions: ['Bench ~30°, dumbbells at the upper chest.', 'Press up and slightly together without clashing.', 'Lower to a deep stretch under control.'],
    cues: ['Full stretch at the bottom', 'Drive through the chest'],
  },
  'Decline DB Press': {
    pattern: 'horizontal-push', emoji: '💪', primaryMuscles: ['Lower Chest', 'Triceps'], equipment: 'Dumbbells',
    instructions: ['On a slight decline, dumbbells at the lower chest.', 'Press up and together.', 'Lower under control to a stretch.'],
    cues: ['Controlled tempo', 'Squeeze at the top'],
  },
  'Weighted Dip': {
    pattern: 'horizontal-push', emoji: '💪', primaryMuscles: ['Chest', 'Triceps', 'Front Delts'], equipment: 'Bodyweight + belt',
    instructions: ['Support yourself on parallel bars, slight forward lean for chest.', 'Lower until your upper arms are about parallel.', 'Press back up to lockout.'],
    cues: ['Lean forward for chest, upright for triceps', 'Control the depth'],
  },
  'Cable Fly': {
    pattern: 'isolation', emoji: '💪', primaryMuscles: ['Chest'], equipment: 'Cable',
    instructions: ['Set cables at chest height, slight forward stagger.', 'With a soft elbow bend, bring the handles together in front.', 'Open back out to a stretch under control.'],
    cues: ['Hug, don’t press', 'Big stretch, strong squeeze'],
  },
  'Machine Chest Press': {
    pattern: 'horizontal-push', emoji: '💪', primaryMuscles: ['Chest', 'Triceps'], equipment: 'Machine',
    instructions: ['Set the seat so handles are at mid-chest.', 'Press out smoothly without locking hard.', 'Return under control to a stretch.'],
    cues: ['Shoulder blades back', 'Controlled negative'],
  },

  // --- back ---
  'Barbell Row': {
    pattern: 'horizontal-pull', emoji: '🚣', primaryMuscles: ['Lats', 'Upper Back', 'Biceps'], equipment: 'Barbell',
    instructions: ['Hinge to ~45°, flat back, bar hanging.', 'Row the bar to your lower ribs/stomach, elbows back.', 'Lower under control to a full stretch.'],
    cues: ['Lead with the elbows', 'No heaving the torso'],
  },
  'Pendlay Row': {
    pattern: 'horizontal-pull', emoji: '🏋️', primaryMuscles: ['Lats', 'Upper Back'], equipment: 'Barbell',
    instructions: ['Hinge to roughly parallel, flat back.', 'Explosively row the bar to the lower chest.', 'Lower it back to the floor (dead-stop) each rep.'],
    cues: ['Strict torso, explosive pull', 'Reset on the floor'],
  },
  'Lat Pulldown': {
    pattern: 'vertical-pull', emoji: '🧗', primaryMuscles: ['Lats', 'Biceps'], equipment: 'Cable',
    instructions: ['Grip the bar wider than shoulders, slight lean back.', 'Pull the bar to your upper chest, driving elbows down.', 'Return under control to a full stretch.'],
    cues: ['Lead with the elbows', 'Chest up, no big swing'],
  },
  'Chest-Supported Row': {
    pattern: 'horizontal-pull', emoji: '🚣', primaryMuscles: ['Upper Back', 'Lats'], equipment: 'Machine/Bench',
    instructions: ['Lie chest-down on the incline pad.', 'Row the weight back, squeezing the shoulder blades.', 'Lower under control to a full stretch.'],
    cues: ['Let the chest pad do the cheating-prevention', 'Squeeze the mid-back'],
  },
  'Seated Cable Row': {
    pattern: 'horizontal-pull', emoji: '🚣', primaryMuscles: ['Mid Back', 'Lats', 'Biceps'], equipment: 'Cable',
    instructions: ['Sit tall, slight knee bend, grab the handle.', 'Row to your stomach, driving elbows back and squeezing.', 'Return under control to a stretch, torso steady.'],
    cues: ['Chest up, don’t round', 'Squeeze the shoulder blades'],
  },
  'Straight-Arm Pulldown': {
    pattern: 'isolation', emoji: '🧗', primaryMuscles: ['Lats'], equipment: 'Cable',
    instructions: ['Stand facing a high cable, slight hinge, arms straight.', 'Pull the bar down to your thighs using the lats.', 'Return under control to a stretch overhead.'],
    cues: ['Arms stay straight', 'Feel the lats, not the triceps'],
  },

  // --- shoulders ---
  'DB Shoulder Press': {
    pattern: 'vertical-push', emoji: '🙌', primaryMuscles: ['Front/Side Delts', 'Triceps'], equipment: 'Dumbbells',
    instructions: ['Seated or standing, dumbbells at shoulder height.', 'Press overhead without clashing the bells.', 'Lower under control to ear level.'],
    cues: ['Ribs down, glutes tight', 'Don’t bounce at the bottom'],
  },
  'Lateral Raise': {
    pattern: 'isolation', emoji: '🙌', primaryMuscles: ['Side Delts'], equipment: 'Dumbbells',
    instructions: ['Slight forward lean, soft elbows.', 'Raise the dumbbells out to shoulder height, pinkies slightly up.', 'Lower slowly under control.'],
    cues: ['Lead with the elbows', 'No swinging — let the delts work'],
  },
  'Face Pull': {
    pattern: 'horizontal-pull', emoji: '🙌', primaryMuscles: ['Rear Delts', 'Upper Back'], equipment: 'Cable',
    instructions: ['Rope at face height, pull toward your forehead.', 'Externally rotate so hands finish beside your ears.', 'Return under control.'],
    cues: ['High elbows', 'Squeeze the rear delts'],
  },
  'Rear-Delt Fly': {
    pattern: 'isolation', emoji: '🙌', primaryMuscles: ['Rear Delts'], equipment: 'Dumbbells',
    instructions: ['Hinge forward, soft elbows, dumbbells hanging.', 'Raise them out to the sides, squeezing the rear delts.', 'Lower under control.'],
    cues: ['Lead with the elbows', 'Don’t use momentum'],
  },

  // --- arms ---
  'EZ-Bar Curl': {
    pattern: 'isolation', emoji: '💪', primaryMuscles: ['Biceps'], equipment: 'EZ bar',
    instructions: ['Stand tall, elbows pinned to your sides.', 'Curl the bar up, squeezing the biceps.', 'Lower slowly to full extension.'],
    cues: ['Elbows stay put', 'No swinging'],
  },
  'Incline DB Curl': {
    pattern: 'isolation', emoji: '💪', primaryMuscles: ['Biceps'], equipment: 'Dumbbells',
    instructions: ['Sit back on an incline bench, arms hanging.', 'Curl the dumbbells up keeping the upper arms back.', 'Lower slowly to a deep stretch.'],
    cues: ['Big stretch at the bottom', 'Control the negative'],
  },
  'Hammer Curl': {
    pattern: 'isolation', emoji: '💪', primaryMuscles: ['Biceps', 'Brachialis', 'Forearms'], equipment: 'Dumbbells',
    instructions: ['Neutral grip (palms facing in), elbows at your sides.', 'Curl up keeping the wrists neutral.', 'Lower under control.'],
    cues: ['Elbows pinned', 'No body english'],
  },
  'Triceps Pushdown': {
    pattern: 'isolation', emoji: '💪', primaryMuscles: ['Triceps'], equipment: 'Cable',
    instructions: ['Elbows pinned to your sides at a high cable.', 'Push down to full extension, squeezing the triceps.', 'Return under control to ~90°.'],
    cues: ['Only the forearms move', 'Squeeze at lockout'],
  },
  'Overhead Triceps Extension': {
    pattern: 'isolation', emoji: '💪', primaryMuscles: ['Triceps (long head)'], equipment: 'Cable/Dumbbell',
    instructions: ['Load overhead, elbows pointing up.', 'Lower behind your head to a stretch.', 'Extend back up, squeezing the triceps.'],
    cues: ['Keep elbows tucked', 'Big stretch each rep'],
  },

  // --- core ---
  'Hanging Leg Raise': {
    pattern: 'core', emoji: '🔥', primaryMuscles: ['Abs', 'Hip Flexors'], equipment: 'Pull-up bar',
    instructions: ['Hang from a bar, shoulders active.', 'Raise your legs (straight or tucked) using the abs.', 'Lower under control without swinging.'],
    cues: ['Curl the pelvis up', 'No kipping/swinging'],
  },
  'Cable Crunch': {
    pattern: 'core', emoji: '🔥', primaryMuscles: ['Abs'], equipment: 'Cable',
    instructions: ['Kneel under a rope, hands by your head.', 'Crunch down by flexing the spine (not hinging the hips).', 'Return under control.'],
    cues: ['Round the spine, don’t bow', 'Squeeze the abs'],
  },
  'Ab Wheel Rollout': {
    pattern: 'core', emoji: '🔥', primaryMuscles: ['Abs', 'Core'], equipment: 'Ab wheel',
    instructions: ['Kneel, brace hard, ribs down.', 'Roll out as far as you can keep a flat, braced spine.', 'Pull back using the abs.'],
    cues: ['No lower-back sag', 'Only go as far as you can control'],
  },
  'Plank': {
    pattern: 'core', emoji: '🔥', primaryMuscles: ['Abs', 'Core'], equipment: 'Bodyweight',
    instructions: ['Forearms down, body in a straight line.', 'Brace the abs and squeeze the glutes.', 'Hold the position, breathing steadily.'],
    cues: ['Ribs down, hips level', 'Don’t let the hips sag'],
  },
  'Back Extension': {
    pattern: 'hinge', emoji: '🍑', primaryMuscles: ['Erectors', 'Glutes', 'Hamstrings'], equipment: 'Machine/Bench',
    instructions: ['Hips on the pad, hinge forward with a flat back.', 'Raise back up to a straight line (don’t hyperextend).', 'Lower under control.'],
    cues: ['Stop at straight, no over-arching', 'Squeeze glutes at the top'],
  },
  'Pallof Press': {
    pattern: 'core', emoji: '🔥', primaryMuscles: ['Obliques', 'Core'], equipment: 'Cable',
    instructions: ['Stand side-on to a cable at chest height, hands at your sternum.', 'Press the handle straight out, resisting the rotation.', 'Return under control and repeat.'],
    cues: ['Resist the twist', 'Brace and breathe'],
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

export function getExerciseInfo(rawName: string): {
  name: string;
  pattern: Pattern;
  primaryMuscles: string[];
  equipment?: string;
  emoji: string;
  label: string;
  instructions: string[];
  cues: string[];
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
    emoji: entry?.emoji ?? meta.emoji,
    label: entry?.label ?? meta.label,
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
