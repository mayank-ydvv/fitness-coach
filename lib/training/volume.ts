import { MUSCLE_GROUPS, creditSets, type MuscleGroup, type SetForCredit } from "./muscleGroups";
import type { Goal } from "@/lib/types";

/** Weekly hard-sets-per-group bounds (spec §6): 10-20 for hypertrophy goals,
 * 8-14 for strength (higher intensity, lower volume). Goals that aren't
 * explicitly volume-oriented (endurance, general_health) use the
 * hypertrophy band as the closer default. */
export function volumeBand(goal: Goal): { min: number; max: number } {
  if (goal === "strength") return { min: 8, max: 14 };
  return { min: 10, max: 20 };
}

export type VolumeReport = {
  credit: Record<MuscleGroup, number>;
  /** Groups with >=1.0 credit — the only ones the band applies to. A 2-day
   * full-body program can't mathematically hit 10 sets on all 8 groups;
   * zero-credit groups are reported as "not directly trained", not a
   * validation failure (spec §6: band applies per major group actually
   * trained, and only on non-deload weeks — deload is handled by the
   * caller, which shouldn't call this on a deload week at all). */
  trainedGroups: MuscleGroup[];
  outOfBand: { group: MuscleGroup; credit: number; min: number; max: number }[];
};

export function reportVolume(sets: SetForCredit[], goal: Goal, bandWidening = 0): VolumeReport {
  const credit = creditSets(sets);
  const { min, max } = volumeBand(goal);
  const trainedGroups = MUSCLE_GROUPS.filter((g) => credit[g] >= 1.0);
  const outOfBand = trainedGroups
    .filter((g) => credit[g] < min - bandWidening || credit[g] > max + bandWidening)
    .map((g) => ({ group: g, credit: credit[g], min, max }));
  return { credit, trainedGroups, outOfBand };
}
