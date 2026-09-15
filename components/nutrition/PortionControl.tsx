"use client";

import { NumberInput } from "@/components/ui/NumberInput";

/**
 * Per-ingredient weight correction only. A "how many did you eat"
 * quantity control belongs one level up, on the meal as a whole
 * (`CorrectionSheet`'s own Qty stepper) — not here per ingredient. A
 * sandwich photo splits into bread/filling/spread with no way to know
 * how much onion or butter was actually inside each one, so a
 * per-item quantity stepper here was answering a question users can't
 * actually answer; the meal-level control scales all of them together
 * off one number instead.
 */
export function PortionControl({ grams, onGrams }: { grams: number | null; onGrams: (grams: number) => void }) {
  return (
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
  );
}
