import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SessionPlayer } from "@/components/train/session/SessionPlayer";
import type { PlannedSetView } from "@/hooks/useSessionPlayer";

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session } = await supabase.from("workout_sessions").select("id, planned_workout_id, ended_at").eq("id", sessionId).eq("user_id", user.id).maybeSingle();
  if (!session) redirect("/train");
  if (session.ended_at) redirect(`/train/session/${sessionId}/summary`);

  let plannedSets: PlannedSetView[] = [];
  if (session.planned_workout_id) {
    const { data: sets } = await supabase
      .from("planned_sets")
      .select("id, exercise_id, order_index, set_number, is_warmup, target_reps_low, target_reps_high, target_rpe, target_load_kg, rest_seconds, exercises(name, load_increment_kg)")
      .eq("planned_workout_id", session.planned_workout_id)
      .order("order_index", { ascending: true })
      .order("set_number", { ascending: true });

    plannedSets = (sets ?? []).map((s) => {
      const exercise = s.exercises as unknown as { name: string; load_increment_kg: number } | null;
      return {
        id: s.id,
        exerciseId: s.exercise_id,
        exerciseName: exercise?.name ?? "Exercise",
        loadIncrementKg: exercise?.load_increment_kg ?? 2.5,
        orderIndex: s.order_index,
        setNumber: s.set_number,
        isWarmup: s.is_warmup,
        targetRepsLow: s.target_reps_low,
        targetRepsHigh: s.target_reps_high,
        targetRpe: s.target_rpe,
        targetLoadKg: s.target_load_kg,
        restSeconds: s.rest_seconds,
      };
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <SessionPlayer sessionId={sessionId} plannedSets={plannedSets} />
    </div>
  );
}
