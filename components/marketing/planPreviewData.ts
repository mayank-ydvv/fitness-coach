/**
 * Illustrative, deterministic content for the landing-page hero's goal
 * picker — presentation only, no AI call and no auth session. This is
 * NOT a preview of a real generated program (that's
 * lib/program/generate.ts, gated behind a real account); it exists so a
 * stranger can see the KIND of week they'd get before signing up. Keep
 * it obviously simpler than a real plan (no exercise slugs, no sets/reps)
 * so nobody mistakes it for the real output.
 */
export type PlanGoal = "strength" | "move" | "lose_weight" | "habit";

export const PLAN_GOALS: { id: PlanGoal; label: string }[] = [
  { id: "strength", label: "Get stronger" },
  { id: "move", label: "Move more" },
  { id: "lose_weight", label: "Lose weight" },
  { id: "habit", label: "Build a habit" },
];

export const PLAN_PREVIEWS: Record<PlanGoal, { day: string; session: string; minutes: number | null }[]> = {
  strength: [
    { day: "Mon", session: "Upper body", minutes: 48 },
    { day: "Tue", session: "Rest", minutes: null },
    { day: "Wed", session: "Lower body", minutes: 45 },
    { day: "Thu", session: "Rest", minutes: null },
  ],
  move: [
    { day: "Mon", session: "Walk + mobility", minutes: 25 },
    { day: "Tue", session: "Full body circuit", minutes: 30 },
    { day: "Wed", session: "Walk + mobility", minutes: 25 },
    { day: "Thu", session: "Rest", minutes: null },
  ],
  lose_weight: [
    { day: "Mon", session: "Full body", minutes: 35 },
    { day: "Tue", session: "Rest", minutes: null },
    { day: "Wed", session: "Full body", minutes: 35 },
    { day: "Thu", session: "Walk", minutes: 20 },
  ],
  habit: [
    { day: "Mon", session: "Quick full body", minutes: 20 },
    { day: "Tue", session: "Rest", minutes: null },
    { day: "Wed", session: "Quick full body", minutes: 20 },
    { day: "Thu", session: "Rest", minutes: null },
  ],
};
