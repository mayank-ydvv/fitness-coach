"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

const OPTIONS = [
  { value: "weight", label: "Weight" },
  { value: "strength", label: "Strength" },
  { value: "habits", label: "Habits" },
] as const;
type Metric = (typeof OPTIONS)[number]["value"];
const STORAGE_KEY = "progress-headline-metric";

/**
 * "Let the user choose the headline metric — weight is not everyone's
 * goal" (brief §12). Client-only preference (localStorage), not a new
 * profile column — reordering which chart leads is presentation, not a
 * data-model change. Defaults to Weight (today's rendering order) so a
 * user who never touches this sees no change at all.
 */
export function HeadlineMetricPicker({
  weight,
  strength,
  habits,
}: {
  weight: ReactNode;
  strength: ReactNode;
  habits: ReactNode;
}) {
  const [metric, setMetric] = useState<Metric>("weight");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored === "weight" || stored === "strength" || stored === "habits") setMetric(stored);
    } catch {
      // Storage unavailable — stays on the default order.
    }
  }, []);

  function choose(next: Metric) {
    setMetric(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Fine to not persist; the choice still applies for this visit.
    }
  }

  const sections: Record<Metric, ReactNode> = { weight, strength, habits };
  const order: Metric[] = [metric, ...OPTIONS.map((o) => o.value).filter((v) => v !== metric)];

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl aria-label="Headline metric" value={metric} onChange={choose} options={[...OPTIONS]} />
      {order.map((key) => (
        <div key={key}>{sections[key]}</div>
      ))}
    </div>
  );
}
