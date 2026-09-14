import { Metric } from "@/components/ui/Metric";
import { Card } from "@/components/ui/Card";

/**
 * The hero metric. When hideEnergy is on, this is a genuinely different
 * component (macro-only, no ring, no kcal number) — not this ring with a
 * value hidden by CSS. See lib/units/format.ts / spec §11.
 *
 * No ring — the brief explicitly rules out an Apple Watch-style
 * concentric progress ring for a static daily number. A plain number
 * plus a neutral bar. Going over target is NOT styled as an alarm: the
 * bar fill color never changes based on being over — "state the number
 * plainly; the user can see it" — punitive food UI is bad product
 * design (brief §10). The bar simply caps visually at 100% width; the
 * number itself (which can go negative) is what actually communicates
 * "over."
 */
export function EnergyRing({
  remainingLabel,
  targetLabel,
  fraction,
}: {
  remainingLabel: string;
  targetLabel: string | null;
  fraction: number;
}) {
  return (
    <Card className="flex flex-col items-center gap-4 py-8 shadow-floating">
      <div className="flex flex-col items-center">
        <Metric value={remainingLabel} size="hero" />
        <span className="text-sm text-ink-muted">kcal left{targetLabel ? ` of ${targetLabel}` : ""}</span>
      </div>
      <div className="h-2 w-full max-w-56 overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-action" style={{ width: `${Math.min(1, Math.max(0, fraction)) * 100}%` }} />
      </div>
    </Card>
  );
}
