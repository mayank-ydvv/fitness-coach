create table meals (
  id uuid primary key default gen_random_uuid(), -- client-generated, see lib/queries/keys.ts
  user_id uuid not null references profiles on delete cascade,
  eaten_at timestamptz not null default now(),
  meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  source text not null check (source in ('photo', 'manual', 'search', 'repeat')),
  image_path text,
  status meal_status not null default 'ready',
  note text,
  created_at timestamptz not null default now()
);

create index meals_user_eaten_idx on meals (user_id, eaten_at desc);

create table meal_items (
  id uuid primary key default gen_random_uuid(),
  meal_id uuid not null references meals on delete cascade,
  name text not null,
  portion_description text,
  grams numeric,
  kcal numeric not null,
  kcal_low numeric,
  kcal_high numeric,
  protein_g numeric not null default 0,
  carbs_g numeric not null default 0,
  fat_g numeric not null default 0,
  fiber_g numeric not null default 0,
  confidence numeric check (confidence between 0 and 1),
  user_edited boolean not null default false,
  order_index int not null default 0
);

-- Mandatory, not an optimisation: every meal_items RLS policy (0007) joins
-- through meals on this column.
create index meal_items_meal_idx on meal_items (meal_id);

create table meal_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles on delete cascade,
  name text not null,
  source_meal_id uuid references meals on delete set null,
  items jsonb not null, -- snapshot of meal_items at save time, for one-tap re-log
  created_at timestamptz not null default now()
);

create index meal_favorites_user_idx on meal_favorites (user_id, created_at desc);
