"use client";

import { EXPERIENCE_LEVELS, type ExperienceLevel } from "@/lib/types";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { StepProps } from "./types";

const LABELS: Record<ExperienceLevel, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function StepExperience({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-medium text-ink-primary">How much training experience do you have?</h2>
      <SegmentedControl
        aria-label="Experience level"
        value={draft.experienceLevel ?? undefined}
        onChange={(v) => patch({ experienceLevel: v })}
        options={EXPERIENCE_LEVELS.map((l) => ({ value: l, label: LABELS[l] }))}
      />
    </div>
  );
}
