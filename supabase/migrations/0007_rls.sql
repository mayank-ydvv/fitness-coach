-- Every RLS policy in the app, in one file, so the security boundary reads
-- top-to-bottom as a single artifact. `(select auth.uid())` (not bare
-- auth.uid()) throughout so Postgres hoists it to an InitPlan evaluated once
-- per query rather than once per row.

alter table profiles enable row level security;
alter table body_metrics enable row level security;
alter table nutrition_targets enable row level security;
alter table meals enable row level security;
alter table meal_items enable row level security;
alter table meal_favorites enable row level security;
alter table exercises enable row level security;
alter table programs enable row level security;
alter table program_weeks enable row level security;
alter table planned_workouts enable row level security;
alter table planned_sets enable row level security;
alter table workout_sessions enable row level security;
alter table set_logs enable row level security;
alter table progression_runs enable row level security;
alter table form_analyses enable row level security;
alter table habits enable row level security;
alter table habit_logs enable row level security;
alter table ai_jobs enable row level security;

-- profiles: PK is the user id directly.
create policy "own profile select" on profiles for select to authenticated
  using ((select auth.uid()) = id);
create policy "own profile update" on profiles for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
-- No insert policy: rows are created only by handle_new_user() (security definer).
-- No delete policy: accounts are removed only via delete_account() (security definer, 0010).

create policy "own body_metrics all" on body_metrics for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own nutrition_targets all" on nutrition_targets for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own meals all" on meals for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- meal_items has no user_id column; every policy joins through meals.
-- meal_items_meal_idx (0003) makes this an index lookup, not a seq scan.
create policy "own meal_items select" on meal_items for select to authenticated
  using (exists (select 1 from meals m where m.id = meal_items.meal_id and m.user_id = (select auth.uid())));
create policy "own meal_items insert" on meal_items for insert to authenticated
  with check (exists (select 1 from meals m where m.id = meal_items.meal_id and m.user_id = (select auth.uid())));
create policy "own meal_items update" on meal_items for update to authenticated
  using (exists (select 1 from meals m where m.id = meal_items.meal_id and m.user_id = (select auth.uid())))
  with check (exists (select 1 from meals m where m.id = meal_items.meal_id and m.user_id = (select auth.uid())));
create policy "own meal_items delete" on meal_items for delete to authenticated
  using (exists (select 1 from meals m where m.id = meal_items.meal_id and m.user_id = (select auth.uid())));

create policy "own meal_favorites all" on meal_favorites for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- exercises: global reference data, readable by any signed-in user, writable by none.
create policy "exercises readable" on exercises for select to authenticated using (true);

create policy "own programs all" on programs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- program_weeks / planned_workouts / planned_sets: user_id is denormalised
-- (0005 triggers), so these are direct comparisons, not multi-hop EXISTS.
create policy "own program_weeks all" on program_weeks for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own planned_workouts all" on planned_workouts for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "own planned_sets all" on planned_sets for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own workout_sessions all" on workout_sessions for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- set_logs has no user_id column; join through workout_sessions.
create policy "own set_logs select" on set_logs for select to authenticated
  using (exists (select 1 from workout_sessions s where s.id = set_logs.session_id and s.user_id = (select auth.uid())));
create policy "own set_logs insert" on set_logs for insert to authenticated
  with check (exists (select 1 from workout_sessions s where s.id = set_logs.session_id and s.user_id = (select auth.uid())));
create policy "own set_logs update" on set_logs for update to authenticated
  using (exists (select 1 from workout_sessions s where s.id = set_logs.session_id and s.user_id = (select auth.uid())))
  with check (exists (select 1 from workout_sessions s where s.id = set_logs.session_id and s.user_id = (select auth.uid())));
create policy "own set_logs delete" on set_logs for delete to authenticated
  using (exists (select 1 from workout_sessions s where s.id = set_logs.session_id and s.user_id = (select auth.uid())));

create policy "own progression_runs select" on progression_runs for select to authenticated
  using ((select auth.uid()) = user_id);
-- No client insert/update policy: only written by the finish-session route via admin client.

create policy "own form_analyses all" on form_analyses for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own habits all" on habits for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

create policy "own habit_logs all" on habit_logs for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- ai_jobs: readable by the owner (so the client can show cap usage), written
-- only by server routes via the admin client.
create policy "own ai_jobs select" on ai_jobs for select to authenticated
  using ((select auth.uid()) = user_id);
