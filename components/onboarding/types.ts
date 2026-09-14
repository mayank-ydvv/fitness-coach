import type { ActivityLevel, Equipment, ExperienceLevel, Goal, Sex, UnitSystem } from "@/lib/types";

export type OnboardingDraft = {
  goal: Goal | null;
  experienceLevel: ExperienceLevel | null;
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: Equipment[];
  limitations: string;
  activityLevel: ActivityLevel | null;
  dateOfBirth: string; // YYYY-MM-DD
  sex: Sex | null;
  unitSystem: UnitSystem;
  heightCm: number | null;
  weightKg: number | null;
  displayName: string;
};

export const EMPTY_DRAFT: OnboardingDraft = {
  goal: null,
  experienceLevel: null,
  daysPerWeek: 3,
  sessionMinutes: 60,
  equipment: [],
  limitations: "",
  activityLevel: null,
  dateOfBirth: "",
  sex: null,
  unitSystem: "metric",
  heightCm: null,
  weightKg: null,
  displayName: "",
};

export type StepProps = {
  draft: OnboardingDraft;
  patch: (partial: Partial<OnboardingDraft>) => void;
};

// One question per screen (brief §7) — StepSchedule and StepBody used to
// each cram several questions onto one screen; split here so every entry
// is a single question. Shared between OnboardingFlow (drives the
// sequence) and StepReview (jumps back into it), so there's one source
// of truth for step order and no circular import between the two.
export const STEPS = [
  "goal",
  "experience",
  "daysPerWeek",
  "sessionMinutes",
  "equipment",
  "limitations",
  "activity",
  "sex",
  "dateOfBirth",
  "height",
  "weight",
  "name",
  "review",
] as const;

export type StepKey = (typeof STEPS)[number];
