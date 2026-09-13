import { Card } from "@/components/ui/Card";
import { Metric } from "@/components/ui/Metric";
import type { Measure } from "@/lib/units/format";

/** Respects hideEnergy the same as everywhere else — protein itself is
 * never hidden (only kcal is), but this card sits right next to a kcal
 * context, so it goes through the same Measure object for consistency. */
export function ProteinAverage({ averageG, targetG, measure }: { averageG: number | null; targetG: number | null; measure: Measure }) {
  if (averageG === null) return null;
  return (
    <Card>
      <p className="mb-1 text-sm font-medium text-ink-primary">7-day protein average</p>
      <Metric value={measure.macro(averageG)} unit={targetG ? `of ${measure.macro(targetG)} target` : undefined} size="lg" />
    </Card>
  );
}
