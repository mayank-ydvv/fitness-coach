import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { ExpandedWeek } from "./expand";

/**
 * Writes a full mesocycle. Uses the USER's own client (RLS-scoped), not
 * the admin client — lib/supabase/admin.ts's documented scope deliberately
 * does not include programs/planned_sets, and RLS is the right enforcement
 * boundary here. The user_id-derivation triggers on program_weeks/
 * planned_workouts/planned_sets are `security definer` internally, so they
 * can read the parent's user_id regardless of the inserting role's own RLS
 * visibility — the insert itself still has to pass that table's own RLS
 * policy, which it does because programs.user_id = auth.uid() already.
 */
export async function persistMesocycle(
  supabase: SupabaseClient<Database>,
  params: {
    userId: string;
    name: string;
    goal: string;
    split: string;
    daysPerWeek: number;
    generationInput: Record<string, unknown>;
    generationInputHash: string;
    weeks: ExpandedWeek[];
  },
): Promise<string> {
  const { data: program, error: programError } = await supabase
    .from("programs")
    .insert({
      user_id: params.userId,
      name: params.name,
      goal: params.goal,
      split: params.split,
      days_per_week: params.daysPerWeek,
      total_weeks: params.weeks.length,
      status: "active",
      generation_input: params.generationInput as unknown as Json,
      generation_input_hash: params.generationInputHash,
    })
    .select("id")
    .single();
  if (programError || !program) throw new Error(`Couldn't create the program: ${programError?.message}`);

  for (const week of params.weeks) {
    const { data: weekRow, error: weekError } = await supabase
      .from("program_weeks")
      .insert({
        program_id: program.id,
        // Overwritten by the set_program_week_user trigger regardless —
        // passed here only to satisfy the generated Insert type, which
        // marks user_id required since Postgres itself doesn't know a
        // BEFORE trigger will fill it (there's no column DEFAULT).
        user_id: params.userId,
        week_number: week.weekNumber,
        is_deload: week.isDeload,
        deload_reason: week.deloadReason,
      })
      .select("id")
      .single();
    if (weekError || !weekRow) throw new Error(`Couldn't create week ${week.weekNumber}: ${weekError?.message}`);

    for (const workout of week.workouts) {
      const { data: workoutRow, error: workoutError } = await supabase
        .from("planned_workouts")
        .insert({
          program_week_id: weekRow.id,
          user_id: params.userId, // see comment above on program_weeks
          day_index: workout.dayIndex,
          name: workout.name,
          estimated_minutes: workout.estimatedMinutes,
        })
        .select("id")
        .single();
      if (workoutError || !workoutRow) throw new Error(`Couldn't create workout "${workout.name}": ${workoutError?.message}`);

      if (workout.sets.length === 0) continue;
      const { error: setsError } = await supabase.from("planned_sets").insert(
        workout.sets.map((set) => ({
          planned_workout_id: workoutRow.id,
          user_id: params.userId, // see comment above on program_weeks
          exercise_id: set.exerciseId,
          order_index: set.orderIndex,
          set_number: set.setNumber,
          target_reps_low: set.targetRepsLow,
          target_reps_high: set.targetRepsHigh,
          target_rpe: set.targetRpe,
          target_load_kg: set.targetLoadKg,
          rest_seconds: set.restSeconds,
          is_warmup: set.isWarmup,
          origin: "generated" as const,
        })),
      );
      if (setsError) throw new Error(`Couldn't create sets for "${workout.name}": ${setsError.message}`);
    }
  }

  return program.id;
}
