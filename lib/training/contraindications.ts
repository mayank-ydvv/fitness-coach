/**
 * `limitation keyword -> excluded movement patterns/slugs`. The model gets
 * the user's raw free-text `limitations` and is instructed to respect it,
 * but generation validation (spec §6, check 6) needs a deterministic
 * fallback check — this is intentionally coarse (keyword match on common
 * injury terms), not a medical classifier.
 */
import type { MovementPattern } from "@/lib/types";

type Rule = { keywords: string[]; excludedPatterns: MovementPattern[]; excludedSlugs: string[] };

const RULES: Rule[] = [
  {
    keywords: ["knee"],
    excludedPatterns: [],
    excludedSlugs: [
      "barbell-back-squat",
      "barbell-front-squat",
      "smith-machine-squat",
      "hack-squat-machine",
      "dumbbell-bulgarian-split-squat",
      "leg-extension",
      "leg-press",
      "bodyweight-lunge",
      "dumbbell-reverse-lunge",
      "step-up",
    ],
  },
  {
    keywords: ["lower back", "low back", "back injury", "herniated disc", "sciatica"],
    excludedPatterns: ["hinge"],
    excludedSlugs: ["barbell-deadlift", "barbell-good-morning", "barbell-bent-over-row", "barbell-pendlay-row"],
  },
  {
    keywords: ["shoulder"],
    excludedPatterns: [],
    excludedSlugs: ["barbell-overhead-press", "dumbbell-shoulder-press", "dumbbell-lateral-raise", "dip", "barbell-bench-press", "dumbbell-bench-press"],
  },
  {
    keywords: ["wrist"],
    excludedPatterns: [],
    excludedSlugs: ["push-up", "barbell-back-squat", "barbell-front-squat", "barbell-bench-press"],
  },
];

export function excludedSlugsFor(limitations: string | null | undefined): Set<string> {
  const text = (limitations ?? "").toLowerCase();
  const excluded = new Set<string>();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      rule.excludedSlugs.forEach((s) => excluded.add(s));
    }
  }
  return excluded;
}

export function excludedPatternsFor(limitations: string | null | undefined): Set<MovementPattern> {
  const text = (limitations ?? "").toLowerCase();
  const excluded = new Set<MovementPattern>();
  for (const rule of RULES) {
    if (rule.keywords.some((k) => text.includes(k))) {
      rule.excludedPatterns.forEach((p) => excluded.add(p));
    }
  }
  return excluded;
}
