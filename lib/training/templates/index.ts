import { getSplit } from "@/lib/training/splits";
import type { GeneratedWeek1, ExerciseRef } from "@/lib/program/types";

/**
 * The deterministic fallback used when program generation fails validation
 * twice (spec §6: "a template is strictly better than an apology"). Rather
 * than hand-authoring a separate template per split shape (full-body,
 * upper/lower, PPL), this greedily fills each split day's required
 * movement patterns from the eligible-exercise list — same reliability
 * guarantee (never fails, only ever uses real slugs the user can actually
 * do), less duplication to keep in sync with splits.ts. Picks the first
 * matching exercise per pattern deterministically (sorted by slug) so the
 * same equipment set always produces the same template.
 */
export function buildFallbackWeek1(params: {
  daysPerWeek: number;
  eligibleExercises: ExerciseRef[];
  sessionMinutes: number;
  experienceLevel: "beginner" | "intermediate" | "advanced";
}): GeneratedWeek1 {
  const split = getSplit(params.daysPerWeek);
  const byPattern = new Map<string, ExerciseRef[]>();
  for (const ex of params.eligibleExercises) {
    if (!ex.movementPattern) continue;
    const list = byPattern.get(ex.movementPattern) ?? [];
    list.push(ex);
    byPattern.set(ex.movementPattern, list);
  }
  for (const list of byPattern.values()) list.sort((a, b) => a.slug.localeCompare(b.slug));

  const setsPerExercise = params.experienceLevel === "beginner" ? 3 : 4;
  const rpe = params.experienceLevel === "beginner" ? 7 : 7.5;

  const days = split.map((day) => {
    const used = new Set<string>();
    const exercises = day.patterns
      .map((pattern) => {
        const candidates = byPattern.get(pattern) ?? [];
        const pick = candidates.find((c) => !used.has(c.slug));
        if (!pick) return null;
        used.add(pick.slug);
        return {
          slug: pick.slug,
          sets: setsPerExercise,
          reps_low: 8,
          reps_high: 10,
          rpe,
          rest_seconds: 90,
        };
      })
      .filter((e): e is NonNullable<typeof e> => e !== null);

    return {
      day_index: day.dayIndex,
      name: day.name,
      estimated_minutes: params.sessionMinutes,
      exercises,
    };
  });

  return {
    program_name: "Standard Template",
    rationale: "Built from our standard template, matched to your equipment.",
    days,
  };
}
