"use client";

import { useEffect, useState } from "react";
import { Metric } from "@/components/ui/Metric";

/** Plank's variant — no rep counting, a hold timer instead (spec §7). */
export function HoldTimer({ running }: { running: boolean }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    const interval = setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 250);
    return () => clearInterval(interval);
  }, [running]);

  return (
    <div className="absolute left-4 top-4 rounded-control bg-surface-base/90 px-3 py-2">
      <Metric value={String(seconds)} unit="sec" size="lg" />
    </div>
  );
}
