"use client";

import { GOALS, type Goal } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { StepProps } from "./types";

// Exported for StepReview's editable-summary labels — one source of
// truth rather than a second copy that can drift.
export const GOAL_LABELS: Record<Goal, string> = {
  fat_loss: "Lose fat",
  muscle_gain: "Build muscle",
  strength: "Get stronger",
  endurance: "Build endurance",
  general_health: "General health",
};

export function StepGoal({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-medium text-ink-primary">What&apos;s the main goal?</h2>
      <p className="text-sm text-ink-muted">You can change this later — it just shapes your starting plan.</p>
      <div className="grid grid-cols-2 gap-2">
        {GOALS.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => patch({ goal: g })}
            className={cn(
              "min-h-14 rounded-control border px-4 py-3 text-left text-sm font-medium",
              draft.goal === g
                ? "border-action bg-action/10 text-ink-primary"
                : "border-hairline bg-surface-sunken text-ink-muted",
            )}
          >
            {GOAL_LABELS[g]}
          </button>
        ))}
      </div>
    </div>
  );
}
