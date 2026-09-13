-- Security-advisor follow-up. Supabase auto-grants EXECUTE to `anon` and
-- `authenticated` directly (not just via the PUBLIC pseudo-role) on every
-- new function in `public`, so `revoke ... from public` in 0002/0005/0006/0010
-- did not actually strip anon's access. Revoke explicitly per role here.

-- Trigger-only functions: never meant to be called directly by anyone,
-- anon or authenticated. Revoke from both.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_program_week_user() from public, anon, authenticated;
revoke execute on function public.set_planned_workout_user() from public, anon, authenticated;
revoke execute on function public.set_planned_set_user() from public, anon, authenticated;
revoke execute on function public.reject_stale_habit_log() from public, anon, authenticated;

-- Fix mutable search_path on the trigger function added in 0006 (missed
-- there; every other function already sets it at creation).
create or replace function public.reject_stale_habit_log()
returns trigger language plpgsql set search_path = '' as $$
begin
  if TG_OP = 'UPDATE' and new.updated_at < old.updated_at then
    return old;
  end if;
  return new;
end;
$$;

-- Callable RPCs: signed-in users only, never anon. Explicit anon revoke —
-- the earlier `grant ... to authenticated` never touched anon, but it also
-- never removed the auto-grant anon already had.
revoke execute on function public.check_daily_cap(job_kind, int) from anon;
revoke execute on function public.delete_account() from anon;
revoke execute on function public.export_account() from anon;
