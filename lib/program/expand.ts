import type { ExerciseRef, GeneratedWeek1 } from "./types";

/**
 * Week 1 (from the model) -> a full 6-week mesocycle, entirely in code.
 * This is the correctness decision behind "ask the model for week 1 only"
 * (M3 plan): weeks 2-6 are arithmetic, not exercise selection, and the
 * model is bad at the former and good at the latter.
 *
 * `target_load_kg` is null everywhere at generation time — nobody has
 * logged a single set on THIS program yet, so there is no real number to
 * put there for anyone, beginner or advanced ("find your working weight"
 * generalizes to every new program, not just beginners' first week). The
 * progression engine (lib/progression/) is the only thing that ever writes
 * a real load, starting from each exercise's first logged session, and it
 * marks the sets it touches `origin: 'progression'` so this expansion
 * never clobbers a value the user or the engine set by hand.
 */
export type ExpandedSet = {
  exerciseId: string;
  orderIndex: number;
  setNumber: number;
  targetRepsLow: number;
  targetRepsHigh: number;
  targetRpe: number | null;
  targetLoadKg: number | null;
  restSeconds: number;
  isWarmup: boolean;
};

export type ExpandedWorkout = { dayIndex: number; name: string; estimatedMinutes: number; sets: ExpandedSet[] };
export type ExpandedWeek = { weekNumber: number; isDeload: boolean; deloadReason: string | null; workouts: ExpandedWorkout[] };

const TOTAL_WEEKS = 6;
const DELOAD_WEEK = 6; // spec says "week 5 or 6" — deterministically pick the last week.
const DELOAD_SET_FRACTION = 0.6;
const DELOAD_RPE_CAP = 6;

export function expandToMesocycle(week1: GeneratedWeek1, eligibleBySlug: Map<string, ExerciseRef>): ExpandedWeek[] {
  const weeks: ExpandedWeek[] = [];

  for (let weekNumber = 1; weekNumber <= TOTAL_WEEKS; weekNumber++) {
    const isDeload = weekNumber === DELOAD_WEEK;

    const workouts: ExpandedWorkout[] = week1.days.map((day) => {
      const sets: ExpandedSet[] = [];
      let orderIndex = 0;

      for (const ex of day.exercises) {
        const exercise = eligibleBySlug.get(ex.slug);
        if (!exercise) continue;

        const targetRpe = isDeload ? Math.min(ex.rpe, DELOAD_RPE_CAP) : ex.rpe;
        const workingSetCount = isDeload ? Math.max(1, Math.round(ex.sets * DELOAD_SET_FRACTION)) : ex.sets;

        // One warmup set, no prescribed load — with target_load_kg null
        // there's no numeric "50% of working weight" to compute, so this
        // is a prompt for the user to warm up at their own chosen light
        // weight rather than a synthesized number. Skipped for core work
        // and on deload weeks, where a full warmup isn't needed.
        if (!isDeload && exercise.movementPattern !== "core") {
          sets.push({
            exerciseId: exercise.id,
            orderIndex,
            setNumber: 0,
            targetRepsLow: 8,
            targetRepsHigh: 8,
            targetRpe: null,
            targetLoadKg: null,
            restSeconds: 60,
            isWarmup: true,
          });
        }

        for (let setNumber = 1; setNumber <= workingSetCount; setNumber++) {
          sets.push({
            exerciseId: exercise.id,
            orderIndex,
            setNumber,
            targetRepsLow: ex.reps_low,
            targetRepsHigh: ex.reps_high,
            targetRpe,
            targetLoadKg: null, // "find your working weight" — see file header
            restSeconds: ex.rest_seconds,
            isWarmup: false,
          });
        }
        orderIndex++;
      }

      return {
        dayIndex: day.day_index,
        name: day.name,
        estimatedMinutes: isDeload ? Math.round(day.estimated_minutes * DELOAD_SET_FRACTION) : day.estimated_minutes,
        sets,
      };
    });

    weeks.push({
      weekNumber,
      isDeload,
      deloadReason: isDeload ? "Scheduled deload — lighter on purpose to let you recover before the next block." : null,
      workouts,
    });
  }

  return weeks;
}
