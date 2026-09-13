import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateWeeklyCheckin } from "@/lib/ai/weeklyCheckin";
import { assertUnderDailyCap, recordAiJob, DailyCapError } from "@/lib/ai/jobs";
import { MODEL } from "@/lib/ai/client";
import { addDaysLocal, todayLocal } from "@/lib/time/localDay";
import { computeDailyRollup } from "@/lib/nutrition/rollup";

export const maxDuration = 30;

export async function POST() {
  const started = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  try {
    await assertUnderDailyCap(supabase, "weekly_checkin");
  } catch (err) {
    if (err instanceof DailyCapError) {
      return NextResponse.json({ error: "rate_limited", message: `You've hit today's limit of ${err.limit} check-ins.` }, { status: 429 });
    }
    return NextResponse.json({ error: "Couldn't check your daily limit." }, { status: 500 });
  }

  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const timezone = profile?.timezone ?? "UTC";
  const today = todayLocal(timezone);
  const weekAgo = addDaysLocal(today, -7);

  const { data: targetsRow } = await supabase
    .from("nutrition_targets")
    .select("protein_g")
    .eq("user_id", user.id)
    .order("effective_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: sessions } = await supabase
    .from("workout_sessions")
    .select("id, ended_at")
    .eq("user_id", user.id)
    .not("ended_at", "is", null)
    .gte("started_at", `${weekAgo}T00:00:00`);

  const sessionIds = (sessions ?? []).map((s) => s.id);
  const { data: setLogs } = sessionIds.length
    ? await supabase.from("set_logs").select("session_id, load_kg, reps, rpe").in("session_id", sessionIds)
    : { data: [] };
  const totalVolumeKg = (setLogs ?? []).reduce((s, l) => s + l.load_kg * l.reps, 0);
  const setsWithMissedTargets = 0; // TODO(M6 polish): thread real miss data from progression_runs once a per-week query exists

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
  const dailyRollups = Array.from(mealsByDay.values()).map((dayMeals) =>
    computeDailyRollup(
      (dayMeals ?? []).map((m) => ({
        status: m.status,
        items: (m.meal_items ?? []).map((i) => ({ kcal: i.kcal, proteinG: i.protein_g, carbsG: i.carbs_g, fatG: i.fat_g })),
      })),
    ),
  );
  const averageProteinG = dailyRollups.length > 0 ? Math.round(dailyRollups.reduce((s, r) => s + r.proteinG, 0) / dailyRollups.length) : null;

  const { data: habits } = await supabase.from("habits").select("id, name, target_per_week").eq("user_id", user.id).is("archived_at", null);
  const { data: habitLogs } = await supabase.from("habit_logs").select("habit_id, status, log_date").eq("user_id", user.id).gte("log_date", weekAgo);
  const habitsHitRate = (habits ?? []).map((h) => ({
    name: h.name,
    hitDays: (habitLogs ?? []).filter((l) => l.habit_id === h.id && l.status === "done").length,
    targetDays: h.target_per_week,
  }));

  try {
    const summary = await generateWeeklyCheckin({
      sessionsCompleted: sessions?.length ?? 0,
      totalVolumeKg,
      setsWithMissedTargets,
      mealsLoggedDays: mealsByDay.size,
      averageProteinG,
      proteinTargetG: targetsRow?.protein_g ?? null,
      habitsHitRate,
    });

    await recordAiJob({ userId: user.id, kind: "weekly_checkin", model: MODEL, status: "succeeded", latencyMs: Date.now() - started });
    return NextResponse.json({ summary });
  } catch (err) {
    await recordAiJob({
      userId: user.id,
      kind: "weekly_checkin",
      model: MODEL,
      status: "failed",
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Couldn't generate a check-in right now." }, { status: 502 });
  }
}
