"use client";

// eslint-disable-next-line no-restricted-imports
import { kgToLb, lbToKg } from "@/lib/units/convert";
import { Stepper } from "@/components/ui/Stepper";
import type { StepProps } from "./types";

export function StepWeight({ draft, patch }: StepProps) {
  const isImperial = draft.unitSystem === "imperial";
  const displayValue =
    draft.weightKg === null ? (isImperial ? 154 : 70) : isImperial ? Math.round(kgToLb(draft.weightKg) * 2) / 2 : draft.weightKg;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-medium text-ink-primary">What&apos;s your current weight?</h2>
        <p className="mt-1 text-sm text-ink-muted">The starting point your targets are calculated from — not a judgment, just a number.</p>
      </div>
      <div className="flex justify-center">
        <Stepper
          value={displayValue}
          onChange={(v) => patch({ weightKg: isImperial ? lbToKg(v) : v })}
          step={isImperial ? 1 : 0.5}
          min={isImperial ? 60 : 30}
          max={isImperial ? 660 : 300}
          format={(v) => `${v} ${isImperial ? "lb" : "kg"}`}
          size="lg"
        />
      </div>
    </div>
  );
}
