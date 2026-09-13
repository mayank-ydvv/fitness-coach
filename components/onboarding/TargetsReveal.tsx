"use client";

import { Metric } from "@/components/ui/Metric";
import { Button } from "@/components/ui/Button";
import type { GuardrailNotice } from "@/lib/nutrition/types";

// Renders whatever the server computed and returned — never recomputes
// client-side (lib/nutrition/* is server-only, eslint-enforced).
export function TargetsReveal({
  targets,
  onContinue,
}: {
  targets: { kcal: number; proteinG: number; carbsG: number; fatG: number; notices: GuardrailNotice[] };
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-xl font-medium text-ink-primary">Your starting targets</h2>
        <p className="text-sm text-ink-muted">You can adjust these any time in Settings.</p>
      </div>

      <div className="flex flex-col items-center gap-1 rounded-card border border-hairline bg-surface-sunken py-8">
        <Metric value={String(targets.kcal)} unit="kcal / day" size="hero" />
      </div>

      <div className="grid grid-cols-3 gap-3 text-center">
        <div>
          <Metric value={String(targets.proteinG)} unit="g" size="lg" />
          <p className="text-xs text-ink-muted">Protein</p>
        </div>
        <div>
          <Metric value={String(targets.carbsG)} unit="g" size="lg" />
          <p className="text-xs text-ink-muted">Carbs</p>
        </div>
        <div>
          <Metric value={String(targets.fatG)} unit="g" size="lg" />
          <p className="text-xs text-ink-muted">Fat</p>
        </div>
      </div>

      {/* Each clamp notice shown exactly once, stated plainly — no lecturing. */}
      {targets.notices.map((n) => (
        <p key={n.code} className="rounded-control border border-hairline bg-surface-sunken p-3 text-sm text-ink-muted">
          {n.message}
        </p>
      ))}

      <Button size="lg" onClick={onContinue} className="w-full">
        Go to Today
      </Button>
    </div>
  );
}
