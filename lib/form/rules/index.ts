import { squatSide } from "./squatSide";
import { squatFront } from "./squatFront";
import { pushup } from "./pushup";
import { deadlift } from "./deadlift";
import { ohp } from "./ohp";
import { plank } from "./plank";
import type { FormRuleSet } from "./types";

/** Slug -> rule set. The DB's exercises.form_rules jsonb supplies
 * thresholds only; this registry supplies the evaluators (M5 plan
 * decision — a threshold tweak is a migration, a logic change is a
 * deploy). Keyed on exercise slug + camera view since squat has two. */
export const RULE_SETS: Record<string, FormRuleSet> = {
  "barbell-back-squat:side": squatSide,
  "dumbbell-goblet-squat:side": squatSide,
  "bodyweight-squat:side": squatSide,
  "barbell-back-squat:front": squatFront,
  "dumbbell-goblet-squat:front": squatFront,
  "bodyweight-squat:front": squatFront,
  "push-up:side": pushup,
  "barbell-deadlift:side": deadlift,
  "barbell-overhead-press:side": ohp,
  "dumbbell-shoulder-press:side": ohp,
  "plank:side": plank,
};

export function getRuleSet(slug: string, view: "side" | "front"): FormRuleSet | null {
  return RULE_SETS[`${slug}:${view}`] ?? null;
}

export { squatSide, squatFront, pushup, deadlift, ohp, plank };
