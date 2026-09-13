"use client";

import { Stepper } from "@/components/ui/Stepper";
import type { StepProps } from "./types";

export function StepSchedule({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-medium text-ink-primary">How many days a week can you train?</h2>
        <p className="mb-3 text-sm text-ink-muted">This decides your split — full body, upper/lower, or push/pull/legs.</p>
        <Stepper value={draft.daysPerWeek} onChange={(v) => patch({ daysPerWeek: v })} min={1} max={7} size="md" />
      </div>
      <div>
        <h2 className="text-xl font-medium text-ink-primary">How long is a typical session?</h2>
        <p className="mb-3 text-sm text-ink-muted">In minutes — we&apos;ll fit your program inside this.</p>
        <Stepper value={draft.sessionMinutes} onChange={(v) => patch({ sessionMinutes: v })} step={15} min={15} max={180} size="md" />
      </div>
    </div>
  );
}
