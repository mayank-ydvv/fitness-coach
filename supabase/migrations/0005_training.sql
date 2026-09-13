create table programs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  name text not null,
  goal text,
  split text,
  days_per_week int,
  total_weeks int not null default 6,
  status text not null default 'active' check (status in ('active', 'completed', 'archived', 'superseded')),
  generation_input jsonb,
  generation_input_hash text,
  created_at timestamptz not null default now()
);

-- Program-generation cache lookup (M3): a hit on the same input returns the
-- existing active program instead of calling the model again.
create index programs_user_hash_idx on programs (user_id, generation_input_hash)
  where status = 'active';

create table program_weeks (
  id uuid primary key default gen_random_uuid(),
  program_id uuid not null references programs on delete cascade,
  user_id uuid not null, -- denormalised, see set_planned_row_user() below
  week_number int not null,
  is_deload boolean not null default false,
  deload_reason text,
  unique (program_id, week_number)
);

create table planned_workouts (
  id uuid primary key default gen_random_uuid(),
  program_week_id uuid not null references program_weeks on delete cascade,
  user_id uuid not null,
  day_index int not null,
  name text not null,
  estimated_minutes int
);

create index planned_workouts_week_day_idx on planned_workouts (program_week_id, day_index);

create table planned_sets (
  id uuid primary key default gen_random_uuid(),
  planned_workout_id uuid not null references planned_workouts on delete cascade,
  user_id uuid not null,
  exercise_id uuid not null references exercises,
  order_index int not null,
  set_number int not null,
  target_reps_low int not null,
  target_reps_high int not null,
  target_rpe numeric,
  target_load_kg numeric, -- null in week 1 for beginners: "find your working weight"
  rest_seconds int not null default 120,
  is_warmup boolean not null default false,
  origin text not null default 'generated' check (origin in ('generated', 'progression', 'user_edit'))
);

create index planned_sets_workout_order_idx on planned_sets (planned_workout_id, order_index);
create index planned_sets_user_exercise_idx on planned_sets (user_id, exercise_id);

-- Denormalise user_id onto the three tables above rather than leaving RLS to
-- join three hops through programs. A BEFORE trigger derives it from the
-- parent (never trusted from the client) so it's what RLS WITH CHECK sees.
-- Also what makes "all future planned sets for this user+exercise" indexable
-- for the progression engine (M3).

create or replace function public.set_program_week_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select p.user_id into new.user_id from public.programs p where p.id = new.program_id;
  if new.user_id is null then raise exception 'orphan program_week: no such program'; end if;
  return new;
end;
$$;
create trigger program_weeks_set_user before insert on program_weeks
  for each row execute function public.set_program_week_user();

create or replace function public.set_planned_workout_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select pw.user_id into new.user_id from public.program_weeks pw where pw.id = new.program_week_id;
  if new.user_id is null then raise exception 'orphan planned_workout: no such program_week'; end if;
  return new;
end;
$$;
create trigger planned_workouts_set_user before insert on planned_workouts
  for each row execute function public.set_planned_workout_user();

create or replace function public.set_planned_set_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  select w.user_id into new.user_id from public.planned_workouts w where w.id = new.planned_workout_id;
  if new.user_id is null then raise exception 'orphan planned_set: no such planned_workout'; end if;
  return new;
end;
$$;
create trigger planned_sets_set_user before insert on planned_sets
  for each row execute function public.set_planned_set_user();

create table workout_sessions (
  id uuid primary key default gen_random_uuid(), -- client-generated
  user_id uuid not null references profiles on delete cascade,
  planned_workout_id uuid references planned_workouts on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  session_rpe numeric,
  note text
);

create table set_logs (
  id uuid primary key default gen_random_uuid(), -- client-generated; upsert on conflict makes offline replay a no-op
  session_id uuid not null references workout_sessions on delete cascade,
  exercise_id uuid not null references exercises,
  set_number int not null,
  reps int not null,
  load_kg numeric not null,
  rpe numeric,
  is_warmup boolean not null default false,
  e1rm numeric,
  e1rm_trusted boolean, -- Epley is only trusted for reps <= 12
  completed_at timestamptz not null default now()
);

create index set_logs_session_idx on set_logs (session_id);
create index set_logs_exercise_completed_idx on set_logs (exercise_id, completed_at desc);

-- Audit trail for the progression engine (M3): one row per session-finish run.
-- unique(session_id) makes a double-finish (retry/outbox replay) a no-op that
-- returns the stored output instead of recomputing.
create table progression_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  session_id uuid not null unique references workout_sessions on delete cascade,
  ran_at timestamptz not null default now(),
  input jsonb not null,
  output jsonb not null,
  applied_set_ids uuid[] not null default '{}',
  superseded_by uuid references progression_runs
);

create table form_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  session_id uuid references workout_sessions on delete set null,
  exercise_id uuid not null references exercises,
  recorded_at timestamptz not null default now(),
  camera_view text check (camera_view in ('side', 'front')),
  rep_count int not null,
  overall_score int check (overall_score between 0 and 100),
  rep_metrics jsonb not null,
  faults jsonb not null,
  coach_summary text,
  frames_saved boolean not null default false
);

create index form_analyses_user_idx on form_analyses (user_id, recorded_at desc);
