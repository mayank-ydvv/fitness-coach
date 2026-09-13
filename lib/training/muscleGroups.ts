/**
 * The 8-way muscle-group rollup volume is validated against. `exercises`
 * seeds `primary_muscle`/`secondary_muscles` directly in these 8 names (no
 * finer subgroups like "lats" vs "mid-back" exist in this schema), so
 * rollup() is a pass-through today — written as a real mapping anyway so a
 * future finer-grained muscle taxonomy is a one-file change, not a rewrite
 * of every caller.
 */
export const MUSCLE_GROUPS = ["chest", "back", "quads", "hamstrings", "glutes", "shoulders", "arms", "core"] as const;
export type MuscleGroup = (typeof MUSCLE_GROUPS)[number];

const GROUP_SET = new Set<string>(MUSCLE_GROUPS);

export function rollupMuscle(name: string): MuscleGroup | null {
  return GROUP_SET.has(name) ? (name as MuscleGroup) : null;
}

export type SetForCredit = {
  isWarmup: boolean;
  primaryMuscle: string;
  secondaryMuscles: string[];
};

/** A set counts 1.0 toward its primary muscle and 0.5 toward each secondary
 * (spec §6's volume-accounting rule). Warmup sets never count — validate on
 * working sets only. */
export function creditSets(sets: SetForCredit[]): Record<MuscleGroup, number> {
  const credit = Object.fromEntries(MUSCLE_GROUPS.map((g) => [g, 0])) as Record<MuscleGroup, number>;
  for (const set of sets) {
    if (set.isWarmup) continue;
    const primary = rollupMuscle(set.primaryMuscle);
    if (primary) credit[primary] += 1.0;
    for (const secondary of set.secondaryMuscles) {
      const g = rollupMuscle(secondary);
      if (g) credit[g] += 0.5;
    }
  }
  return credit;
}
