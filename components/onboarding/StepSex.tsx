"use client";

import { SEXES, type Sex } from "@/lib/types";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import type { StepProps } from "./types";

export const SEX_LABELS: Record<Sex, string> = { male: "Male", female: "Female", unspecified: "Prefer not to say" };

export function StepSex({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-medium text-ink-primary">What&apos;s your sex?</h2>
      <p className="text-sm text-ink-muted">Used only to calculate your calorie and macro targets accurately.</p>
      <SegmentedControl
        aria-label="Sex"
        value={draft.sex ?? undefined}
        onChange={(v) => patch({ sex: v })}
        options={SEXES.map((s) => ({ value: s, label: SEX_LABELS[s] }))}
      />
    </div>
  );
}
