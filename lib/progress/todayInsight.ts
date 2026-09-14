import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { addDaysLocal, dayRangeUtc } from "@/lib/time/localDay";
import { computeDailyRollup } from "@/lib/nutrition/rollup";
import { proteinSevenDayAverage } from "@/lib/progress/series";
import { computeStreaks } from "@/lib/habits/streaks";
import { pickInsight, isStreakMilestone, type Insight } from "@/lib/progress/insights";

/**
 * Assembles today's single insight (brief §8: "one AI note per day...
 * explaining what changed and why"). `InsightCard`/`pickInsight`/
 * `insightMessage` already existed but were never wired into Today —
 * this is the missing assembly step, reusing the exact pure functions
 * the real Progress page already trusts for the same signals, not new
 * rules invented for this card.
 *
 * Scoped deliberately: only the protein and streak-milestone signals are
 * wired. PR and plateau detection (`detectPlateau`) need a per-exercise
 * weekly-best-e1RM aggregation across every exercise the user has
 * trained — Progress already does this over a 12-week window, and
 * duplicating that full aggregation here (with no cache between the two
 * pages) was cut from this pass rather than rushed. Flagged in
 * DESIGN.md, not silently dropped — `pickInsight` already ranks PR/
 * plateau above these two, so wiring them in later is additive, not a
 * rework of this function.
 */
export async function getTodayInsight(
  supabase: SupabaseClient<Database>,
  userId: string,
  todayLocalDate: string,
  timezone: string,
): Promise<Insight | null> {
  const weekAgo = addDaysLocal(todayLocalDate, -7);
  const weekAgoUtc = dayRangeUtc(weekAgo, timezone).start;

  const [{ data: meals }, { data: targetsRow }, { data: habits }] = await Promise.all([
    supabase
      .from("meals")
      .select("eaten_at, status, meal_items(protein_g, carbs_g, fat_g, kcal)")
      .eq("user_id", userId)
      .gte("eaten_at", weekAgoUtc),
    supabase
      .from("nutrition_targets")
      .select("protein_g")
      .eq("user_id", userId)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("habits").select("id, name, rest_day_enabled").eq("user_id", userId).is("archived_at", null),
  ]);

  const mealsByDay = new Map<string, NonNullable<typeof meals>>();
  for (const m of meals ?? []) {
    const day = m.eaten_at.slice(0, 10);
    mealsByDay.set(day, [...(mealsByDay.get(day) ?? []), m]);
  }
  const dailyProtein = Array.from(mealsByDay.entries()).map(([date, dayMeals]) => ({
    date,
    proteinG: computeDailyRollup(
      dayMeals.map((m) => ({
        status: m.status,
        items: (m.meal_items ?? []).map((i) => ({ kcal: i.kcal, proteinG: i.protein_g, carbsG: i.carbs_g, fatG: i.fat_g })),
      })),
    ).proteinG,
  }));
  const proteinAvg = proteinSevenDayAverage(dailyProtein);

  let streakMilestone: { habitName: string; days: number } | null = null;
  if (habits && habits.length > 0) {
    // Wide enough to catch every milestone computeStreaks/isStreakMilestone
    // knows about (up to 365 days) without querying per-habit.
    const yearAgo = addDaysLocal(todayLocalDate, -370);
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id, log_date, status")
      .eq("user_id", userId)
      .gte("log_date", yearAgo);

    for (const habit of habits) {
      const habitLogs = (logs ?? [])
        .filter((l) => l.habit_id === habit.id && (l.status === "done" || l.status === "skipped"))
        .map((l) => ({ logDate: l.log_date, status: l.status as "done" | "skipped" }));
      const { current } = computeStreaks(habitLogs, todayLocalDate, habit.rest_day_enabled);
      if (isStreakMilestone(current)) {
        streakMilestone = { habitName: habit.name, days: current };
        break;
      }
    }
  }

  return pickInsight({
    recentPr: null,
    plateau: null,
    protein: proteinAvg !== null && targetsRow ? { averageG: proteinAvg, targetG: targetsRow.protein_g } : null,
    streakMilestone,
  });
}
