/**
 * Estimated session length from set count, rep count, and rest periods —
 * used both to constrain generation and to validate the model's own
 * estimated_minutes is plausible (within +/-25% per the M3 validation loop).
 *
 * Formula: sum of rest periods + ~3s/rep working time + 25s setup per
 * exercise (unracking, adjusting the bench, walking to the next station).
 */
export type SetForLength = { restSeconds: number; repsHigh: number; isWarmup: boolean };
export type ExerciseForLength = { sets: SetForLength[] };

export function estimateSessionMinutes(exercises: ExerciseForLength[]): number {
  let totalSeconds = 0;
  for (const exercise of exercises) {
    totalSeconds += 25; // setup per exercise
    for (const set of exercise.sets) {
      totalSeconds += set.restSeconds;
      totalSeconds += set.repsHigh * 3;
    }
  }
  return Math.round(totalSeconds / 60);
}

/** True if `claimedMinutes` (the model's own estimated_minutes) is within
 * +/-25% of what we compute independently, and doesn't exceed the user's cap. */
export function sessionLengthPlausible(exercises: ExerciseForLength[], claimedMinutes: number, capMinutes: number): boolean {
  const computed = estimateSessionMinutes(exercises);
  const withinTolerance = Math.abs(claimedMinutes - computed) <= computed * 0.25;
  return withinTolerance && computed <= capMinutes * 1.1; // small slack for the tolerance band itself
}
