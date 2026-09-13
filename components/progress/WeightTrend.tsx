import { Card } from "@/components/ui/Card";
import { LineChart } from "./LineChart";
import { weightTrend, type WeightPoint } from "@/lib/progress/series";
import type { Measure } from "@/lib/units/format";

export function WeightTrend({ bodyMetrics, measure }: { bodyMetrics: { recorded_on: string; weight_kg: number | null }[]; measure: Measure }) {
  const points: WeightPoint[] = weightTrend(bodyMetrics);

  return (
    <Card>
      <p className="mb-2 text-sm font-medium text-ink-primary">Weight</p>
      <LineChart points={points.map((p) => ({ x: p.date, y: p.weightKg }))} formatValue={(v) => measure.mass(v) ?? ""} />
    </Card>
  );
}
