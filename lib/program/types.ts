export type GeneratedExercise = {
  slug: string;
  sets: number;
  reps_low: number;
  reps_high: number;
  rpe: number;
  rest_seconds: number;
};

export type GeneratedDay = {
  day_index: number;
  name: string;
  estimated_minutes: number;
  exercises: GeneratedExercise[];
};

export type GeneratedWeek1 = {
  program_name: string;
  rationale: string;
  days: GeneratedDay[];
};

export type ExerciseRef = {
  id: string;
  slug: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  movementPattern: string | null;
  loadIncrementKg: number;
};

export type Violation = { path: string; message: string; fix: string };
