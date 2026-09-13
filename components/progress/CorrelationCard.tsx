import { Card } from "@/components/ui/Card";
import type { CorrelationResult } from "@/lib/habits/correlate";

/** >=4 weeks of data only, labelled an observation, not causation (spec §8). */
export function CorrelationCard({ habitName, correlation }: { habitName: string; correlation: CorrelationResult }) {
  if (!correlation) return null;
  return (
    <Card>
      <p className="text-sm text-ink-primary">
        On weeks you hit &quot;{habitName}&quot; more often, your average session RPE was{" "}
        {correlation.hitWeeksAvgRpe < correlation.missWeeksAvgRpe ? "lower" : "higher"} ({correlation.hitWeeksAvgRpe} vs {correlation.missWeeksAvgRpe}).
      </p>
      <p className="mt-1 text-xs text-ink-muted">An observation from {correlation.weeksConsidered} weeks of data, not a cause-and-effect claim.</p>
    </Card>
  );
}
