/**
 * Static fixture data for the logged-out demo (spec §13) — 4 weeks of a
 * realistic user, rendered through the SAME presentational components the
 * real Today/Progress pages use. Fixtures, not DB rows: zero RLS surface,
 * zero free-tier storage cost, survives a paused Supabase project, and
 * can't be vandalised by a reviewer poking at it.
 */

export const DEMO_TODAY = {
  dateLabel: "Wed 14 Oct",
  kcalTarget: 2400,
  kcalConsumed: 1560,
  macros: {
    protein: { consumedG: 118, targetG: 165 },
    carbs: { consumedG: 142, targetG: 220 },
    fat: { consumedG: 48, targetG: 75 },
  },
  nextSession: { name: "Upper A", exerciseCount: 5, estimatedMinutes: 52 },
  habits: [
    { name: "Train", emoji: "💪", done: true },
    { name: "Log every meal", emoji: "🍽️", done: true },
    { name: "Sleep 7+ hours", emoji: "😴", done: false },
  ],
  recentMeals: [
    { id: "demo-1", name: "Breakfast", kcalLabel: "540 kcal" },
    { id: "demo-2", name: "Lunch", kcalLabel: "720 kcal" },
    { id: "demo-3", name: "Snack", kcalLabel: "300 kcal" },
  ],
};

// 28 days, a realistic slow cut with normal week-to-week noise.
export const DEMO_WEIGHT_TREND = Array.from({ length: 28 }, (_, i) => {
  const date = new Date(2024, 8, 17 + i).toISOString().slice(0, 10);
  const weightKg = 82.4 - i * 0.06 + Math.sin(i / 3) * 0.3;
  return { date, weightKg: Math.round(weightKg * 10) / 10 };
});

// One exercise's e1RM across the mesocycle — the steady, small week-to-week
// increase real progression produces.
export const DEMO_E1RM_TREND = Array.from({ length: 11 }, (_, i) => ({
  date: new Date(2024, 8, 17 + i * 3).toISOString().slice(0, 10),
  e1rm: Math.round(95 + i * 1.8),
}));

export const DEMO_VOLUME = {
  credit: { chest: 14, back: 16, quads: 15, hamstrings: 10, glutes: 11, shoulders: 12, arms: 8, core: 6 },
  band: { min: 10, max: 20 },
};

export const DEMO_HABIT_COMPLETION = [
  { name: "Train", rate: 0.86 },
  { name: "Log every meal", rate: 1.0 },
  { name: "Sleep 7+ hours", rate: 0.57 },
];

export const DEMO_FORM_ANALYSIS = {
  exerciseName: "Barbell Back Squat",
  overallScore: 84,
  repCount: 8,
  coachSummary:
    "Your depth is solid on every rep, but you're leaning forward more on reps 6-8 as you fatigue. Keep your chest up through the whole set next time.",
};

export const DEMO_PROGRAM = {
  name: "Upper/Lower",
  split: "upper_lower",
  totalWeeks: 6,
  currentWeek: 4,
};
