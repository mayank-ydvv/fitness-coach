import { createClient } from "@/lib/supabase/server";
import { getMeasure } from "@/lib/prefs/server";
import { todayLocal, dayRangeUtc } from "@/lib/time/localDay";
import { getTodayInsight } from "@/lib/progress/todayInsight";
import { EnergyRing } from "@/components/today/EnergyRing";
import { MacroOnlyHero } from "@/components/today/MacroOnlyHero";
import { MacroBars } from "@/components/today/MacroBars";
import { NextSessionCard } from "@/components/today/NextSessionCard";
import { TodayHabits } from "@/components/today/TodayHabits";
import { InsightCard } from "@/components/today/InsightCard";
import { QuickLog } from "@/components/today/QuickLog";
import { RecentMeals } from "@/components/today/RecentMeals";

export default async function TodayPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null; // (app) layout already redirects; guards the type below

  const [{ data: profile }, { data: targetsRow }, { data: program }, measure] = await Promise.all([
    supabase.from("profiles").select("timezone, hide_energy").eq("id", user.id).single(),
    supabase
      .from("nutrition_targets")
      .select("kcal, protein_g, carbs_g, fat_g")
      .eq("user_id", user.id)
      .order("effective_from", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("programs")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getMeasure(),
  ]);

  // Same "next unstarted occurrence" query as app/(app)/train/page.tsx —
  // Today's "one clear next action" was hardcoded to null before this;
  // reusing the exact logic already proven there rather than writing a
  // second version of the same rule.
  let nextSession: { name: string; exerciseCount: number; estimatedMinutes: number | null; plannedWorkoutId: string } | null = null;
  if (program) {
    const { data: weeks } = await supabase
      .from("program_weeks")
      .select("week_number, planned_workouts(id, day_index, name, estimated_minutes, planned_sets(exercise_id))")
      .eq("program_id", program.id)
      .order("week_number", { ascending: true });
    const { data: sessions } = await supabase.from("workout_sessions").select("planned_workout_id").eq("user_id", user.id);
    const startedWorkoutIds = new Set((sessions ?? []).map((s) => s.planned_workout_id).filter(Boolean));

    outer: for (const week of weeks ?? []) {
      const sorted = [...(week.planned_workouts ?? [])].sort((a, b) => a.day_index - b.day_index);
      for (const workout of sorted) {
        if (!startedWorkoutIds.has(workout.id)) {
          nextSession = {
            name: workout.name,
            exerciseCount: new Set((workout.planned_sets ?? []).map((s) => s.exercise_id)).size,
            estimatedMinutes: workout.estimated_minutes,
            plannedWorkoutId: workout.id,
          };
          break outer;
        }
      }
    }
  }

  const timezone = profile?.timezone ?? "UTC";
  const today = todayLocal(timezone);
  const { start: dayStart, end: dayEnd } = dayRangeUtc(today, timezone);

  // Rollup: sum today's ready/manual meals' items. M2 owns the full
  // lib/nutrition/rollup.ts (which also excludes processing/failed and
  // powers the correction UI) — this inline version is the real query
  // shape, just without a meal-photo pipeline to feed it yet.
  const [{ data: meals }, insight] = await Promise.all([
    supabase
      .from("meals")
      .select("id, meal_type, status, eaten_at, meal_items(kcal, protein_g, carbs_g, fat_g)")
      .eq("user_id", user.id)
      .gte("eaten_at", dayStart)
      .lt("eaten_at", dayEnd)
      .in("status", ["ready", "manual"])
      .order("eaten_at", { ascending: false }),
    getTodayInsight(supabase, user.id, today, timezone),
  ]);

  const consumed = (meals ?? []).reduce(
    (acc, m) => {
      for (const item of m.meal_items ?? []) {
        acc.kcal += item.kcal ?? 0;
        acc.protein += item.protein_g ?? 0;
        acc.carbs += item.carbs_g ?? 0;
        acc.fat += item.fat_g ?? 0;
      }
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  const target = targetsRow ?? null;
  const kcalTarget = target?.kcal ?? null;
  const kcalRemaining = kcalTarget !== null ? kcalTarget - consumed.kcal : null;
  const kcalFraction = kcalTarget ? consumed.kcal / kcalTarget : 0;

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm text-ink-muted">
        {new Date().toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short", timeZone: timezone })}
      </p>

      {profile?.hide_energy ? (
        <MacroOnlyHero
          proteinLabel={target ? measure.macro(target.protein_g - consumed.protein) : null}
          carbsLabel={target ? measure.macro(target.carbs_g - consumed.carbs) : null}
          fatLabel={target ? measure.macro(target.fat_g - consumed.fat) : null}
        />
      ) : (
        <EnergyRing
          remainingLabel={kcalRemaining !== null ? String(Math.max(0, Math.round(kcalRemaining))) : "—"}
          targetLabel={kcalTarget !== null ? measure.energy(kcalTarget) : null}
          fraction={kcalFraction}
        />
      )}

      <NextSessionCard session={nextSession} />

      <QuickLog />

      <TodayHabits userId={user.id} todayDate={today} />

      {target ? (
        <MacroBars
          protein={{
            label: "Protein",
            valueLabel: `${measure.macro(consumed.protein)} of ${measure.macro(target.protein_g)}`,
            fraction: target.protein_g ? consumed.protein / target.protein_g : 0,
          }}
          carbs={{
            label: "Carbs",
            valueLabel: `${measure.macro(consumed.carbs)} of ${measure.macro(target.carbs_g)}`,
            fraction: target.carbs_g ? consumed.carbs / target.carbs_g : 0,
          }}
          fat={{
            label: "Fat",
            valueLabel: `${measure.macro(consumed.fat)} of ${measure.macro(target.fat_g)}`,
            fraction: target.fat_g ? consumed.fat / target.fat_g : 0,
          }}
        />
      ) : null}

      <InsightCard insight={insight} todayLocalDate={today} />

      <RecentMeals
        meals={(meals ?? []).map((m) => {
          const kcal = (m.meal_items ?? []).reduce((s, i) => s + (i.kcal ?? 0), 0);
          return { id: m.id, name: m.meal_type ?? "Meal", kcalLabel: measure.energy(kcal) };
        })}
      />
    </div>
  );
}
