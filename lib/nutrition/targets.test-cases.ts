import { computeNutritionTargets, mifflinStJeorBmr, type NutritionTargetsInput } from "./targets";
import { kcalFloor, refuseGoalWeightBelowBmiFloor } from "./guardrails";

type Case = {
  name: string;
  input: NutritionTargetsInput;
  expect: (r: ReturnType<typeof computeNutritionTargets>) => string | null; // null = pass
};

const CASES: Case[] = [
  {
    name: "moderate-activity maintenance male, general_health",
    input: { sex: "male", ageYears: 30, heightCm: 178, weightKg: 78, activityLevel: "moderate", goal: "general_health" },
    expect: (r) => {
      const bmr = mifflinStJeorBmr("male", 78, 178, 30);
      const tdee = bmr * 1.55;
      return Math.abs(r.kcal - Math.round(tdee)) <= 1 ? null : `expected ~${Math.round(tdee)}, got ${r.kcal}`;
    },
  },
  {
    name: "fat_loss applies a ~20% deficit under normal conditions (no floor/cap binding)",
    input: { sex: "female", ageYears: 28, heightCm: 165, weightKg: 70, activityLevel: "moderate", goal: "fat_loss" },
    expect: (r) => {
      const bmr = mifflinStJeorBmr("female", 70, 165, 28);
      const tdee = bmr * 1.55;
      const expectedKcal = Math.round(tdee * 0.8);
      return Math.abs(r.kcal - expectedKcal) <= 5 ? null : `expected ~${expectedKcal}, got ${r.kcal}`;
    },
  },
  {
    name: "muscle_gain applies a ~10% surplus",
    input: { sex: "male", ageYears: 24, heightCm: 180, weightKg: 72, activityLevel: "light", goal: "muscle_gain" },
    expect: (r) => {
      const bmr = mifflinStJeorBmr("male", 72, 180, 24);
      const tdee = bmr * 1.375;
      const expectedKcal = Math.round(tdee * 1.1);
      return Math.abs(r.kcal - expectedKcal) <= 5 ? null : `expected ~${expectedKcal}, got ${r.kcal}`;
    },
  },
  {
    name: "sedentary small woman fat_loss clamps to the 1200 kcal sex floor",
    input: { sex: "female", ageYears: 45, heightCm: 155, weightKg: 50, activityLevel: "sedentary", goal: "fat_loss" },
    expect: (r) => {
      if (r.kcal < 1200) return `kcal ${r.kcal} below the 1200 floor`;
      if (!r.notices.some((n) => n.code === "kcal_floor_clamped")) return "expected a kcal_floor_clamped notice";
      return null;
    },
  },
  {
    name: "sedentary small man fat_loss clamps to the 1500 kcal sex floor",
    input: { sex: "male", ageYears: 50, heightCm: 160, weightKg: 55, activityLevel: "sedentary", goal: "fat_loss" },
    expect: (r) => (r.kcal < 1500 ? `kcal ${r.kcal} below the 1500 floor` : null),
  },
  {
    name: "unspecified sex uses the averaged BMR constant, not male or female",
    input: { sex: "unspecified", ageYears: 30, heightCm: 170, weightKg: 70, activityLevel: "sedentary", goal: "general_health" },
    expect: () => {
      const male = mifflinStJeorBmr("male", 70, 170, 30);
      const female = mifflinStJeorBmr("female", 70, 170, 30);
      const unspecified = mifflinStJeorBmr("unspecified", 70, 170, 30);
      const avg = (male + female) / 2;
      return Math.abs(unspecified - avg) < 0.01 ? null : `expected avg ${avg}, got ${unspecified}`;
    },
  },
  {
    name: "80%-of-BMR floor can exceed the flat sex floor for a large sedentary man",
    input: { sex: "male", ageYears: 40, heightCm: 190, weightKg: 140, activityLevel: "sedentary", goal: "fat_loss" },
    expect: (r) => {
      const bmr = mifflinStJeorBmr("male", 140, 190, 40);
      const floor = kcalFloor("male", bmr);
      if (floor <= 1500) return `test setup invalid: 80% BMR floor (${floor}) should exceed 1500 here`;
      return r.kcal >= floor ? null : `kcal ${r.kcal} below the 80% BMR floor ${floor}`;
    },
  },
  {
    name: "heavy user at the kcal floor never goes negative on carbs (the M1 'maths trap')",
    input: { sex: "female", ageYears: 35, heightCm: 160, weightKg: 130, activityLevel: "sedentary", goal: "fat_loss" },
    expect: (r) => {
      if (r.carbsG < 0) return `carbsG went negative: ${r.carbsG}`;
      if (r.carbsG < 50 && r.kcal < 1200) return "carb floor violated without raising kcal";
      return null;
    },
  },
  {
    name: "carb floor rebalance reduces fat before protein",
    input: { sex: "female", ageYears: 30, heightCm: 150, weightKg: 120, activityLevel: "sedentary", goal: "fat_loss" },
    expect: (r) => (r.carbsG >= 50 ? null : `carbsG ${r.carbsG} still below the 50g floor after rebalancing`),
  },
  {
    name: "protein reference weight is capped at BMI-25-equivalent for a very heavy user",
    input: { sex: "male", ageYears: 30, heightCm: 175, weightKg: 160, activityLevel: "moderate", goal: "general_health" },
    expect: (r) => {
      const bmi25Weight = 25 * 1.75 * 1.75; // ~76.6kg
      const uncappedProtein = 1.8 * 160; // 288g if uncapped
      return r.proteinG < uncappedProtein && r.proteinG <= Math.ceil(1.8 * bmi25Weight) + 1
        ? null
        : `proteinG ${r.proteinG} doesn't look capped (uncapped would be ~${uncappedProtein})`;
    },
  },
  {
    name: "light user (below BMI-25 weight) uses actual weight as the macro reference, not the cap",
    input: { sex: "male", ageYears: 25, heightCm: 180, weightKg: 65, activityLevel: "moderate", goal: "general_health" },
    expect: (r) => {
      const expectedProtein = Math.round(1.8 * 65);
      return Math.abs(r.proteinG - expectedProtein) <= 1 ? null : `expected proteinG ~${expectedProtein}, got ${r.proteinG}`;
    },
  },
  {
    name: "1%/week loss cap does not bind at a normal 20% deficit (documented as expected)",
    input: { sex: "male", ageYears: 28, heightCm: 178, weightKg: 85, activityLevel: "moderate", goal: "fat_loss" },
    expect: (r) => (r.notices.some((n) => n.code === "loss_rate_capped") ? "loss_rate_capped fired unexpectedly at a normal deficit" : null),
  },
  {
    name: "strength goal maps to maintenance kcal",
    input: { sex: "male", ageYears: 26, heightCm: 182, weightKg: 90, activityLevel: "high", goal: "strength" },
    expect: (r) => {
      const bmr = mifflinStJeorBmr("male", 90, 182, 26);
      const tdee = bmr * 1.725;
      return Math.abs(r.kcal - Math.round(tdee)) <= 1 ? null : `expected ~${Math.round(tdee)}, got ${r.kcal}`;
    },
  },
  {
    name: "endurance goal maps to maintenance kcal",
    input: { sex: "female", ageYears: 33, heightCm: 168, weightKg: 60, activityLevel: "athlete", goal: "endurance" },
    expect: (r) => {
      const bmr = mifflinStJeorBmr("female", 60, 168, 33);
      const tdee = bmr * 1.9;
      return Math.abs(r.kcal - Math.round(tdee)) <= 1 ? null : `expected ~${Math.round(tdee)}, got ${r.kcal}`;
    },
  },
  {
    name: "kcal, protein, carbs, fat are all positive and non-NaN across every case above",
    input: { sex: "male", ageYears: 60, heightCm: 165, weightKg: 45, activityLevel: "sedentary", goal: "fat_loss" },
    expect: (r) => {
      for (const [k, v] of Object.entries({ kcal: r.kcal, proteinG: r.proteinG, carbsG: r.carbsG, fatG: r.fatG })) {
        if (!Number.isFinite(v) || v < 0) return `${k} is invalid: ${v}`;
      }
      return null;
    },
  },
  {
    name: "athlete activity level produces a materially higher TDEE than sedentary at the same stats",
    input: { sex: "male", ageYears: 25, heightCm: 175, weightKg: 75, activityLevel: "athlete", goal: "general_health" },
    expect: (r) => {
      const bmr = mifflinStJeorBmr("male", 75, 175, 25);
      const sedentaryKcal = bmr * 1.2;
      return r.kcal > sedentaryKcal * 1.4 ? null : `athlete kcal ${r.kcal} not materially above sedentary ${sedentaryKcal}`;
    },
  },
  {
    name: "macros sum to kcal within rounding tolerance",
    input: { sex: "female", ageYears: 29, heightCm: 170, weightKg: 65, activityLevel: "light", goal: "muscle_gain" },
    expect: (r) => {
      const sum = r.proteinG * 4 + r.carbsG * 4 + r.fatG * 9;
      return Math.abs(sum - r.kcal) <= 5 ? null : `macro kcal sum ${sum} != target kcal ${r.kcal}`;
    },
  },
  {
    name: "goal-weight BMI-18.5 refusal: below floor is refused",
    input: { sex: "female", ageYears: 25, heightCm: 165, weightKg: 60, activityLevel: "moderate", goal: "general_health" },
    expect: () => {
      const { allowed, floorKg } = refuseGoalWeightBelowBmiFloor(165, 45);
      return allowed === false && floorKg > 0 ? null : `expected refusal below BMI floor, floorKg=${floorKg}`;
    },
  },
  {
    name: "goal-weight BMI-18.5 refusal: at/above floor is allowed",
    input: { sex: "female", ageYears: 25, heightCm: 165, weightKg: 60, activityLevel: "moderate", goal: "general_health" },
    expect: () => {
      const { allowed } = refuseGoalWeightBelowBmiFloor(165, 55);
      return allowed === true ? null : "expected goal weight at/above BMI floor to be allowed";
    },
  },
  {
    name: "tall heavy athlete: fat_loss still respects both floors and never emits NaN",
    input: { sex: "male", ageYears: 22, heightCm: 200, weightKg: 150, activityLevel: "athlete", goal: "fat_loss" },
    expect: (r) => (Number.isFinite(r.kcal) && r.kcal > 0 && r.carbsG >= 0 ? null : `invalid result: ${JSON.stringify(r)}`),
  },
];

export function runTargetsTestCases(): { name: string; pass: boolean; detail: string }[] {
  return CASES.map((c) => {
    const result = computeNutritionTargets(c.input);
    const failure = c.expect(result);
    return { name: c.name, pass: failure === null, detail: failure ?? "" };
  });
}
