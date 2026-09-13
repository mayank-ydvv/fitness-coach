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
