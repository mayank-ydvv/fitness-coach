-- Identity, body metrics, and computed nutrition targets.

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  date_of_birth date,
  sex sex,
  height_cm numeric,
  unit_system unit_system not null default 'metric',
  timezone text not null default 'UTC', -- lib/time/localDay.ts is the only reader/writer of "today"
  hide_energy boolean not null default false, -- see lib/units/format.ts: makeFormatter()
  goal goal_type,
  experience_level experience_level,
  days_per_week int check (days_per_week between 1 and 7),
  session_minutes int,
  equipment jsonb not null default '[]',
  limitations text,
  activity_level activity_level,
  onboarded_at timestamptz,
  created_at timestamptz not null default now()
);

create table body_metrics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  recorded_on date not null,
  weight_kg numeric,
  body_fat_pct numeric,
  waist_cm numeric,
  note text,
  unique (user_id, recorded_on)
);

create table nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  effective_from date not null,
  kcal int not null,
  protein_g int not null,
  carbs_g int not null,
  fat_g int not null,
  method text,
  rationale text,
  created_at timestamptz not null default now()
);

create index nutrition_targets_user_effective_idx
  on nutrition_targets (user_id, effective_from desc);

-- Auto-provision a profile row the moment a user signs up, whichever auth
-- method they used (magic link or Google OAuth both fire this the same way).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
