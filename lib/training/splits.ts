import type { MovementPattern } from "@/lib/types";

/**
 * Deterministic split selection (spec §6 table) — passed IN to program
 * generation as a constraint, never left to the model. Single source for
 * generation, the volume/pattern-coverage validator, and any UI label.
 */
export type SessionType = "full_body" | "upper" | "lower" | "push" | "pull" | "legs";

export type SplitDay = { dayIndex: number; name: string; sessionType: SessionType; patterns: MovementPattern[] };

const UPPER_PATTERNS: MovementPattern[] = ["push_h", "push_v", "pull_h", "pull_v"];
const LOWER_PATTERNS: MovementPattern[] = ["squat", "hinge", "carry"];
const FULL_BODY_PATTERNS: MovementPattern[] = ["squat", "hinge", "push_h", "push_v", "pull_h", "pull_v", "core"];
const PUSH_PATTERNS: MovementPattern[] = ["push_h", "push_v"];
const PULL_PATTERNS: MovementPattern[] = ["pull_h", "pull_v"];
const LEGS_PATTERNS: MovementPattern[] = ["squat", "hinge", "carry", "core"];

const SPLIT_TABLE: Record<number, SplitDay[]> = {
  1: [{ dayIndex: 0, name: "Full Body", sessionType: "full_body", patterns: FULL_BODY_PATTERNS }],
  2: [
    { dayIndex: 0, name: "Full Body A", sessionType: "full_body", patterns: FULL_BODY_PATTERNS },
    { dayIndex: 1, name: "Full Body B", sessionType: "full_body", patterns: FULL_BODY_PATTERNS },
  ],
  3: [
    { dayIndex: 0, name: "Full Body A", sessionType: "full_body", patterns: FULL_BODY_PATTERNS },
    { dayIndex: 1, name: "Full Body B", sessionType: "full_body", patterns: FULL_BODY_PATTERNS },
    { dayIndex: 2, name: "Full Body C", sessionType: "full_body", patterns: FULL_BODY_PATTERNS },
  ],
  4: [
    { dayIndex: 0, name: "Upper A", sessionType: "upper", patterns: UPPER_PATTERNS },
    { dayIndex: 1, name: "Lower A", sessionType: "lower", patterns: LOWER_PATTERNS },
    { dayIndex: 2, name: "Upper B", sessionType: "upper", patterns: UPPER_PATTERNS },
    { dayIndex: 3, name: "Lower B", sessionType: "lower", patterns: LOWER_PATTERNS },
  ],
  5: [
    { dayIndex: 0, name: "Upper", sessionType: "upper", patterns: UPPER_PATTERNS },
    { dayIndex: 1, name: "Lower", sessionType: "lower", patterns: LOWER_PATTERNS },
    { dayIndex: 2, name: "Push", sessionType: "push", patterns: PUSH_PATTERNS },
    { dayIndex: 3, name: "Pull", sessionType: "pull", patterns: PULL_PATTERNS },
    { dayIndex: 4, name: "Legs", sessionType: "legs", patterns: LEGS_PATTERNS },
  ],
  6: [
    { dayIndex: 0, name: "Push A", sessionType: "push", patterns: PUSH_PATTERNS },
    { dayIndex: 1, name: "Pull A", sessionType: "pull", patterns: PULL_PATTERNS },
    { dayIndex: 2, name: "Legs A", sessionType: "legs", patterns: LEGS_PATTERNS },
    { dayIndex: 3, name: "Push B", sessionType: "push", patterns: PUSH_PATTERNS },
    { dayIndex: 4, name: "Pull B", sessionType: "pull", patterns: PULL_PATTERNS },
    { dayIndex: 5, name: "Legs B", sessionType: "legs", patterns: LEGS_PATTERNS },
  ],
};

// 7 days/week: same as 6, plus an optional light full-body/core day. Kept
// simple since the spec's table stops at "6". Days 8 is nonsensical
// (schema caps days_per_week at 7).
SPLIT_TABLE[7] = [
  ...SPLIT_TABLE[6],
  { dayIndex: 6, name: "Full Body (light)", sessionType: "full_body", patterns: FULL_BODY_PATTERNS },
];

export function getSplit(daysPerWeek: number): SplitDay[] {
  const split = SPLIT_TABLE[daysPerWeek];
  if (!split) throw new Error(`No split defined for ${daysPerWeek} days/week.`);
  return split;
}

export function splitName(daysPerWeek: number): string {
  switch (daysPerWeek) {
    case 1:
      return "full_body_1x";
    case 2:
      return "full_body_ab";
    case 3:
      return "full_body_abc";
    case 4:
      return "upper_lower";
    case 5:
      return "upper_lower_ppl";
    case 6:
      return "ppl_2x";
    default:
      return "ppl_2x_plus_light";
  }
}
