import Link from "next/link";
import { Metric } from "@/components/ui/Metric";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { ProgressionDecision } from "@/lib/progression/types";

export function SessionSummary({
  totalVolumeKg,
  setsCompleted,
  durationMinutes,
  prCount,
  decisions,
  deloadReason,
}: {
  totalVolumeKg: number;
  setsCompleted: number;
  durationMinutes: number;
  prCount: number;
  decisions: ProgressionDecision[];
  deloadReason: string | null;
}) {
  const increases = decisions.filter((d) => d.outcome === "increase");

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-3xl font-normal tracking-[-0.02em] text-ink-primary">Session complete</h1>

      <div className="grid grid-cols-3 gap-3 text-center">
        <Card className="py-4">
          <Metric value={String(Math.round(totalVolumeKg))} unit="kg" size="lg" />
          <p className="text-xs text-ink-muted">Volume</p>
        </Card>
        <Card className="py-4">
          <Metric value={String(setsCompleted)} size="lg" />
          <p className="text-xs text-ink-muted">Sets</p>
        </Card>
        <Card className="py-4">
          <Metric value={String(durationMinutes)} unit="min" size="lg" />
          <p className="text-xs text-ink-muted">Duration</p>
        </Card>
      </div>

      {prCount > 0 ? (
        <Card>
          <p className="text-sm text-ink-primary">
            {prCount} personal record{prCount > 1 ? "s" : ""} today.
          </p>
        </Card>
      ) : null}

      {increases.length > 0 ? (
        <Card className="flex flex-col gap-1">
          <p className="text-sm font-medium text-ink-primary">Next session</p>
          {increases.map((d) => (
            <p key={d.exerciseId} className="text-sm text-ink-muted">
              +{Math.round((d.nextLoadKg - d.previousLoadKg) * 10) / 10} kg → {d.nextLoadKg} kg
            </p>
          ))}
        </Card>
      ) : null}

      {deloadReason ? (
        <Card>
          <p className="text-sm text-ink-muted">{deloadReason}</p>
        </Card>
      ) : null}

      <Link href="/train">
        <Button size="lg" className="w-full">
          Done
        </Button>
      </Link>
    </div>
  );
}
