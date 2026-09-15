"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Clock, RotateCw, Trash2 } from "lucide-react";
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
export function MealCard({
  meal,
  onRetry,
  onDelete,
  onItemsChange,
}: {
  meal: Meal;
  onRetry: (mealId: string) => void;
  onDelete: (mealId: string) => void;
  onItemsChange: (mealId: string, items: Tables<"meal_items">[]) => void;
}) {
  const measure = useMeasure();
  const [sheetOpen, setSheetOpen] = useState(false);

  const kcal = meal.meal_items.reduce((s, i) => s + i.kcal, 0);
  // The food itself ("Grilled chicken sandwich"), not the breakfast/
  // lunch/dinner/snack guess — that classification is still stored
  // (meal_type) and used server-side, it's just not what the user
  // wants to see as the card's own title.
  const title = meal.meal_items.length > 0 ? meal.meal_items.map((i) => i.name).join(", ") : "Meal";

  function confirmDelete() {
    if (window.confirm("Delete this meal? This can't be undone.")) onDelete(meal.id);
  }

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
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  {meal._previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- local blob preview, not a Next-optimizable remote asset
                    <img src={meal._previewUrl} alt="" className="size-14 shrink-0 rounded-control object-cover" />
                  ) : (
                    <div className="size-14 shrink-0 animate-pulse rounded-control bg-surface-sunken" />
                  )}
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 text-sm text-ink-primary">
                      <Clock size={14} className="text-ink-muted" aria-hidden />
                      Reading your photo…
                    </p>
                    <p className="text-xs text-ink-muted">This card updates itself — no need to wait here.</p>
                  </div>
                </div>
                <DeleteButton onClick={confirmDelete} />
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
                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="secondary" size="md" onClick={() => onRetry(meal.id)} aria-label="Retry">
                    <RotateCw size={16} aria-hidden />
                  </Button>
                  <DeleteButton onClick={confirmDelete} />
                </div>
              </div>
            ) : (
              <div className="flex w-full items-center justify-between gap-3">
                <button type="button" onClick={() => setSheetOpen(true)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-ink-primary">{title}</p>
                  <p className="text-xs text-ink-muted">
                    {meal.meal_items.length} item{meal.meal_items.length === 1 ? "" : "s"} · tap to edit
                  </p>
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <Metric value={measure.energy(kcal)} size="base" />
                  <DeleteButton onClick={confirmDelete} />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Card>

      {meal.status === "ready" || meal.status === "manual" ? (
        <CorrectionSheet
          mealId={meal.id}
          items={meal.meal_items}
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          onItemsChange={(items) => onItemsChange(meal.id, items)}
        />
      ) : null}
    </>
  );
}

/** A real button, not swipe-only — swiping a whole meal away (as
 * ItemRow does for a single food item) risks losing several items at
 * once by accident, and a swipe has no keyboard/screen-reader
 * equivalent. Confirmed via `window.confirm` before it fires. */
function DeleteButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Delete meal"
      className="-m-2.5 flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-sunken hover:text-action-danger"
    >
      <Trash2 size={16} aria-hidden />
    </button>
  );
}
