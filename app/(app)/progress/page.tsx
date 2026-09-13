import { createClient } from "@/lib/supabase/server";
import { getMeasure } from "@/lib/prefs/server";
import { todayLocal, addDaysLocal, weekStartLocal } from "@/lib/time/localDay";
import { computeDailyRollup } from "@/lib/nutrition/rollup";
import { proteinSevenDayAverage } from "@/lib/progress/series";
import { volumeBand, reportVolume } from "@/lib/training/volume";
import { detectPlateau } from "@/lib/progression/plateau";
import { correlateHabitWithRpe, type WeeklyDatum } from "@/lib/habits/correlate";
import { WeightTrend } from "@/components/progress/WeightTrend";
import { E1rmTrend } from "@/components/progress/E1rmTrend";
import { VolumeBars } from "@/components/progress/VolumeBars";
import { HabitCompletion } from "@/components/progress/HabitCompletion";
import { ProteinAverage } from "@/components/progress/ProteinAverage";
import { PlateauCard } from "@/components/progress/PlateauCard";
import { CorrelationCard } from "@/components/progress/CorrelationCard";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { LineChart as LineChartIcon } from "lucide-react";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: profile }, measure] = await Promise.all([
    supabase.from("profiles").select("timezone, goal").eq("id", user.id).single(),
    getMeasure(),
  ]);
  const timezone = profile?.timezone ?? "UTC";
  const today = todayLocal(timezone);
  const twelveWeeksAgo = addDaysLocal(today, -84);

  const { data: bodyMetrics } = await supabase
    .from("body_metrics")
    .select("recorded_on, weight_kg")
    .eq("user_id", user.id)
    .gte("recorded_on", twelveWeeksAgo)
    .order("recorded_on");

  const { data: sessions } = await supabase.from("workout_sessions").select("id").eq("user_id", user.id);
  const sessionIds = (sessions ?? []).map((s) => s.id);

  const { data: setLogs } = sessionIds.length
    ? await supabase
        .from("set_logs")
        .select("exercise_id, completed_at, e1rm, e1rm_trusted, is_warmup, reps, load_kg, session_id")
        .in("session_id", sessionIds)
        .gte("completed_at", twelveWeeksAgo)
    : { data: [] };

  const exerciseIds = Array.from(new Set((setLogs ?? []).map((l) => l.exercise_id)));
  const { data: exerciseRows } = exerciseIds.length
    ? await supabase.from("exercises").select("id, name, primary_muscle, secondary_muscles").in("id", exerciseIds)
    : { data: [] };
  const exerciseById = new Map((exerciseRows ?? []).map((e) => [e.id, e]));

  // Weekly volume: last 7 days of working sets, credited by muscle group.
  const weekAgo = addDaysLocal(today, -7);
  const lastWeekSets = (setLogs ?? [])
    .filter((l) => l.completed_at >= weekAgo && !l.is_warmup)
    .map((l) => {
      const ex = exerciseById.get(l.exercise_id);
      return { isWarmup: false, primaryMuscle: ex?.primary_muscle ?? "", secondaryMuscles: ex?.secondary_muscles ?? [] };
    });
  const volumeReport = reportVolume(lastWeekSets, profile?.goal ?? "general_health");
  const band = volumeBand(profile?.goal ?? "general_health");

  // Plateau detection: best trusted e1RM per exercise per week, last 3+ weeks.
  const plateaus: { exerciseName: string; signal: NonNullable<ReturnType<typeof detectPlateau>> }[] = [];
  for (const [exerciseId, exercise] of exerciseById) {
    const logsForExercise = (setLogs ?? []).filter((l) => l.exercise_id === exerciseId && l.e1rm_trusted && !l.is_warmup);
    const byWeek = new Map<string, number>();
    for (const log of logsForExercise) {
      const week = weekStartLocal(log.completed_at.slice(0, 10));
      const e1rm = log.e1rm ?? 0;
      byWeek.set(week, Math.max(byWeek.get(week) ?? 0, e1rm));
    }
    const weeklyBests = Array.from(byWeek.entries())
      .map(([weekStart, bestE1rm]) => ({ weekStart, bestE1rm }))
      .sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    const signal = detectPlateau(exerciseId, weeklyBests, 0, 21);
    if (signal) plateaus.push({ exerciseName: exercise.name, signal });
  }

  // Habits: weekly completion rate + one correlation card (>=4 weeks).
  const { data: habits } = await supabase.from("habits").select("id, name, target_per_week").eq("user_id", user.id).is("archived_at", null);
  const { data: habitLogs } = await supabase.from("habit_logs").select("habit_id, status, log_date").eq("user_id", user.id).gte("log_date", weekAgo);
  const habitCompletion = (habits ?? []).map((h) => {
    const done = (habitLogs ?? []).filter((l) => l.habit_id === h.id && l.status === "done").length;
    return { name: h.name, rate: h.target_per_week > 0 ? Math.min(1, done / h.target_per_week) : 0 };
  });

  // Nutrition: 7-day protein average vs target.
  const { data: meals } = await supabase
    .from("meals")
    .select("eaten_at, status, meal_items(protein_g, carbs_g, fat_g, kcal)")
    .eq("user_id", user.id)
    .gte("eaten_at", `${weekAgo}T00:00:00`);
  const mealsByDay = new Map<string, typeof meals>();
  for (const m of meals ?? []) {
    const day = m.eaten_at.slice(0, 10);
    mealsByDay.set(day, [...(mealsByDay.get(day) ?? []), m]);
  }
  const dailyProtein = Array.from(mealsByDay.entries()).map(([date, dayMeals]) => ({
    date,
    proteinG: computeDailyRollup(
      (dayMeals ?? []).map((m) => ({
        status: m.status,
        items: (m.meal_items ?? []).map((i) => ({ kcal: i.kcal, proteinG: i.protein_g, carbsG: i.carbs_g, fatG: i.fat_g })),
      })),
    ).proteinG,
  }));
  const proteinAvg = proteinSevenDayAverage(dailyProtein);
  const { data: targetsRow } = await supabase
    .from("nutrition_targets")
    .select("protein_g")
    .eq("user_id", user.id)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Correlation card: pairs a manual habit's weekly hit count against average
  // session RPE that same week. Restricted to the "sleep" habit specifically
  // (the spec's own example, and the one manual habit with a physiologically
  // plausible link to training RPE) rather than every habit, so this doesn't
  // turn into a multiple-comparisons fishing expedition across arbitrary
  // user-named habits.
  const sleepHabit = (habits ?? []).find((h) => h.name.toLowerCase().includes("sleep"));
  let correlation: ReturnType<typeof correlateHabitWithRpe> = null;
  if (sleepHabit) {
    const [{ data: sessionsForRpe }, { data: sleepLogs }] = await Promise.all([
      supabase
        .from("workout_sessions")
        .select("started_at, session_rpe")
        .eq("user_id", user.id)
        .gte("started_at", `${twelveWeeksAgo}T00:00:00`)
        .not("session_rpe", "is", null),
      supabase
        .from("habit_logs")
        .select("log_date")
        .eq("user_id", user.id)
        .eq("habit_id", sleepHabit.id)
        .eq("status", "done")
        .gte("log_date", twelveWeeksAgo),
    ]);

    const rpeByWeek = new Map<string, number[]>();
    for (const s of sessionsForRpe ?? []) {
      if (s.session_rpe === null) continue;
      const week = weekStartLocal(s.started_at.slice(0, 10));
      rpeByWeek.set(week, [...(rpeByWeek.get(week) ?? []), s.session_rpe]);
    }
    const hitsByWeek = new Map<string, number>();
    for (const l of sleepLogs ?? []) {
      const week = weekStartLocal(l.log_date);
      hitsByWeek.set(week, (hitsByWeek.get(week) ?? 0) + 1);
    }
    const allWeeks = new Set([...rpeByWeek.keys(), ...hitsByWeek.keys()]);
    const weeklyData: WeeklyDatum[] = Array.from(allWeeks).map((weekStart) => {
      const rpes = rpeByWeek.get(weekStart) ?? [];
      return {
        weekStart,
        habitHitCount: hitsByWeek.get(weekStart) ?? 0,
        avgSessionRpe: rpes.length > 0 ? rpes.reduce((s, r) => s + r, 0) / rpes.length : null,
      };
    });
    correlation = correlateHabitWithRpe(weeklyData, sleepHabit.target_per_week || 5);
  }

  const hasAnyData = (bodyMetrics ?? []).length > 0 || (setLogs ?? []).length > 0 || (habits ?? []).length > 0 || (meals ?? []).length > 0;

  if (!hasAnyData) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-semibold text-ink-primary">Progress</h1>
        <Card>
          <EmptyState icon={<LineChartIcon size={28} />} line="Charts show up once you've logged a few sessions and meals." />
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold text-ink-primary">Progress</h1>

      <WeightTrend bodyMetrics={bodyMetrics ?? []} measure={measure} />

      {exerciseRows && exerciseRows.length > 0 ? (
        <E1rmTrend setLogs={setLogs ?? []} exercises={exerciseRows.map((e) => ({ id: e.id, name: e.name }))} />
      ) : null}

      <VolumeBars report={volumeReport} band={band} />

      <ProteinAverage averageG={proteinAvg} targetG={targetsRow?.protein_g ?? null} measure={measure} />

      <HabitCompletion habits={habitCompletion} />

      {plateaus.map((p) => (
        <PlateauCard key={p.exerciseName} exerciseName={p.exerciseName} signal={p.signal} />
      ))}

      {sleepHabit && correlation ? <CorrelationCard habitName={sleepHabit.name} correlation={correlation} /> : null}
    </div>
  );
}
