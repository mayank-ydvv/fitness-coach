"use client";

import { Button } from "@/components/ui/Button";
import { RestRing } from "./RestRing";
import type { useRestTimer } from "@/hooks/useRestTimer";

export function RestTimer({ timer }: { timer: ReturnType<typeof useRestTimer> }) {
  if (!timer.active) return null;
  return (
    <div className="flex flex-col items-center gap-3 rounded-card border border-hairline bg-surface-raised p-5">
      <RestRing remainingSeconds={timer.remainingSeconds} fraction={timer.fraction} overdueSeconds={timer.overdueSeconds} />
      <p className="text-center text-sm text-ink-muted">Keep this screen on — we&apos;ll buzz at zero.</p>
      <Button variant="secondary" onClick={timer.skip}>
        Skip rest
      </Button>
    </div>
  );
}
