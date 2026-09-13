"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, RotateCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Metric } from "@/components/ui/Metric";
import { Button } from "@/components/ui/Button";
import { useMeasure } from "@/components/prefs/PreferencesProvider";
import { NotFoodNotice } from "./NotFoodNotice";
import { CorrectionSheet } from "./CorrectionSheet";
import type { Tables } from "@/lib/supabase/database.types";

type Meal = Tables<"meals"> & { meal_items: Tables<"meal_items">[]; _previewUrl?: string };

/**
 * One card across all four statuses (processing/ready/failed/manual) —
 * motion moment #2 is the processing->ready height settle + cross-fade,
 * driven by AnimatePresence keyed on status. prefers-reduced-motion is
 * handled globally (globals.css forces near-zero durations), so no extra
 * check is needed here.
 */
export function MealCard({ meal, onRetry }: { meal: Meal; onRetry: (mealId: string) => void }) {
  const measure = useMeasure();
  const [sheetOpen, setSheetOpen] = useState(false);

  const kcal = meal.meal_items.reduce((s, i) => s + i.kcal, 0);
  const label = meal.meal_type ? meal.meal_type[0].toUpperCase() + meal.meal_type.slice(1) : "Meal";

  return (
    <>
      <Card className="overflow-hidden p-0">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={meal.status}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="p-4"
          >
            {meal.status === "processing" ? (
              <div className="flex items-center gap-3">
                {meal._previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a Next-optimizable remote asset
                  <img src={meal._previewUrl} alt="" className="size-14 shrink-0 rounded-control object-cover" />
                ) : (
                  <div className="size-14 shrink-0 animate-pulse rounded-control bg-surface-sunken" />
                )}
                <div>
                  <p className="flex items-center gap-1.5 text-sm text-ink-primary">
                    <Clock size={14} className="text-ink-muted" aria-hidden />
                    Reading your photo…
                  </p>
                  <p className="text-xs text-ink-muted">This card updates itself — no need to wait here.</p>
                </div>
              </div>
            ) : meal.status === "failed" ? (
              <div className="flex items-center justify-between gap-3">
                <div>
                  {meal.meal_items.length === 0 ? (
                    <NotFoodNotice />
                  ) : (
                    <p className="text-sm text-ink-muted">Couldn&apos;t read that photo. Try again, or enter it manually.</p>
                  )}
                </div>
                <Button variant="secondary" size="md" onClick={() => onRetry(meal.id)} aria-label="Retry">
                  <RotateCw size={16} aria-hidden />
                </Button>
              </div>
            ) : (
              <button type="button" onClick={() => setSheetOpen(true)} className="flex w-full items-center justify-between gap-3 text-left">
                <div>
                  <p className="text-sm font-medium text-ink-primary">{label}</p>
                  <p className="text-xs text-ink-muted">
                    {meal.meal_items.length} item{meal.meal_items.length === 1 ? "" : "s"}
                  </p>
                </div>
                <Metric value={measure.energy(kcal)} size="base" />
              </button>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {meal.status === "ready" || meal.status === "manual" ? (
        <CorrectionSheet mealId={meal.id} items={meal.meal_items} open={sheetOpen} onOpenChange={setSheetOpen} />
      ) : null}
    </>
  );
}
