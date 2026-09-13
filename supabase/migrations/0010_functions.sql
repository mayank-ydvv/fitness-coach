-- Daily AI-call cap, enforced in the database so it survives a route-handler
-- bug and can't race past via two concurrent requests reading a stale count
-- (still ±1 possible under true concurrency; accepted, documented here).
create or replace function public.check_daily_cap(p_kind job_kind, p_limit int)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select count(*) < p_limit
  from public.ai_jobs
  where user_id = (select auth.uid())
    and kind = p_kind
    and status <> 'failed'
    and created_at >= date_trunc('day', now());
$$;
revoke execute on function public.check_daily_cap(job_kind, int) from public;
grant execute on function public.check_daily_cap(job_kind, int) to authenticated;

-- Account deletion that actually cascades. Every user-owned table already
-- has "on delete cascade" back to profiles/auth.users, so deleting the auth
-- user is sufficient. security definer so it can touch auth.users at all.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from auth.users where id = (select auth.uid());
end;
$$;
revoke execute on function public.delete_account() from public;
grant execute on function public.delete_account() to authenticated;

-- Full data export in one round trip instead of 16 separate table reads.
create or replace function public.export_account()
returns jsonb
language sql
security definer
stable
set search_path = ''
as $$
  select jsonb_build_object(
    'profile', (select to_jsonb(p) from public.profiles p where p.id = (select auth.uid())),
    'body_metrics', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.body_metrics t where t.user_id = (select auth.uid())),
    'nutrition_targets', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.nutrition_targets t where t.user_id = (select auth.uid())),
    'meals', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.meals t where t.user_id = (select auth.uid())),
    'meal_items', (select coalesce(jsonb_agg(mi), '[]'::jsonb) from public.meal_items mi join public.meals m on m.id = mi.meal_id where m.user_id = (select auth.uid())),
    'meal_favorites', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.meal_favorites t where t.user_id = (select auth.uid())),
    'programs', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.programs t where t.user_id = (select auth.uid())),
    'program_weeks', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.program_weeks t where t.user_id = (select auth.uid())),
    'planned_workouts', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.planned_workouts t where t.user_id = (select auth.uid())),
    'planned_sets', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.planned_sets t where t.user_id = (select auth.uid())),
    'workout_sessions', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.workout_sessions t where t.user_id = (select auth.uid())),
    'set_logs', (select coalesce(jsonb_agg(sl), '[]'::jsonb) from public.set_logs sl join public.workout_sessions s on s.id = sl.session_id where s.user_id = (select auth.uid())),
    'form_analyses', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.form_analyses t where t.user_id = (select auth.uid())),
    'habits', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.habits t where t.user_id = (select auth.uid())),
    'habit_logs', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.habit_logs t where t.user_id = (select auth.uid())),
    'ai_jobs', (select coalesce(jsonb_agg(t), '[]'::jsonb) from public.ai_jobs t where t.user_id = (select auth.uid()))
  );
$$;
revoke execute on function public.export_account() from public;
grant execute on function public.export_account() to authenticated;
