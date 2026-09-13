"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { epley } from "@/lib/training/e1rm";

export type PlannedSetView = {
  id: string;
  exerciseId: string;
  exerciseName: string;
  loadIncrementKg: number;
  orderIndex: number;
  setNumber: number;
  isWarmup: boolean;
  targetRepsLow: number;
  targetRepsHigh: number;
  targetRpe: number | null;
  targetLoadKg: number | null;
  restSeconds: number;
};

export type CompletedSet = PlannedSetView & { actualReps: number; actualLoadKg: number; actualRpe: number | null };

/** Owns the session's set-by-set cursor and the log-a-set mutation.
 * Client-generates every set_logs.id (M0's UUID rule) so a retry or an
 * eventual offline-outbox replay (M6) is a no-op, not a duplicate. */
export function useSessionPlayer(sessionId: string, plannedSets: PlannedSetView[], lastPerformance: Record<string, { loadKg: number; reps: number; rpe: number | null }>) {
  const [completed, setCompleted] = useState<CompletedSet[]>([]);
  const [pending, setPending] = useState(false);

  const sorted = useMemo(() => [...plannedSets].sort((a, b) => a.orderIndex - b.orderIndex || a.setNumber - b.setNumber), [plannedSets]);
  const completedIds = useMemo(() => new Set(completed.map((c) => c.id)), [completed]);
  const remaining = sorted.filter((s) => !completedIds.has(s.id));
  const current = remaining[0] ?? null;

  const currentExerciseSets = current ? sorted.filter((s) => s.exerciseId === current.exerciseId) : [];
  const currentSetPositionInExercise = current ? currentExerciseSets.findIndex((s) => s.id === current.id) + 1 : 0;

  async function logSet(actualReps: number, actualLoadKg: number, actualRpe: number | null): Promise<{ ok: boolean; isPr: boolean }> {
    if (!current) return { ok: false, isPr: false };
    setPending(true);
    const supabase = createClient();
    if (!supabase) {
      setPending(false);
      return { ok: false, isPr: false };
    }

    const id = crypto.randomUUID();
    const { value: e1rmValue, trusted } = epley(actualLoadKg, actualReps);
    const previousBest = lastPerformance[current.exerciseId];
    const previousE1rm = previousBest ? epley(previousBest.loadKg, previousBest.reps).value : 0;
    const isPr = !current.isWarmup && trusted && e1rmValue > previousE1rm;

    const { error } = await supabase.from("set_logs").insert({
      id,
      session_id: sessionId,
      exercise_id: current.exerciseId,
      set_number: current.setNumber,
      reps: actualReps,
      load_kg: actualLoadKg,
      rpe: actualRpe,
      is_warmup: current.isWarmup,
      e1rm: e1rmValue,
      e1rm_trusted: trusted,
    });

    setPending(false);
    if (error) return { ok: false, isPr: false };

    setCompleted((prev) => [...prev, { ...current, actualReps, actualLoadKg, actualRpe }]);
    return { ok: true, isPr };
  }

  const totalVolumeKg = completed.reduce((sum, s) => sum + s.actualLoadKg * s.actualReps, 0);

  return {
    current,
    currentSetPositionInExercise,
    currentExerciseTotalSets: currentExerciseSets.length,
    remainingCount: remaining.length,
    totalCount: sorted.length,
    completed,
    pending,
    logSet,
    totalVolumeKg,
    isDone: current === null,
  };
}
