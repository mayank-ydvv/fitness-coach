import { weekStartLocal } from "@/lib/time/localDay";
import type { HabitLogStatus } from "./streaks";

/** Daily vs N-per-week completion for a given local week (spec §8:
 * cadence + target_per_week). */
export function weekCompletionRate(logs: HabitLogStatus[], weekStartDate: string, targetPerWeek: number): { done: number; target: number; rate: number } {
  const doneThisWeek = logs.filter((l) => l.status === "done" && weekStartLocal(l.logDate) === weekStartDate).length;
  return { done: doneThisWeek, target: targetPerWeek, rate: targetPerWeek > 0 ? Math.min(1, doneThisWeek / targetPerWeek) : 0 };
}
