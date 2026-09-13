"use client";

import { SegmentedControl } from "@/components/ui/SegmentedControl";

const RPE_SUBLABELS: Record<number, string> = {
  6: "easy",
  7: "3+ left",
  8: "2 left",
  9: "1 left",
  10: "maxed",
};

/** 6-10 segmented control with plain-language sub-labels, optional and
 * skippable — RPE is real user input, not required to log a set. */
export function RpeSelector({ value, onChange }: { value: number | null; onChange: (rpe: number | null) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-ink-primary">RPE</span>
        {value !== null ? (
          <button type="button" onClick={() => onChange(null)} className="text-xs text-ink-muted underline underline-offset-2">
            Skip
          </button>
        ) : null}
      </div>
      <SegmentedControl
        aria-label="RPE"
        value={value !== null ? String(value) : undefined}
        onChange={(v) => onChange(Number(v))}
        options={[6, 7, 8, 9, 10].map((n) => ({ value: String(n), label: String(n), sublabel: RPE_SUBLABELS[n] }))}
      />
    </div>
  );
}
