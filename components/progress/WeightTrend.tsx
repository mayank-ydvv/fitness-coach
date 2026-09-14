"use client";

import { useMemo, useState } from "react";
import { ChartShell } from "@/components/ui/ChartShell";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { LineChart } from "./LineChart";
import { weightTrend, smoothWeightTrend, type WeightPoint } from "@/lib/progress/series";
import { makeFormatter } from "@/lib/units/format";
import type { UnitSystem } from "@/lib/types";

const RANGES = [
  { value: "week", label: "Week", days: 7 },
  { value: "month", label: "Month", days: 30 },
  { value: "all", label: "All", days: null },
] as const;
type Range = (typeof RANGES)[number]["value"];

function sliceByRange(points: WeightPoint[], days: number | null): WeightPoint[] {
  if (days === null || points.length === 0) return points;
  const cutoff = points[points.length - 1].date;
  const cutoffDate = new Date(cutoff);
  cutoffDate.setDate(cutoffDate.getDate() - days);
  const cutoffIso = cutoffDate.toISOString().slice(0, 10);
  return points.filter((p) => p.date >= cutoffIso);
}

/**
 * Range switching redraws the same chart rather than swapping components
 * (brief §12) — the smoothing is recomputed on the sliced window, not
 * just clipped from the full-range smoothed line, so "week" reflects
 * only that week's own noise character.
 */
/**
 * Takes `unitSystem` (plain, serializable), not a pre-built `Measure` —
 * `Measure`'s formatter methods are closures, and a Server Component
 * can't hand a function across to a Client Component (this component
 * needs to be a client component for the range-switcher state). Builds
 * its own formatter locally; `makeFormatter` is a pure, universal
 * function, safe to call here.
 */
export function WeightTrend({
  bodyMetrics,
  unitSystem,
}: {
  bodyMetrics: { recorded_on: string; weight_kg: number | null }[];
  unitSystem: UnitSystem;
}) {
  const measure = useMemo(() => makeFormatter({ unitSystem, hideEnergy: false }), [unitSystem]);
  const [range, setRange] = useState<Range>("month");
  const allPoints = useMemo(() => weightTrend(bodyMetrics), [bodyMetrics]);
  const rangeDays = RANGES.find((r) => r.value === range)?.days ?? null;
  const sliced = useMemo(() => sliceByRange(allPoints, rangeDays), [allPoints, rangeDays]);
  const smoothed = useMemo(() => smoothWeightTrend(sliced), [sliced]);

  const summary =
    smoothed.length >= 2
      ? `Weight trending ${smoothed[smoothed.length - 1].weightKg >= smoothed[0].weightKg ? "up" : "down"} from ${measure.mass(smoothed[0].weightKg)} to ${measure.mass(smoothed[smoothed.length - 1].weightKg)} over the selected range`
      : "Not enough weight entries yet for a trend";

  return (
    <ChartShell
      title="Weight"
      summary={summary}
      rangeControl={
        <SegmentedControl
          aria-label="Range"
          value={range}
          onChange={(v) => setRange(v)}
          options={RANGES.map((r) => ({ value: r.value, label: r.label }))}
        />
      }
    >
      <LineChart points={smoothed.map((p) => ({ x: p.date, y: p.weightKg }))} formatValue={(v) => measure.mass(v) ?? ""} />
    </ChartShell>
  );
}
