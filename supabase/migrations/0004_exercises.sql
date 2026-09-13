-- Global read-only reference data. No user_id. Must precede 0005 (planned_sets
-- and set_logs FK into this table).

create table exercises (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  primary_muscle text not null,
  secondary_muscles text[] not null default '{}',
  equipment equipment_kind not null,
  movement_pattern text, -- squat, hinge, push_h, push_v, pull_h, pull_v, carry, core
  is_unilateral boolean not null default false,
  load_increment_kg numeric not null default 2.5,
  cues text[] not null default '{}',
  form_rules jsonb, -- thresholds only; evaluators live in lib/form/rules/*.ts (M5)
  form_camera_view text check (form_camera_view in ('side', 'front')),
  form_primary_angle text,
  demo_url text
);

-- Picker in M5 only lists exercises with form analysis available.
create index exercises_form_rules_idx on exercises (slug) where form_rules is not null;

insert into exercises (slug, name, primary_muscle, secondary_muscles, equipment, movement_pattern, is_unilateral, load_increment_kg, cues) values
-- Barbell
('barbell-back-squat', 'Barbell Back Squat', 'quads', '{glutes,hamstrings,core}', 'barbell', 'squat', false, 5, '{"Brace before you descend","Knees track over toes","Drive through the whole foot"}'),
('barbell-front-squat', 'Barbell Front Squat', 'quads', '{glutes,core}', 'barbell', 'squat', false, 5, '{"Elbows up","Sit between your hips","Keep the bar over midfoot"}'),
('barbell-deadlift', 'Barbell Deadlift', 'hamstrings', '{glutes,back,core}', 'barbell', 'hinge', false, 5, '{"Bar over midfoot","Push the floor away","Chest and hips rise together"}'),
('barbell-romanian-deadlift', 'Barbell Romanian Deadlift', 'hamstrings', '{glutes,back}', 'barbell', 'hinge', false, 5, '{"Soft knees","Hinge at the hips","Bar stays close to the legs"}'),
('barbell-bench-press', 'Barbell Bench Press', 'chest', '{shoulders,arms}', 'barbell', 'push_h', false, 2.5, '{"Shoulder blades set","Bar to mid-chest","Drive feet into the floor"}'),
('barbell-incline-bench-press', 'Barbell Incline Bench Press', 'chest', '{shoulders,arms}', 'barbell', 'push_h', false, 2.5, '{"Bar to upper chest","Elbows at 45 degrees"}'),
('barbell-overhead-press', 'Barbell Overhead Press', 'shoulders', '{arms,core}', 'barbell', 'push_v', false, 2.5, '{"Squeeze glutes","Bar path stays close","Lock out overhead"}'),
('barbell-bent-over-row', 'Barbell Bent-Over Row', 'back', '{arms,shoulders}', 'barbell', 'pull_h', false, 2.5, '{"Flat back","Pull to the lower ribs","Control the descent"}'),
('barbell-pendlay-row', 'Barbell Pendlay Row', 'back', '{arms}', 'barbell', 'pull_h', false, 2.5, '{"Reset each rep from the floor","Explosive pull"}'),
('barbell-hip-thrust', 'Barbell Hip Thrust', 'glutes', '{hamstrings,core}', 'barbell', 'hinge', false, 5, '{"Chin tucked","Drive through heels","Squeeze at the top"}'),
('barbell-good-morning', 'Barbell Good Morning', 'hamstrings', '{glutes,back}', 'barbell', 'hinge', false, 2.5, '{"Soft knees","Hinge, don''t squat","Flat back throughout"}'),
('barbell-shrug', 'Barbell Shrug', 'back', '{arms}', 'barbell', 'pull_v', false, 5, '{"Straight up, not rolled","Pause at the top"}'),
('barbell-curl', 'Barbell Curl', 'arms', '{}', 'barbell', 'pull_v', false, 1.25, '{"Elbows pinned","No swinging"}'),
('barbell-skull-crusher', 'Barbell Skull Crusher', 'arms', '{}', 'barbell', 'push_h', false, 1.25, '{"Elbows stay in","Lower to the forehead"}'),
('barbell-calf-raise', 'Barbell Calf Raise', 'quads', '{}', 'barbell', 'squat', false, 5, '{"Full stretch at the bottom","Pause at the top"}'),

-- Dumbbell
('dumbbell-goblet-squat', 'Dumbbell Goblet Squat', 'quads', '{glutes,core}', 'dumbbell', 'squat', false, 2.5, '{"Elbows inside the knees","Chest tall"}'),
('dumbbell-bulgarian-split-squat', 'Dumbbell Bulgarian Split Squat', 'quads', '{glutes,hamstrings}', 'dumbbell', 'squat', true, 1.25, '{"Torso upright","Back knee drops straight down"}'),
('dumbbell-reverse-lunge', 'Dumbbell Reverse Lunge', 'quads', '{glutes,hamstrings}', 'dumbbell', 'squat', true, 1.25, '{"Step back, not down","Front knee stacked over ankle"}'),
('dumbbell-romanian-deadlift', 'Dumbbell Romanian Deadlift', 'hamstrings', '{glutes,back}', 'dumbbell', 'hinge', false, 2.5, '{"Hips back","Dumbbells stay close to the legs"}'),
('dumbbell-single-leg-rdl', 'Dumbbell Single-Leg RDL', 'hamstrings', '{glutes,core}', 'dumbbell', 'hinge', true, 1.25, '{"Hips square","Reach the floor with control"}'),
('dumbbell-bench-press', 'Dumbbell Bench Press', 'chest', '{shoulders,arms}', 'dumbbell', 'push_h', false, 2.5, '{"Full stretch at the bottom","Press up and slightly in"}'),
('dumbbell-incline-press', 'Dumbbell Incline Press', 'chest', '{shoulders,arms}', 'dumbbell', 'push_h', false, 2.5, '{"30-45 degree bench","Control the negative"}'),
('dumbbell-fly', 'Dumbbell Fly', 'chest', '{}', 'dumbbell', 'push_h', false, 1.25, '{"Slight elbow bend throughout","Wide arc"}'),
('dumbbell-shoulder-press', 'Dumbbell Shoulder Press', 'shoulders', '{arms,core}', 'dumbbell', 'push_v', false, 1.25, '{"Press slightly forward","Full lockout"}'),
('dumbbell-lateral-raise', 'Dumbbell Lateral Raise', 'shoulders', '{}', 'dumbbell', 'push_v', false, 1.25, '{"Lead with the elbows","Stop at shoulder height"}'),
('dumbbell-rear-delt-fly', 'Dumbbell Rear Delt Fly', 'shoulders', '{back}', 'dumbbell', 'pull_h', false, 1.25, '{"Hinge forward","Squeeze the shoulder blades"}'),
('dumbbell-single-arm-row', 'Dumbbell Single-Arm Row', 'back', '{arms}', 'dumbbell', 'pull_h', true, 2.5, '{"Flat back","Pull to the hip, not the chest"}'),
('dumbbell-curl', 'Dumbbell Curl', 'arms', '{}', 'dumbbell', 'pull_v', false, 1.25, '{"Elbows pinned to the sides"}'),
('dumbbell-hammer-curl', 'Dumbbell Hammer Curl', 'arms', '{}', 'dumbbell', 'pull_v', false, 1.25, '{"Neutral grip throughout"}'),
('dumbbell-overhead-triceps-extension', 'Dumbbell Overhead Triceps Extension', 'arms', '{}', 'dumbbell', 'push_v', false, 1.25, '{"Elbows stay narrow","Full stretch overhead"}'),
('dumbbell-farmers-carry', 'Dumbbell Farmer''s Carry', 'core', '{back,arms}', 'dumbbell', 'carry', false, 2.5, '{"Tall posture","Shoulders back, don''t lean"}'),

-- Machine
('leg-press', 'Leg Press', 'quads', '{glutes,hamstrings}', 'machine', 'squat', false, 5, '{"Full range, don''t lock knees hard","Feet shoulder-width"}'),
('leg-extension', 'Leg Extension', 'quads', '{}', 'machine', 'squat', false, 2.5, '{"Controlled tempo","Pause at the top"}'),
('leg-curl', 'Leg Curl', 'hamstrings', '{}', 'machine', 'hinge', false, 2.5, '{"Controlled tempo","Full stretch at the bottom"}'),
('seated-calf-raise', 'Seated Calf Raise', 'quads', '{}', 'machine', 'squat', false, 2.5, '{"Full stretch and full contraction"}'),
('chest-press-machine', 'Chest Press Machine', 'chest', '{shoulders,arms}', 'machine', 'push_h', false, 2.5, '{"Seat height at mid-chest","Full extension"}'),
('shoulder-press-machine', 'Shoulder Press Machine', 'shoulders', '{arms}', 'machine', 'push_v', false, 2.5, '{"Seat height so handles start at shoulder"}'),
('lat-pulldown', 'Lat Pulldown', 'back', '{arms}', 'machine', 'pull_v', false, 2.5, '{"Pull to the upper chest","Lead with the elbows"}'),
('seated-cable-row', 'Seated Cable Row', 'back', '{arms}', 'cable', 'pull_h', false, 2.5, '{"Flat back","Pull to the stomach, squeeze the blades"}'),
('cable-triceps-pushdown', 'Cable Triceps Pushdown', 'arms', '{}', 'cable', 'push_v', false, 1.25, '{"Elbows pinned to your sides"}'),
('cable-face-pull', 'Cable Face Pull', 'shoulders', '{back}', 'cable', 'pull_h', false, 1.25, '{"Pull to eye level","Externally rotate at the end"}'),
('cable-woodchopper', 'Cable Woodchopper', 'core', '{}', 'cable', 'core', true, 1.25, '{"Rotate from the torso, not the arms"}'),
('assisted-pull-up-machine', 'Assisted Pull-Up Machine', 'back', '{arms}', 'machine', 'pull_v', false, 2.5, '{"Full hang at the bottom","Chin over the bar"}'),
('smith-machine-squat', 'Smith Machine Squat', 'quads', '{glutes,hamstrings}', 'machine', 'squat', false, 5, '{"Feet slightly forward of the bar"}'),
('hack-squat-machine', 'Hack Squat Machine', 'quads', '{glutes}', 'machine', 'squat', false, 5, '{"Feet mid-platform","Full depth with control"}'),

-- Bodyweight
('push-up', 'Push-Up', 'chest', '{shoulders,arms,core}', 'bodyweight', 'push_h', false, 2.5, '{"Body in a straight line","Elbows at 45 degrees","Full range"}'),
('bodyweight-squat', 'Bodyweight Squat', 'quads', '{glutes,hamstrings}', 'bodyweight', 'squat', false, 2.5, '{"Chest tall","Sit back and down"}'),
('bodyweight-lunge', 'Bodyweight Lunge', 'quads', '{glutes,hamstrings}', 'bodyweight', 'squat', true, 2.5, '{"Torso upright","Control the descent"}'),
('pull-up', 'Pull-Up', 'back', '{arms}', 'bodyweight', 'pull_v', false, 2.5, '{"Full hang at the bottom","Chin over the bar"}'),
('chin-up', 'Chin-Up', 'back', '{arms}', 'bodyweight', 'pull_v', false, 2.5, '{"Full hang at the bottom","Control the descent"}'),
('dip', 'Dip', 'chest', '{arms,shoulders}', 'bodyweight', 'push_v', false, 2.5, '{"Slight forward lean for chest","Full range"}'),
('plank', 'Plank', 'core', '{shoulders}', 'bodyweight', 'core', false, 0, '{"Straight line from shoulders to ankles","Squeeze glutes and abs"}'),
('side-plank', 'Side Plank', 'core', '{shoulders}', 'bodyweight', 'core', true, 0, '{"Hips lifted, straight line","Stack the feet"}'),
('glute-bridge', 'Glute Bridge', 'glutes', '{hamstrings,core}', 'bodyweight', 'hinge', false, 2.5, '{"Drive through the heels","Squeeze at the top"}'),
('hanging-knee-raise', 'Hanging Knee Raise', 'core', '{arms}', 'bodyweight', 'core', false, 0, '{"Control the swing","Curl the pelvis at the top"}'),
('mountain-climber', 'Mountain Climber', 'core', '{quads}', 'bodyweight', 'core', false, 0, '{"Hips stay low","Drive the knees quickly"}'),
('inverted-row', 'Inverted Row', 'back', '{arms,core}', 'bodyweight', 'pull_h', false, 0, '{"Straight body line","Pull the chest to the bar"}'),
('bodyweight-calf-raise', 'Bodyweight Calf Raise', 'quads', '{}', 'bodyweight', 'squat', false, 0, '{"Full range, pause at the top"}'),
('bird-dog', 'Bird Dog', 'core', '{back}', 'bodyweight', 'core', true, 0, '{"Flat back, no rotation","Opposite arm and leg extend together"}'),
('step-up', 'Step-Up', 'quads', '{glutes,hamstrings}', 'bodyweight', 'squat', true, 2.5, '{"Drive through the lead foot, don''t push off the back leg"}'),
('bear-crawl', 'Bear Crawl', 'core', '{shoulders,quads}', 'bodyweight', 'carry', false, 0, '{"Knees hover, don''t touch down","Flat back"}'),
('farmers-carry-bodyweight', 'Suitcase Carry', 'core', '{back}', 'bodyweight', 'carry', true, 0, '{"Tall posture, resist leaning"}'),

-- Barbell/Bands rounding out squat + hinge + push_v coverage for smaller equipment sets
('band-pull-apart', 'Band Pull-Apart', 'shoulders', '{back}', 'bands', 'pull_h', false, 0, '{"Arms straight","Squeeze the shoulder blades"}'),
('band-assisted-squat', 'Band-Assisted Squat', 'quads', '{glutes}', 'bands', 'squat', false, 0, '{"Band tension throughout","Full depth"}'),
('band-face-pull', 'Band Face Pull', 'shoulders', '{back}', 'bands', 'pull_h', false, 0, '{"Pull to eye level","Externally rotate"}');
