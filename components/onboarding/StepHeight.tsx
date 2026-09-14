"use client";

import { useState } from "react";
// Input parsing, not display formatting — no hide-energy dimension for
// height, same exemption as the old StepBody (see that file's original
// comment, preserved in git history for the full reasoning).
// eslint-disable-next-line no-restricted-imports
import { cmToFtIn, ftInToCm } from "@/lib/units/convert";
import { Stepper } from "@/components/ui/Stepper";
import { cn } from "@/lib/cn";
import type { StepProps } from "./types";

/** First place units matter, so the toggle lives here — StepWeight just
 * reads draft.unitSystem afterward, "remembered" rather than re-asked. */
export function StepHeight({ draft, patch }: StepProps) {
  const initialFtIn = draft.heightCm ? cmToFtIn(draft.heightCm) : { feet: 5, inches: 8 };
  const [feet, setFeet] = useState(initialFtIn.feet);
  const [inches, setInches] = useState(initialFtIn.inches);
  const isImperial = draft.unitSystem === "imperial";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-medium text-ink-primary">How tall are you?</h2>
        <p className="mt-1 text-sm text-ink-muted">Height factors into your calorie target and how we read your progress.</p>
      </div>

      <div className="inline-flex w-fit rounded-control border border-hairline bg-surface-sunken p-1">
        {(["metric", "imperial"] as const).map((u) => (
          <button
            key={u}
            type="button"
            onClick={() => patch({ unitSystem: u })}
            className={cn(
              "min-h-9 rounded-[calc(var(--radius-control)-4px)] px-3 text-sm font-medium",
              draft.unitSystem === u ? "bg-action text-ink-on-brand" : "text-ink-muted",
            )}
          >
            {u === "metric" ? "cm" : "ft / in"}
          </button>
        ))}
      </div>

      {isImperial ? (
        <div className="flex justify-center gap-6">
          <Stepper
            value={feet}
            onChange={(v) => {
              setFeet(v);
              patch({ heightCm: ftInToCm(v, inches) });
            }}
            min={3}
            max={7}
            format={(v) => `${v} ft`}
            size="lg"
          />
          <Stepper
            value={inches}
            onChange={(v) => {
              setInches(v);
              patch({ heightCm: ftInToCm(feet, v) });
            }}
            min={0}
            max={11}
            format={(v) => `${v} in`}
            size="lg"
          />
        </div>
      ) : (
        <div className="flex justify-center">
          <Stepper value={draft.heightCm ?? 170} onChange={(v) => patch({ heightCm: v })} min={120} max={220} format={(v) => `${v} cm`} size="lg" />
        </div>
      )}
    </div>
  );
}
