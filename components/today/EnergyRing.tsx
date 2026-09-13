"use client";

import { ProgressRing } from "@/components/ui/ProgressRing";
import { Metric } from "@/components/ui/Metric";

/**
 * The hero metric. When hideEnergy is on, this is a genuinely different
 * component (macro-only, no ring, no kcal number) — not this ring with a
 * value hidden by CSS. See lib/units/format.ts / spec §11.
 */
export function EnergyRing({
  remainingLabel,
  targetLabel,
  fraction,
}: {
  remainingLabel: string;
  targetLabel: string | null;
  fraction: number;
}) {
  const overTarget = fraction > 1;

  return (
    <div className="flex flex-col items-center gap-2 py-4">
      <ProgressRing fraction={Math.min(fraction, 1)} tone={overTarget ? "load-yellow" : "load-blue"} size={180} strokeWidth={12}>
        <div className="flex flex-col items-center">
          <Metric value={remainingLabel} size="hero" />
          <span className="text-sm text-ink-muted">kcal left{targetLabel ? ` of ${targetLabel}` : ""}</span>
        </div>
      </ProgressRing>
    </div>
  );
}
