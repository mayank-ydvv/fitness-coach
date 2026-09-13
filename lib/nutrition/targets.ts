import type { ActivityLevel, Goal, Sex } from "@/lib/types";
import { applyKcalFloor, capLossRate, macroReferenceWeightKg } from "./guardrails";
import type { GuardrailNotice, NutritionTargetsResult } from "./types";

const ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  high: 1.725,
  athlete: 1.9,
};

/** Mifflin-St Jeor. The spec only gives male/female constants; for
 * 'unspecified' we use the average of the two sex constants (+5 / -161 ->
 * -78) rather than defaulting to either — a documented, deliberate choice,
 * not an oversight. */
export function mifflinStJeorBmr(sex: Sex, weightKg: number, heightCm: number, ageYears: number): number {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === "male") return base + 5;
  if (sex === "female") return base - 161;
  return base - 78;
}

const CARB_FLOOR_G = 50;
const PROTEIN_G_PER_KG_DEFAULT = 1.8;
const PROTEIN_G_PER_KG_FLOOR = 1.6; // spec: 1.6-2.2 g/kg range
const FAT_G_PER_KG_DEFAULT = 1.0;
const FAT_G_PER_KG_FLOOR = 0.8; // spec: minimum 0.8 g/kg

/**
 * Protein and fat, then carbs as the remainder. If the remainder would dip
 * below a 50g carb floor (the case that bites hardest at the kcal floor for
 * a heavy user — see targets.test-cases.ts), reduce in the documented
 * order: fat down to its floor, then protein down to its floor, and only
 * then raise kcal itself so the carb floor holds.
 */
function computeMacros(
  kcal: number,
  refWeightKg: number,
): { kcal: number; proteinG: number; fatG: number; carbsG: number; notice: GuardrailNotice | null } {
  let proteinGPerKg = PROTEIN_G_PER_KG_DEFAULT;
  let fatGPerKg = FAT_G_PER_KG_DEFAULT;

  const carbsFor = (p: number, f: number) => (kcal - p * 4 - f * 9) / 4;

  let proteinG = proteinGPerKg * refWeightKg;
  let fatG = fatGPerKg * refWeightKg;
  let carbsG = carbsFor(proteinG, fatG);

  if (carbsG >= CARB_FLOOR_G) {
    return { kcal: round(kcal), proteinG: round(proteinG), fatG: round(fatG), carbsG: round(carbsG), notice: null };
  }

  // Step 1: fat down to its floor.
  fatGPerKg = FAT_G_PER_KG_FLOOR;
  fatG = fatGPerKg * refWeightKg;
  carbsG = carbsFor(proteinG, fatG);

  if (carbsG < CARB_FLOOR_G) {
    // Step 2: protein down to its floor.
    proteinGPerKg = PROTEIN_G_PER_KG_FLOOR;
    proteinG = proteinGPerKg * refWeightKg;
    carbsG = carbsFor(proteinG, fatG);
  }

  if (carbsG < CARB_FLOOR_G) {
    // Step 3: both macros are already at their floors and carbs still
    // don't clear 50g — raise kcal itself just enough to hit the floor.
    kcal = Math.round(proteinG * 4 + fatG * 9 + CARB_FLOOR_G * 4);
    carbsG = CARB_FLOOR_G;
  }

  return {
    kcal: round(kcal),
    proteinG: round(proteinG),
    fatG: round(fatG),
    carbsG: round(carbsG),
    notice: {
      code: "carb_floor_rebalanced",
      message: "We adjusted your protein and fat targets down slightly to keep enough carbs for energy.",
    },
  };
}

function round(n: number) {
  return Math.round(n);
}

export type NutritionTargetsInput = {
  sex: Sex;
  ageYears: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
};

export type { NutritionTargetsResult };

/** Pure. No I/O. Computes a full day's targets and every guardrail notice
 * that applied, in the order they were evaluated. */
export function computeNutritionTargets(input: NutritionTargetsInput): NutritionTargetsResult {
  const { sex, ageYears, heightCm, weightKg, activityLevel, goal } = input;
  const notices: GuardrailNotice[] = [];

  const bmr = mifflinStJeorBmr(sex, weightKg, heightCm, ageYears);
  const tdee = bmr * ACTIVITY_MULTIPLIER[activityLevel];

  let kcalBeforeFloor: number;
  let method: string;

  if (goal === "fat_loss") {
    const rawDeficit = tdee * 0.2;
    const { deficit, notice } = capLossRate(rawDeficit, weightKg);
    if (notice) notices.push(notice);
    kcalBeforeFloor = tdee - deficit;
    method = "mifflin_st_jeor_deficit_20pct_capped_1pct_bodyweight_per_week";
  } else if (goal === "muscle_gain") {
    kcalBeforeFloor = tdee * 1.1;
    method = "mifflin_st_jeor_surplus_10pct";
  } else {
    // strength / endurance / general_health: the spec's §11 formula only
    // defines fat_loss / muscle_gain / maintenance explicitly — the other
    // three goals map to maintenance, documented here rather than silently.
    kcalBeforeFloor = tdee;
    method = "mifflin_st_jeor_maintenance";
  }

  const { kcal: kcalAfterFloor, notice: floorNotice } = applyKcalFloor(kcalBeforeFloor, sex, bmr);
  if (floorNotice) notices.push(floorNotice);

  const refWeightKg = macroReferenceWeightKg(weightKg, heightCm);
  const macros = computeMacros(kcalAfterFloor, refWeightKg);
  if (macros.notice) notices.push(macros.notice);

  return {
    kcal: macros.kcal,
    proteinG: macros.proteinG,
    carbsG: macros.carbsG,
    fatG: macros.fatG,
    method,
    rationale: `BMR ${round(bmr)} kcal x ${ACTIVITY_MULTIPLIER[activityLevel]} activity = ${round(tdee)} kcal maintenance.`,
    notices,
  };
}
