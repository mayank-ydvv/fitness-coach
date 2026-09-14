import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { StartSessionButton } from "@/components/train/StartSessionButton";
import { Dumbbell } from "lucide-react";

export default async function TrainPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: program } = await supabase
    .from("programs")
    .select("id, name, split, total_weeks")
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!program) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-ink-primary">Train</h1>
        <Card>
          <EmptyState
            icon={<Dumbbell size={28} />}
            line="No program yet. Build one from your goals, equipment, and schedule."
            action={
              <Link href="/train/program/new">
                <Button>Build a program</Button>
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  // "Next unstarted occurrence" — the same principle the progression
  // engine uses for offline-synced sessions: the first planned_workout (by
  // week, then day) with no workout_sessions row against it yet.
  const { data: weeks } = await supabase
    .from("program_weeks")
    .select("id, week_number, is_deload, planned_workouts(id, day_index, name, estimated_minutes)")
    .eq("program_id", program.id)
    .order("week_number", { ascending: true });

  const { data: sessions } = await supabase.from("workout_sessions").select("planned_workout_id").eq("user_id", user.id);
  const startedWorkoutIds = new Set((sessions ?? []).map((s) => s.planned_workout_id).filter(Boolean));

  let nextWorkout: { id: string; name: string; estimatedMinutes: number | null; weekNumber: number; isDeload: boolean } | null = null;
  outer: for (const week of weeks ?? []) {
    const sorted = [...(week.planned_workouts ?? [])].sort((a, b) => a.day_index - b.day_index);
    for (const workout of sorted) {
      if (!startedWorkoutIds.has(workout.id)) {
        nextWorkout = { id: workout.id, name: workout.name, estimatedMinutes: workout.estimated_minutes, weekNumber: week.week_number, isDeload: week.is_deload };
        break outer;
      }
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-ink-primary">Train</h1>

      <Card>
        <p className="text-sm font-medium text-ink-primary">{program.name}</p>
        <p className="text-sm text-ink-muted">{program.split?.replace(/_/g, " ")}</p>
      </Card>

      {nextWorkout ? (
        <Card className="flex flex-col gap-3">
          <div>
            <p className="text-sm text-ink-muted">
              Week {nextWorkout.weekNumber} of {program.total_weeks}
              {nextWorkout.isDeload ? " — deload week" : ""}
            </p>
            <p className="text-lg font-medium text-ink-primary">{nextWorkout.name}</p>
            {nextWorkout.estimatedMinutes ? <p className="text-sm text-ink-muted">About {nextWorkout.estimatedMinutes} minutes</p> : null}
          </div>
          <StartSessionButton plannedWorkoutId={nextWorkout.id} />
        </Card>
      ) : (
        <Card>
          <p className="text-sm text-ink-muted">You&apos;ve completed every workout in this program. Build a new one to keep going.</p>
        </Card>
      )}

      <div className="flex flex-col gap-2">
        <Link href="/train/library" className="text-sm font-medium text-ink-primary underline underline-offset-2">
          Browse exercise library
        </Link>
        <Link href="/train/form" className="text-sm font-medium text-ink-primary underline underline-offset-2">
          Check your form
        </Link>
      </div>
    </div>
  );
}
