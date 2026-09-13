create table habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  name text not null,
  emoji text,
  cadence habit_cadence not null default 'daily',
  target_per_week int not null default 7,
  reminder_time time,
  auto_source text check (auto_source in ('workout_completed', 'meals_logged')),
  color_token text not null default 'load-green',
  sort_index int not null default 0,
  rest_day_enabled boolean not null default true,
  rest_day_weekday smallint check (rest_day_weekday between 0 and 6),
  archived_at timestamptz
);

create table habit_logs (
  id uuid primary key default gen_random_uuid(), -- client-generated
  habit_id uuid not null references habits on delete cascade,
  user_id uuid not null references profiles on delete cascade,
  log_date date not null,
  status text not null default 'done' check (status in ('done', 'skipped')),
  source text not null default 'user' check (source in ('user', 'auto_workout', 'auto_meals')),
  updated_at timestamptz not null default now(), -- last-write-wins key for offline reconnect (M6)
  unique (habit_id, log_date)
);

create index habit_logs_user_habit_date_idx on habit_logs (user_id, habit_id, log_date desc);
create index habit_logs_user_date_idx on habit_logs (user_id, log_date);

-- Reject a write whose updated_at is older than what's stored, so an offline
-- toggle-off-then-on-again doesn't resurrect a stale value on reconnect.
create or replace function public.reject_stale_habit_log()
returns trigger language plpgsql as $$
begin
  if TG_OP = 'UPDATE' and new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;
create trigger habit_logs_reject_stale before update on habit_logs
  for each row execute function public.reject_stale_habit_log();

create table ai_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  kind job_kind not null,
  model text,
  status job_status not null,
  tokens_in int,
  tokens_out int,
  latency_ms int,
  error text,
  created_at timestamptz not null default now()
);

create index ai_jobs_user_created_idx on ai_jobs (user_id, created_at desc);
create index ai_jobs_user_kind_created_idx on ai_jobs (user_id, kind, created_at desc);
