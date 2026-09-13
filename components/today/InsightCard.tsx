import { Card } from "@/components/ui/Card";
import { insightMessage, type Insight } from "@/lib/progress/insights";

/** Exactly one insight, rotating — spec §9's Today priority order item 5. */
export function InsightCard({ insight }: { insight: Insight | null }) {
  if (!insight) return null;
  return (
    <Card>
      <p className="text-sm text-ink-primary">{insightMessage(insight)}</p>
    </Card>
  );
}
