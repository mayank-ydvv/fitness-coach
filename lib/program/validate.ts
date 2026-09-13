import type { Goal, MovementPattern } from "@/lib/types";
import { getSplit } from "@/lib/training/splits";
import { reportVolume } from "@/lib/training/volume";
import { estimateSessionMinutes } from "@/lib/training/sessionLength";
import { excludedSlugsFor, excludedPatternsFor } from "@/lib/training/contraindications";
import type { ExerciseRef, GeneratedWeek1, Violation } from "./types";

export type ValidateParams = {
  week: GeneratedWeek1;
  eligibleExercises: ExerciseRef[];
  daysPerWeek: number;
  goal: Goal;
  sessionCapMinutes: number;
  limitations: string | null | undefined;
  /** Widen the volume band by +/-N sets — pass 1 on the retry only, per the
   * plan ("failing twice over 21-vs-20 wastes a call"). */
  bandWidening?: number;
};

/**
 * The ordered validation checks (spec §6 / M3 plan), cheapest and most
 * diagnostic first. Pure — never throws, always returns the full list of
 * violations found (not just the first) so the retry prompt can address
 * everything in one pass.
 */
export function validateWeek1(params: ValidateParams): Violation[] {
  const { week, eligibleExercises, daysPerWeek, goal, sessionCapMinutes, limitations, bandWidening = 0 } = params;
  const violations: Violation[] = [];

  const eligibleBySlug = new Map(eligibleExercises.map((e) => [e.slug, e]));

  // 1. Slug membership — no fuzzy matching.
  for (const day of week.days) {
    for (const ex of day.exercises) {
      if (!eligibleBySlug.has(ex.slug)) {
        violations.push({
          path: `day[${day.day_index}].exercises[${ex.slug}]`,
          message: `"${ex.slug}" is not in the allowed list.`,
          fix: "Replace with a slug from ALLOWED_SLUGS.",
        });
      }
    }
  }
  if (violations.length > 0) return violations; // no point checking further with invalid slugs

  // 2. Structure: exactly daysPerWeek days, day_index unique and contiguous from 0.
  if (week.days.length !== daysPerWeek) {
    violations.push({
      path: "days",
      message: `Expected exactly ${daysPerWeek} days, got ${week.days.length}.`,
      fix: `Return exactly ${daysPerWeek} days with day_index 0..${daysPerWeek - 1}.`,
    });
  }
  const indices = week.days.map((d) => d.day_index).sort((a, b) => a - b);
  const expectedIndices = Array.from({ length: daysPerWeek }, (_, i) => i);
  if (JSON.stringify(indices) !== JSON.stringify(expectedIndices)) {
    violations.push({
      path: "days[].day_index",
      message: `day_index values must be unique and contiguous from 0. Got: ${indices.join(",")}.`,
      fix: `Use day_index 0..${daysPerWeek - 1}, each exactly once.`,
    });
  }

  const split = getSplit(daysPerWeek);
  const excludedSlugs = excludedSlugsFor(limitations);
  const excludedPatterns = excludedPatternsFor(limitations);

  for (const day of week.days) {
    const splitDay = split.find((s) => s.dayIndex === day.day_index);

    // 6. Limitation compliance.
    for (const ex of day.exercises) {
      if (excludedSlugs.has(ex.slug)) {
        violations.push({
          path: `day[${day.day_index}].exercises[${ex.slug}]`,
          message: `"${ex.slug}" conflicts with a stated limitation.`,
          fix: "Replace with a slug that shares the same movement_pattern but avoids the limitation.",
        });
      }
      const exercise = eligibleBySlug.get(ex.slug);
      if (exercise?.movementPattern && excludedPatterns.has(exercise.movementPattern as MovementPattern)) {
        violations.push({
          path: `day[${day.day_index}].exercises[${ex.slug}]`,
          message: `movement_pattern "${exercise.movementPattern}" conflicts with a stated limitation.`,
          fix: "Substitute a different movement pattern for this day.",
        });
      }
    }

    // 5. Session length: +/-25% of the claimed estimate, and within the cap.
    const computedMinutes = estimateSessionMinutes(
      day.exercises.map((ex) => ({
        sets: Array.from({ length: ex.sets }, () => ({ restSeconds: ex.rest_seconds, repsHigh: ex.reps_high, isWarmup: false })),
      })),
    );
    if (Math.abs(day.estimated_minutes - computedMinutes) > computedMinutes * 0.25) {
      violations.push({
        path: `day[${day.day_index}].estimated_minutes`,
        message: `Claimed ${day.estimated_minutes} min but the set/rest/rep counts imply ~${computedMinutes} min.`,
        fix: "Either reduce sets/reps or correct estimated_minutes to match.",
      });
    }
    if (computedMinutes > sessionCapMinutes * 1.1) {
      violations.push({
        path: `day[${day.day_index}]`,
        message: `This day runs ~${computedMinutes} min, over the ${sessionCapMinutes} min session cap.`,
        fix: "Remove sets or exercises to fit the session cap.",
      });
    }

    // 7. Pattern coverage — every pattern the split template requires
    // appears at least once that day (skip patterns excluded by a limitation).
    if (splitDay) {
      const dayPatterns = new Set(day.exercises.map((ex) => eligibleBySlug.get(ex.slug)?.movementPattern).filter(Boolean));
      const requiredPatterns = splitDay.patterns.filter((p) => !excludedPatterns.has(p));
      for (const pattern of requiredPatterns) {
        if (!dayPatterns.has(pattern)) {
          violations.push({
            path: `day[${day.day_index}].patterns`,
            message: `"${splitDay.name}" is missing a "${pattern}" exercise.`,
            fix: `Add an exercise with movement_pattern "${pattern}" from the allowed list.`,
          });
        }
      }
    }
  }

  // 4. Volume bounds — only for groups with >=1.0 credit (spec: zero-credit
  // groups are "not directly trained", not a failure), only non-deload
  // weeks (week 1 always is).
  const allSets = week.days.flatMap((day) =>
    day.exercises.flatMap((ex) => {
      const exercise = eligibleBySlug.get(ex.slug);
      if (!exercise) return [];
      return Array.from({ length: ex.sets }, () => ({
        isWarmup: false,
        primaryMuscle: exercise.primaryMuscle,
        secondaryMuscles: exercise.secondaryMuscles,
      }));
    }),
  );
  const volumeReport = reportVolume(allSets, goal, bandWidening);
  for (const v of volumeReport.outOfBand) {
    const over = v.credit > v.max;
    violations.push({
      path: "week.volume",
      message: `${v.group} = ${v.credit} hard sets, ${over ? `the cap is ${v.max}` : `the minimum is ${v.min}`}.`,
      fix: over ? `Remove ${Math.ceil(v.credit - v.max)} ${v.group} sets.` : `Add ${Math.ceil(v.min - v.credit)} ${v.group} sets.`,
    });
  }

  return violations;
}
