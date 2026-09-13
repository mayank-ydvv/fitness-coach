// `as const` arrays mirroring every Postgres enum — one source for Zod
// schemas (lib/schemas/*) and for anything that needs to render labels or
// build a <select>. Keep in lockstep with supabase/migrations/0001_enums.sql.

export const SEXES = ["male", "female", "unspecified"] as const;
export type Sex = (typeof SEXES)[number];

export const UNIT_SYSTEMS = ["metric", "imperial"] as const;
export type UnitSystem = (typeof UNIT_SYSTEMS)[number];

export const ACTIVITY_LEVELS = ["sedentary", "light", "moderate", "high", "athlete"] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];

export const GOALS = ["fat_loss", "muscle_gain", "strength", "endurance", "general_health"] as const;
export type Goal = (typeof GOALS)[number];

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export const EQUIPMENT = ["barbell", "dumbbell", "machine", "cable", "bodyweight", "bands"] as const;
export type Equipment = (typeof EQUIPMENT)[number];

export const MEAL_STATUSES = ["processing", "ready", "failed", "manual"] as const;
export type MealStatus = (typeof MEAL_STATUSES)[number];

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const HABIT_CADENCES = ["daily", "weekly"] as const;
export type HabitCadence = (typeof HABIT_CADENCES)[number];

export const AI_JOB_KINDS = ["meal_vision", "program_gen", "form_summary", "weekly_checkin"] as const;
export type AiJobKind = (typeof AI_JOB_KINDS)[number];

export const MOVEMENT_PATTERNS = [
  "squat",
  "hinge",
  "push_h",
  "push_v",
  "pull_h",
  "pull_v",
  "carry",
  "core",
] as const;
export type MovementPattern = (typeof MOVEMENT_PATTERNS)[number];
