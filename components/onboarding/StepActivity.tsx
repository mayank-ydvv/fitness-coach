"use client";

import { ACTIVITY_LEVELS, type ActivityLevel } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { StepProps } from "./types";

export const ACTIVITY_LABELS: Record<ActivityLevel, string> = {
  sedentary: "Sedentary — desk job, little walking",
  light: "Light — some walking or light activity",
  moderate: "Moderate — on your feet most of the day",
  high: "High — physical job or daily hard training",
  athlete: "Athlete — very high daily activity",
};

export function StepActivity({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-medium text-ink-primary">How active is your day outside training?</h2>
      <p className="text-sm text-ink-muted">This sets your calorie target — be honest, not aspirational.</p>
      <div className="flex flex-col gap-2">
        {ACTIVITY_LEVELS.map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => patch({ activityLevel: level })}
            className={cn(
              "min-h-14 rounded-control border px-4 py-3 text-left text-sm font-medium",
              draft.activityLevel === level
                ? "border-action bg-action/10 text-ink-primary"
                : "border-hairline bg-surface-sunken text-ink-muted",
            )}
          >
            {ACTIVITY_LABELS[level]}
          </button>
        ))}
      </div>
    </div>
  );
}
