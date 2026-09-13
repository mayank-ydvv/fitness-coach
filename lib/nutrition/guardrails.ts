/**
 * Wellbeing guardrails (spec §11). Hard-coded, never model output. Every
 * function here is pure — no I/O, no React — so it can be exercised by
 * targets.test-cases.ts without a server or a browser.
 */

export type { GuardrailNotice } from "./types";
import type { GuardrailNotice } from "./types";

/** Never below 1500 kcal (men) / 1200 (women) / 1350 (unspecified, the
 * midpoint) — or 80% of BMR, whichever is higher. */
export function kcalFloor(sex: "male" | "female" | "unspecified", bmr: number): number {
  const sexFloor = sex === "male" ? 1500 : sex === "female" ? 1200 : 1350;
  return Math.max(sexFloor, Math.round(bmr * 0.8));
}

/** Clamp a computed kcal target to the floor. Returns the clamped value and,
 * if clamping happened, a notice to show the user once. */
export function applyKcalFloor(
  targetKcal: number,
  sex: "male" | "female" | "unspecified",
  bmr: number,
): { kcal: number; notice: GuardrailNotice | null } {
  const floor = kcalFloor(sex, bmr);
  if (targetKcal >= floor) return { kcal: targetKcal, notice: null };
  return {
    kcal: floor,
    notice: {
      code: "kcal_floor_clamped",
      message: `Your target is set to ${floor} kcal — that's the safe floor for your stats, not a lower number derived from your goal.`,
    },
  };
}

/**
 * Cap the rate of loss at 1% of bodyweight per week. 1 kg of fat is ~7700
 * kcal, so the max weekly deficit is 0.01 * weightKg * 7700, i.e. a daily
 * deficit cap of that / 7.
 *
 * Note: at the spec's fixed 20% deficit this essentially never binds — it
 * would take a bodyweight-to-TDEE ratio no real adult has. Implemented
 * anyway, with this comment, so the next person doesn't assume it's dead
 * code when a future custom-deficit slider makes it load-bearing.
 */
export function capLossRate(
  deficitKcalPerDay: number,
  weightKg: number,
): { deficit: number; notice: GuardrailNotice | null } {
  const maxWeeklyDeficit = 0.01 * weightKg * 7700;
  const maxDailyDeficit = maxWeeklyDeficit / 7;
  if (deficitKcalPerDay <= maxDailyDeficit) return { deficit: deficitKcalPerDay, notice: null };
  return {
    deficit: maxDailyDeficit,
    notice: {
      code: "loss_rate_capped",
      message: "Your deficit is capped at 1% of bodyweight lost per week — faster loss isn't worth the muscle and energy cost.",
    },
  };
}

/** Refuse a goal weight below BMI 18.5. State the floor once, don't lecture.
 * Not currently wired to onboarding (onboarding collects current weight,
 * not a goal weight) — kept for the weekly check-in / goal-setting flow
 * that will collect one. */
export function refuseGoalWeightBelowBmiFloor(
  heightCm: number,
  goalWeightKg: number,
): { allowed: boolean; floorKg: number; notice: GuardrailNotice | null } {
  const heightM = heightCm / 100;
  const floorKg = Math.round(18.5 * heightM * heightM * 10) / 10;
  if (goalWeightKg >= floorKg) return { allowed: true, floorKg, notice: null };
  return {
    allowed: false,
    floorKg,
    notice: {
      code: "goal_weight_below_bmi_floor",
      message: `${floorKg} kg is the lowest goal weight we'll set for your height (BMI 18.5).`,
    },
  };
}

/** Reference weight for protein/fat g-per-kg targets: the user's actual
 * weight, capped at their BMI-25-equivalent weight. This is what stops a
 * heavier user's protein AND fat targets from scaling up without bound —
 * the spec explicitly caps protein's reference weight this way; capping
 * fat's the same way is a deliberate extension (see targets.ts) that keeps
 * the two floors from eating the entire kcal budget before any carbs. */
export function macroReferenceWeightKg(actualWeightKg: number, heightCm: number): number {
  const heightM = heightCm / 100;
  const bmi25WeightKg = 25 * heightM * heightM;
  return Math.min(actualWeightKg, bmi25WeightKg);
}
