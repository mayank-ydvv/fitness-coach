import { Metric } from "@/components/ui/Metric";
import { StatusDot } from "@/components/ui/StatusDot";
import { Card } from "@/components/ui/Card";
import type { Tables } from "@/lib/supabase/database.types";

type RepMetric = { repIndex: number; minAngle: number; maxAngle: number; score: number; faults: { code: string; severity: "minor" | "major" }[] };

export function FormSummary({ analysis }: { analysis: Tables<"form_analyses"> }) {
  const repMetrics = (analysis.rep_metrics as unknown as RepMetric[]) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Metric value={String(analysis.overall_score ?? 0)} unit="/ 100" size="hero" />
        <StatusDot tone="load-blue" label={`${analysis.rep_count} reps`} />
      </div>

      <Card className="flex flex-col gap-2">
        {repMetrics.map((rep) => (
          <div key={rep.repIndex} className="flex items-center justify-between text-sm">
            <span className="text-ink-muted">Rep {rep.repIndex + 1}</span>
            <span className="flex items-center gap-2">
              <span className="metric text-ink-primary">{rep.score}</span>
              {rep.faults.length > 0 ? (
                <StatusDot tone={rep.faults.some((f) => f.severity === "major") ? "load-red" : "load-yellow"} label={rep.faults.map((f) => f.code).join(", ")} />
              ) : null}
            </span>
          </div>
        ))}
      </Card>

      {analysis.coach_summary ? (
        <Card>
          <p className="text-sm text-ink-primary">{analysis.coach_summary}</p>
        </Card>
      ) : null}
    </div>
  );
}
