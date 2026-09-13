import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { decideProgression } from "./engine";
import { shouldTriggerEarlyDeload } from "./deload";
import type { ProgressionDecision, WorkingSet } from "./types";

/**
 * The I/O shell around the pure engine (lib/progression/engine.ts). Run
 * once per finished session. Three cases handled here, per the plan:
 *
 *  - Double finish: progression_runs.session_id is unique, so a second
 *    call for the same session just returns the stored output.
 *  - Session edited afterwards: not handled here (that's a future edit
 *    flow) — this always runs against whatever set_logs exist right now.
 *  - Logged offline and synced later: irrelevant to *this* function — by
 *    the time finish is called, all set_logs for the session already
 *    exist, however they got there.
 */
export async function applyProgressionForSession(
  supabase: SupabaseClient<Database>,
  params: { userId: string; sessionId: string },
): Promise<{ decisions: ProgressionDecision[]; deloadReason: string | null }> {
  const { data: existingRun } = await supabase
    .from("progression_runs")
    .select("output")
    .eq("session_id", params.sessionId)
    .maybeSingle();
  if (existingRun) {
    return existingRun.output as unknown as { decisions: ProgressionDecision[]; deloadReason: string | null };
  }

  const { data: setLogs, error: setLogsError } = await supabase
    .from("set_logs")
    .select("exercise_id, reps, load_kg, rpe, is_warmup")
    .eq("session_id", params.sessionId);
  if (setLogsError) throw new Error(`Couldn't load set logs: ${setLogsError.message}`);
  if (!setLogs || setLogs.length === 0) {
    return { decisions: [], deloadReason: null };
  }

  const { data: session } = await supabase
    .from("workout_sessions")
    .select("planned_workout_id, planned_workouts(program_week_id, program_weeks(program_id))")
    .eq("id", params.sessionId)
    .single();

  // Scope "next occurrence" candidates to the SAME program this session
  // came from. Without this, a regenerated program's planned_sets (never
  // archived — the M6 cleanup pass for superseded programs was never
  // built) stay eligible forever, so progression can pick an occurrence
  // from a stale or unrelated program as "next".
  const sessionProgramId =
    (session?.planned_workouts as unknown as { program_weeks: { program_id: string } | null } | null)?.program_weeks?.program_id ?? null;
  let sameProgramWorkoutIds: Set<string> | null = null;
  if (sessionProgramId) {
    const { data: programWorkouts } = await supabase
      .from("planned_workouts")
      .select("id, program_weeks!inner(program_id)")
      .eq("program_weeks.program_id", sessionProgramId);
    sameProgramWorkoutIds = new Set((programWorkouts ?? []).map((w) => w.id));
  }

  const byExercise = new Map<string, WorkingSet[]>();
  for (const log of setLogs) {
    const list = byExercise.get(log.exercise_id) ?? [];
    list.push({ reps: log.reps, loadKg: log.load_kg, rpe: log.rpe, isWarmup: log.is_warmup });
    byExercise.set(log.exercise_id, list);
  }

  const decisions: ProgressionDecision[] = [];
  const appliedSetIds: string[] = [];

  for (const [exerciseId, sets] of byExercise) {
    // Find this exercise's planned targets — prefer the same planned
    // workout this session came from; fall back to the most recent
    // planned_set for this exercise if the session wasn't tied to a plan
    // (e.g. an ad-hoc logged exercise).
    let planned: { id: string; target_reps_low: number; target_reps_high: number; target_rpe: number | null; target_load_kg: number | null; exercise: { load_increment_kg: number } } | null = null;

    if (session?.planned_workout_id) {
      const { data } = await supabase
        .from("planned_sets")
        .select("id, target_reps_low, target_reps_high, target_rpe, target_load_kg, exercises(load_increment_kg)")
        .eq("planned_workout_id", session.planned_workout_id)
        .eq("exercise_id", exerciseId)
        .eq("is_warmup", false)
        .limit(1)
        .maybeSingle();
      if (data) {
        planned = { ...data, exercise: { load_increment_kg: (data.exercises as unknown as { load_increment_kg: number } | null)?.load_increment_kg ?? 2.5 } };
      }
    }
    if (!planned) continue; // nothing to progress against

    const currentLoadKg = planned.target_load_kg ?? Math.max(...sets.map((s) => s.loadKg));
    const decision = decideProgression({
      exerciseId,
      targetRepsLow: planned.target_reps_low,
      targetRepsHigh: planned.target_reps_high,
      targetRpe: planned.target_rpe ?? 8,
      currentLoadKg,
      loadIncrementKg: planned.exercise.load_increment_kg,
      workingSets: sets,
      recentMissCount: 0, // TODO(M3 polish): thread the real recent-miss count through once a query for it exists
    });
    decisions.push(decision);

    // Resolve the NEXT unstarted occurrence of this exercise for this
    // user (not "next week" — see the plan's offline-sync case) and apply
    // the decision to ONLY that occurrence, marking origin: 'progression' so
    // expand.ts's template never overwrites a value the engine set.
    //
    // This previously matched every future planned_set for the exercise
    // with a single query and updated all of them at once — meaning one
    // good session silently bumped the load for the entire rest of the
    // mesocycle instead of just the next time the exercise is actually
    // trained. Fixed by ordering candidates by (week_number, day_index),
    // excluding occurrences that already have a finished session, and
    // updating only the earliest-ordered occurrence's rows.
    const { data: candidateSets } = await supabase
      .from("planned_sets")
      .select("id, planned_workout_id, planned_workouts(day_index, program_weeks(week_number))")
      .eq("user_id", params.userId)
      .eq("exercise_id", exerciseId)
      .eq("is_warmup", false)
      .neq("origin", "user_edit"); // never clobber a value the user set by hand

    const { data: completedSessions } = await supabase
      .from("workout_sessions")
      .select("planned_workout_id")
      .eq("user_id", params.userId)
      .not("ended_at", "is", null)
      .not("planned_workout_id", "is", null);
    const completedWorkoutIds = new Set((completedSessions ?? []).map((s) => s.planned_workout_id));

    const upcoming = (candidateSets ?? [])
      .filter((s) => s.planned_workout_id && !completedWorkoutIds.has(s.planned_workout_id))
      .filter((s) => !sameProgramWorkoutIds || sameProgramWorkoutIds.has(s.planned_workout_id as string))
      .map((s) => {
        const pw = s.planned_workouts as unknown as { day_index: number; program_weeks: { week_number: number } | null } | null;
        return {
          id: s.id,
          plannedWorkoutId: s.planned_workout_id as string,
          weekNumber: pw?.program_weeks?.week_number ?? Number.MAX_SAFE_INTEGER,
          dayIndex: pw?.day_index ?? Number.MAX_SAFE_INTEGER,
        };
      })
      .sort((a, b) => a.weekNumber - b.weekNumber || a.dayIndex - b.dayIndex);

    const nextWorkoutId = upcoming[0]?.plannedWorkoutId;
    const idsToUpdate = upcoming.filter((s) => s.plannedWorkoutId === nextWorkoutId).map((s) => s.id);

    if (idsToUpdate.length > 0) {
      const { error: updateError } = await supabase
        .from("planned_sets")
        .update({ target_load_kg: decision.nextLoadKg, origin: "progression" })
        .in("id", idsToUpdate);
      if (!updateError) appliedSetIds.push(...idsToUpdate);
      else console.error("[progression] failed to update next occurrence:", updateError.message);
    }
  }

  const { reason: deloadReason } = shouldTriggerEarlyDeload(decisions);

  const { error: runError } = await supabase.from("progression_runs").insert({
    user_id: params.userId,
    session_id: params.sessionId,
    input: { setLogCount: setLogs.length },
    output: { decisions, deloadReason },
    applied_set_ids: appliedSetIds,
  });
  if (runError) console.error("[progression] failed to write progression_runs:", runError.message);

  return { decisions, deloadReason };
}
