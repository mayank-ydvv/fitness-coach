/**
 * Pure. Sums a day's meals into a single rollup — the ONE place "which
 * meals count toward today's total" is decided (ready + manual; never
 * processing or failed) so the ring, the macro bars, and the meal list can
 * never disagree about what's included.
 */
export type RollupMealItem = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};
export type RollupMeal = {
  status: "processing" | "ready" | "failed" | "manual";
  items: RollupMealItem[];
};

export type DailyRollup = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  mealCount: number;
};

const COUNTED_STATUSES = new Set<RollupMeal["status"]>(["ready", "manual"]);

export function computeDailyRollup(meals: RollupMeal[]): DailyRollup {
  const counted = meals.filter((m) => COUNTED_STATUSES.has(m.status));
  return counted.reduce<DailyRollup>(
    (acc, meal) => {
      for (const item of meal.items) {
        acc.kcal += item.kcal;
        acc.proteinG += item.proteinG;
        acc.carbsG += item.carbsG;
        acc.fatG += item.fatG;
      }
      acc.mealCount += 1;
      return acc;
    },
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0, mealCount: 0 },
  );
}
