export type WorkingSet = { reps: number; loadKg: number; rpe: number | null; isWarmup: boolean };

export type ProgressionInput = {
  exerciseId: string;
  targetRepsLow: number;
  targetRepsHigh: number;
  targetRpe: number;
  currentLoadKg: number;
  loadIncrementKg: number;
  workingSets: WorkingSet[];
  /** Misses recorded for this exercise across the last 2 sessions, BEFORE
   * this session's result is folded in. The engine decides whether this
   * session adds to that count and whether the combined total triggers a
   * back-off. */
  recentMissCount: number;
};

export type ProgressionOutcome = "increase" | "hold_repeat" | "hold_beat_reps" | "backoff";

export type ProgressionDecision = {
  exerciseId: string;
  previousLoadKg: number;
  nextLoadKg: number;
  outcome: ProgressionOutcome;
  missed: boolean;
  /** The miss count to persist for this exercise going into next session —
   * reset to 0 after a backoff, incremented by 1 on a miss, held on hold/increase. */
  nextMissCount: number;
  reason: string;
};
