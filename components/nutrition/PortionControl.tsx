"use client";

import { cn } from "@/lib/cn";
import { NumberInput } from "@/components/ui/NumberInput";

const MULTIPLIERS = [0.5, 1, 1.5, 2] as const;

export function PortionControl({
  grams,
  onMultiplier,
  onGrams,
}: {
  grams: number | null;
  onMultiplier: (m: (typeof MULTIPLIERS)[number]) => void;
  onGrams: (grams: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="inline-flex rounded-control border border-hairline bg-surface-sunken p-1">
        {MULTIPLIERS.map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onMultiplier(m)}
            className={cn("min-h-9 rounded-[calc(var(--radius-control)-4px)] px-2.5 text-sm font-medium text-ink-muted")}
          >
            {m}×
          </button>
        ))}
      </div>
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
