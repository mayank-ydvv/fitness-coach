import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { todayLocal } from "@/lib/time/localDay";
import { shouldAutoCompleteMeals, shouldAutoCompleteWorkout } from "./autoComplete";

/**
 * Called from session-finish (M3) and meal-insert (M2) to tick auto habits
 * idempotently — upsert on (habit_id, log_date) means calling this twice
 * for the same day is a no-op, not a double-tick.
 */
export async function applyAutoHabits(
  supabase: SupabaseClient<Database>,
  params: { userId: string; trigger: "workout_completed" | "meals_logged" },
): Promise<void> {
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", params.userId).single();
  const timezone = profile?.timezone ?? "UTC";
  const today = todayLocal(timezone);

  if (params.trigger === "workout_completed") {
    const { count } = await supabase
      .from("workout_sessions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", params.userId)
      .not("ended_at", "is", null)
      .gte("started_at", `${today}T00:00:00`)
      .lte("started_at", `${today}T23:59:59`);
    if (!shouldAutoCompleteWorkout(count ?? 0)) return;
  } else {
    const { count } = await supabase
      .from("meals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", params.userId)
      .in("status", ["ready", "manual"])
      .gte("eaten_at", `${today}T00:00:00`)
      .lte("eaten_at", `${today}T23:59:59`);
    if (!shouldAutoCompleteMeals(count ?? 0)) return;
  }

  const { data: habits } = await supabase
    .from("habits")
    .select("id")
    .eq("user_id", params.userId)
    .eq("auto_source", params.trigger)
    .is("archived_at", null);

  for (const habit of habits ?? []) {
    await supabase.from("habit_logs").upsert(
      {
        habit_id: habit.id,
        user_id: params.userId,
        log_date: today,
        status: "done",
        source: params.trigger === "workout_completed" ? "auto_workout" : "auto_meals",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "habit_id,log_date" },
    );
  }
}
