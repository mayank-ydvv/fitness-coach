"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Metric } from "@/components/ui/Metric";
import { EmptyState } from "@/components/ui/EmptyState";
import { useMeasure } from "@/components/prefs/PreferencesProvider";
import { useToast } from "@/components/ui/Toast";
import { qk } from "@/lib/queries/keys";
import { computeDailyRollup } from "@/lib/nutrition/rollup";
import type { Tables } from "@/lib/supabase/database.types";
import { CaptureButton } from "./CaptureButton";
import { MealCard } from "./MealCard";
import { useLogMeal } from "@/hooks/useLogMeal";
import { Salad } from "lucide-react";

type Meal = Tables<"meals"> & { meal_items: Tables<"meal_items">[]; _previewUrl?: string };

export function EatPageClient({
  date,
  userId,
  initialMeals,
}: {
  date: string;
  userId: string;
  initialMeals: Meal[];
}) {
  const measure = useMeasure();
  const queryClient = useQueryClient();
  const { push } = useToast();
  const { logMealPhoto } = useLogMeal(date, userId);

  const { data: meals } = useQuery({
    queryKey: qk.meals(date),
    queryFn: async () => {
      const res = await fetch(`/api/nutrition/meals?date=${date}`);
      if (!res.ok) throw new Error("Couldn't load meals.");
      const { meals } = await res.json();
      return meals as Meal[];
    },
    initialData: initialMeals,
    staleTime: 60_000,
  });

  // Seed the cache once on mount so useMealsRealtime's setQueryData calls
  // land on the same key even before the query above has run.
  useEffect(() => {
    if (!queryClient.getQueryData(qk.meals(date))) {
      queryClient.setQueryData(qk.meals(date), initialMeals);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rollup = computeDailyRollup(
    (meals ?? []).map((m) => ({
      status: m.status,
      items: m.meal_items.map((i) => ({ kcal: i.kcal, proteinG: i.protein_g, carbsG: i.carbs_g, fatG: i.fat_g })),
    })),
  );

  // Optimistic removal (matching the rest of the app's mutation policy) —
  // the whole point is a tap here reads as instant, not "wait for the
  // network." On failure the meal is put back rather than silently
  // staying deleted, and the user is told to retry.
  async function deleteMeal(mealId: string) {
    const previous = queryClient.getQueryData<Meal[]>(qk.meals(date));
    queryClient.setQueryData<Meal[]>(qk.meals(date), (prev) => (prev ?? []).filter((m) => m.id !== mealId));

    const res = await fetch(`/api/nutrition/meals/${mealId}`, { method: "DELETE" });
    if (!res.ok) {
      queryClient.setQueryData(qk.meals(date), previous);
      push("Couldn't delete that meal — try again.", "danger");
    }
  }

  function retryFor(mealId: string) {
    // A failed meal already has its photo in Storage — re-run analysis
    // rather than re-uploading, since the original blob isn't held
    // client-side once the initial upload succeeded and only the AI call
    // itself failed. If the row never got a photo at all, this quietly
    // no-ops server-side (analyze requires image_path).
    fetch("/api/nutrition/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mealId }),
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-20">
      <div>
        <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink-primary">Eat</h1>
        <div className="mt-2 flex items-baseline gap-2">
          <Metric value={measure.energy(rollup.kcal)} size="xl" />
          <span className="text-sm text-ink-muted">logged today</span>
        </div>
      </div>

      {(meals ?? []).length === 0 ? (
        <EmptyState
          icon={<Salad size={28} />}
          line="Nothing logged yet. Photograph your next meal and it'll land here."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {(meals ?? []).map((meal) => (
            <MealCard key={meal.id} meal={meal} onRetry={retryFor} onDelete={deleteMeal} />
          ))}
        </div>
      )}

      <CaptureButton onCapture={(blob) => logMealPhoto({ blob })} />
    </div>
  );
}
