import { Metric } from "@/components/ui/Metric";

/** The hideEnergy=true replacement for <EnergyRing> — three macro numbers,
 * no ring, no kcal anywhere. Genuinely different UI, not a hidden number. */
export function MacroOnlyHero({
  proteinLabel,
  carbsLabel,
  fatLabel,
}: {
  proteinLabel: string | null;
  carbsLabel: string | null;
  fatLabel: string | null;
}) {
  return (
    <div className="grid grid-cols-3 gap-3 py-6 text-center">
      <div>
        <Metric value={proteinLabel} size="xl" />
        <p className="text-xs text-ink-muted">Protein left</p>
      </div>
      <div>
        <Metric value={carbsLabel} size="xl" />
        <p className="text-xs text-ink-muted">Carbs left</p>
      </div>
      <div>
        <Metric value={fatLabel} size="xl" />
        <p className="text-xs text-ink-muted">Fat left</p>
      </div>
    </div>
  );
}
