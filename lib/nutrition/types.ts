// Types only — no compute logic — so components may import this even though
// eslint blocks importing lib/nutrition/targets.ts and guardrails.ts
// directly (those hold the actual math, which must stay server-side).
export type GuardrailNotice = {
  code:
    | "kcal_floor_clamped"
    | "loss_rate_capped"
    | "carb_floor_rebalanced"
    | "goal_weight_below_bmi_floor";
  message: string;
};

export type NutritionTargetsResult = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  method: string;
  rationale: string;
  notices: GuardrailNotice[];
};
