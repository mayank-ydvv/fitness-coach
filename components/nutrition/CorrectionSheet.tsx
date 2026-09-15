"use client";

import { useEffect, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Metric } from "@/components/ui/Metric";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useMeasure } from "@/components/prefs/PreferencesProvider";
import { ItemRow, type CorrectionItem } from "./ItemRow";
import { ManualItemRow } from "./ManualItemRow";
import { ManualEntryForm, type ManualItemDraft } from "./ManualEntryForm";
import type { Tables } from "@/lib/supabase/database.types";

type MealItemRow = Tables<"meal_items">;

function toCorrectionItem(row: MealItemRow): CorrectionItem {
  return {
    id: row.id,
    name: row.name,
    portionDescription: row.portion_description,
    grams: row.grams,
    kcal: row.kcal,
    kcalLow: row.kcal_low,
    kcalHigh: row.kcal_high,
    proteinG: row.protein_g,
    carbsG: row.carbs_g,
    fatG: row.fat_g,
    fiberG: row.fiber_g,
    confidence: row.confidence,
  };
}

// The inverse of toCorrectionItem, merged onto the original row — keeps
// columns CorrectionItem doesn't carry (meal_id, created_at, ...) intact.
function toRow(original: MealItemRow, next: CorrectionItem): MealItemRow {
  return {
    ...original,
    name: next.name,
    portion_description: next.portionDescription,
    grams: next.grams,
    kcal: next.kcal,
    kcal_low: next.kcalLow,
    kcal_high: next.kcalHigh,
    protein_g: next.proteinG,
    carbs_g: next.carbsG,
    fat_g: next.fatG,
    fiber_g: next.fiberG,
    confidence: next.confidence,
    user_edited: true,
  };
}

export function CorrectionSheet({
  mealId,
  items: initialItems,
  open,
  onOpenChange,
  onItemsChange,
}: {
  mealId: string;
  items: MealItemRow[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Lets the Eat list's own total and card update the instant an edit
  // lands here — without this, the sheet's own state was the only thing
  // that knew about a change, and the list underneath went stale until
  // a full reload. Fired with the full row shape (not CorrectionItem)
  // so the parent can drop it straight into its query cache.
  onItemsChange: (items: MealItemRow[]) => void;
}) {
  const measure = useMeasure();
  const { push } = useToast();
  const [rows, setRows] = useState<MealItemRow[]>(initialItems);
  const [addingManual, setAddingManual] = useState(false);

  useEffect(() => {
    setRows(initialItems);
  }, [initialItems]);

  const items = rows.map(toCorrectionItem);

  // Low-confidence items sort to the top, labelled "Check this one" — spec §5.
  const sorted = [...items].sort((a, b) => (a.confidence ?? 0) - (b.confidence ?? 0));
  const totalKcal = items.reduce((s, i) => s + i.kcal, 0);
  const totalLow = items.reduce((s, i) => s + (i.kcalLow ?? i.kcal), 0);
  const totalHigh = items.reduce((s, i) => s + (i.kcalHigh ?? i.kcal), 0);

  function commit(newRows: MealItemRow[]) {
    setRows(newRows);
    onItemsChange(newRows);
  }

  async function handleChange(next: CorrectionItem) {
    const original = rows.find((r) => r.id === next.id);
    if (!original) return;
    commit(rows.map((r) => (r.id === next.id ? toRow(original, next) : r)));

    const res = await fetch(`/api/nutrition/meals/${mealId}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: next.id,
        grams: next.grams,
        kcal: next.kcal,
        kcalLow: next.kcalLow,
        kcalHigh: next.kcalHigh,
        proteinG: next.proteinG,
        carbsG: next.carbsG,
        fatG: next.fatG,
        fiberG: next.fiberG,
      }),
    });
    if (!res.ok) push("Couldn't save that change — try again.", "danger");
  }

  async function handleDelete(itemId: string) {
    commit(rows.filter((r) => r.id !== itemId));
    const res = await fetch(`/api/nutrition/meals/${mealId}/items?itemId=${itemId}`, { method: "DELETE" });
    if (!res.ok) push("Couldn't remove that item — try again.", "danger");
  }

  async function handleAddManual(draft: ManualItemDraft) {
    const res = await fetch(`/api/nutrition/meals/${mealId}/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: draft.name, grams: draft.grams ?? undefined, kcal: draft.kcal, proteinG: draft.proteinG, carbsG: draft.carbsG, fatG: draft.fatG, fiberG: 0 }),
    });
    if (!res.ok) {
      push("Couldn't add that item — try again.", "danger");
      return;
    }
    const { item } = await res.json();
    commit([...rows, item]);
    setAddingManual(false);
  }

  async function handleSaveFavorite() {
    const name = window.prompt("Name this meal (e.g. \"My usual breakfast\")");
    if (!name) return;
    const res = await fetch("/api/nutrition/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        sourceMealId: mealId,
        items: items.map((i) => ({
          name: i.name,
          portionDescription: i.portionDescription ?? undefined,
          grams: i.grams,
          kcal: i.kcal,
          proteinG: i.proteinG,
          carbsG: i.carbsG,
          fatG: i.fatG,
          fiberG: i.fiberG,
        })),
      }),
    });
    if (res.ok) push("Saved — you can re-log it in one tap from Eat.");
    else push("Couldn't save that favorite — try again.", "danger");
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Meal details">
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <div>
            <Metric value={measure.energy(totalKcal)} size="xl" />
            {totalLow !== totalHigh ? (
              <p className="text-sm text-ink-muted">
                {Math.round(totalLow)}–{Math.round(totalHigh)}
              </p>
            ) : null}
          </div>
          <Button variant="secondary" size="md" onClick={handleSaveFavorite}>
            Save as favorite
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {sorted.map((item) => (
            <ItemRow key={item.id} item={item} onChange={handleChange} onDelete={() => handleDelete(item.id)} />
          ))}
        </div>

        {addingManual ? (
          <ManualEntryForm onSubmit={handleAddManual} onCancel={() => setAddingManual(false)} />
        ) : (
          <ManualItemRow onClick={() => setAddingManual(true)} className="min-h-14" />
        )}
      </div>
    </Sheet>
  );
}
