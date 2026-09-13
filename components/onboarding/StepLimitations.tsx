"use client";

import type { StepProps } from "./types";

export function StepLimitations({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-medium text-ink-primary">Any injuries or movements to avoid?</h2>
      <p className="text-sm text-ink-muted">Optional. We&apos;ll substitute exercises around anything you list here.</p>
      <textarea
        value={draft.limitations}
        onChange={(e) => patch({ limitations: e.target.value })}
        maxLength={500}
        rows={4}
        placeholder="e.g. bad left knee, avoid overhead pressing"
        className="rounded-control border border-hairline bg-surface-sunken p-3 text-base text-ink-primary placeholder:text-ink-muted focus-visible:border-focus"
      />
    </div>
  );
}
