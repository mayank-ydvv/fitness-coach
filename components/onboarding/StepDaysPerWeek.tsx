"use client";

import { Stepper } from "@/components/ui/Stepper";
import type { StepProps } from "./types";

export function StepDaysPerWeek({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-medium text-ink-primary">How many days a week can you train?</h2>
        <p className="mt-1 text-sm text-ink-muted">This decides your split — full body, upper/lower, or push/pull/legs.</p>
      </div>
      <div className="flex justify-center">
        <Stepper value={draft.daysPerWeek} onChange={(v) => patch({ daysPerWeek: v })} min={1} max={7} size="lg" />
      </div>
    </div>
  );
}
