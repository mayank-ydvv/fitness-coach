"use client";

import { Stepper } from "@/components/ui/Stepper";
import type { StepProps } from "./types";

export function StepSessionMinutes({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-5">
      <div>
        <h2 className="text-xl font-medium text-ink-primary">How long is a typical session?</h2>
        <p className="mt-1 text-sm text-ink-muted">We&apos;ll fit your program inside this, including rest between sets.</p>
      </div>
      <div className="flex justify-center">
        <Stepper
          value={draft.sessionMinutes}
          onChange={(v) => patch({ sessionMinutes: v })}
          step={15}
          min={15}
          max={180}
          format={(v) => `${v} min`}
          size="lg"
        />
      </div>
    </div>
  );
}
