"use client";

import { NumberInput } from "@/components/ui/NumberInput";
import { Stepper } from "@/components/ui/Stepper";

/**
 * "How many did you eat" (a photo of one sandwich, but the user ate
 * two) plus a direct gram override for precision — the two ways
 * people actually think about portion size. Quantity is a whole-unit
 * stepper (min 1) driven off the item's own baseline in `ItemRow`, not
 * a live-scaling multiplier, so repeated taps never compound drift.
 * Hidden when the item has no gram estimate to scale from at all.
 */
export function PortionControl({
  grams,
  quantity,
  onQuantity,
  onGrams,
}: {
  grams: number | null;
  quantity: number | null;
  onQuantity: (quantity: number) => void;
  onGrams: (grams: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4">
      {quantity !== null ? (
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-muted">Qty</span>
          <Stepper value={quantity} onChange={onQuantity} min={1} step={1} size="md" className="gap-1.5" />
        </div>
      ) : null}
      <div className="flex items-center gap-1.5">
        <NumberInput
          aria-label="Grams"
          value={grams ?? ""}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v) && v > 0) onGrams(v);
          }}
          className="w-20"
        />
        <span className="text-sm text-ink-muted">g</span>
      </div>
    </div>
  );
}
