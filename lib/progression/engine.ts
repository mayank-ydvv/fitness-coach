import type { ProgressionDecision, ProgressionInput } from "./types";

/**
 * The spec's decision tree (§6), verbatim. Pure — zero imports beyond
 * types. Run once per exercise after a session finishes (see
 * app/api/session/[id]/finish/route.ts, which is the only I/O shell around
 * this).
 *
 *   e1RM = load × (1 + reps / 30)    // reps <= 12 only — see lib/training/e1rm.ts
 *   workingSets = sets where is_warmup = false
 *   allHitTop   = every workingSet.reps >= target_reps_high
 *   avgRpe      = mean(workingSets.rpe)  // treat null as target_rpe
 *
 *   if allHitTop and avgRpe <= target_rpe:
 *       nextLoad = load + exercise.load_increment_kg
 *   else if any workingSet.reps < target_reps_low or avgRpe >= target_rpe + 1.5:
 *       record a miss
 *       if misses for this exercise in the last 2 sessions >= 2:
 *           nextLoad = round(load × 0.90)   // 10% back-off, reset miss counter
 *       else:
 *           nextLoad = load                 // repeat and try to beat reps
 *   else:
 *       nextLoad = load                     // hold, target +1 rep on the lowest set
 */
export function decideProgression(input: ProgressionInput): ProgressionDecision {
  const working = input.workingSets.filter((s) => !s.isWarmup);

  if (working.length === 0) {
    return {
      exerciseId: input.exerciseId,
      previousLoadKg: input.currentLoadKg,
      nextLoadKg: input.currentLoadKg,
      outcome: "hold_repeat",
      missed: false,
      nextMissCount: input.recentMissCount,
      reason: "No working sets logged for this exercise — holding load.",
    };
  }

  const allHitTop = working.every((s) => s.reps >= input.targetRepsHigh);
  const avgRpe = mean(working.map((s) => s.rpe ?? input.targetRpe));

  if (allHitTop && avgRpe <= input.targetRpe) {
    return {
      exerciseId: input.exerciseId,
      previousLoadKg: input.currentLoadKg,
      nextLoadKg: round1(input.currentLoadKg + input.loadIncrementKg),
      outcome: "increase",
      missed: false,
      nextMissCount: 0,
      reason: `Hit the top of your rep range at or below target RPE — adding ${input.loadIncrementKg} kg next session.`,
    };
  }

  const anyBelowLow = working.some((s) => s.reps < input.targetRepsLow);
  const rpeTooHigh = avgRpe >= input.targetRpe + 1.5;

  if (anyBelowLow || rpeTooHigh) {
    const combinedMisses = input.recentMissCount + 1;
    if (combinedMisses >= 2) {
      return {
        exerciseId: input.exerciseId,
        previousLoadKg: input.currentLoadKg,
        nextLoadKg: round1(input.currentLoadKg * 0.9),
        outcome: "backoff",
        missed: true,
        nextMissCount: 0,
        reason: "Missed targets on this exercise two sessions in a row — backing off 10% to reset.",
      };
    }
    return {
      exerciseId: input.exerciseId,
      previousLoadKg: input.currentLoadKg,
      nextLoadKg: input.currentLoadKg,
      outcome: "hold_repeat",
      missed: true,
      nextMissCount: combinedMisses,
      reason: "Missed the target this time — repeat the weight and try to beat your reps.",
    };
  }

  return {
    exerciseId: input.exerciseId,
    previousLoadKg: input.currentLoadKg,
    nextLoadKg: input.currentLoadKg,
    outcome: "hold_beat_reps",
    missed: false,
    nextMissCount: 0,
    reason: "Solid session — hold the weight and aim for one more rep on your lowest set.",
  };
}

function mean(values: number[]): number {
  return values.reduce((s, v) => s + v, 0) / values.length;
}
function round1(n: number) {
  return Math.round(n * 10) / 10;
}
