"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { PlateauSignal } from "@/lib/progression/plateau";

/** Best e1RM flat for 3 weeks -> swap / back-off / check sleep+calories
 * (spec §6). Actions are currently informational — wiring "swap" into the
 * session player's exercise-swap flow and "back-off" into the progression
 * engine is a follow-up, not part of this pass. */
export function PlateauCard({ exerciseName, signal }: { exerciseName: string; signal: PlateauSignal }) {
  return (
    <Card className="flex flex-col gap-3">
      <div>
        <p className="text-sm font-medium text-ink-primary">{exerciseName} has plateaued</p>
        <p className="text-sm text-ink-muted">
          No improvement in {signal.weeksFlat} weeks.
          {signal.intakeBelowTargetMostOfPeriod ? " Your intake has been below target for most of that time." : ""}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="md">
          Swap exercise
        </Button>
        <Button variant="secondary" size="md">
          Run a back-off week
        </Button>
        {signal.intakeBelowTargetMostOfPeriod ? (
          <Button variant="secondary" size="md">
            Check sleep &amp; calories
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
