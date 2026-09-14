"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Stepper } from "@/components/ui/Stepper";
import { Button } from "@/components/ui/Button";
import { useMeasure } from "@/components/prefs/PreferencesProvider";
import { RpeSelector } from "./RpeSelector";
import { LastTimeLine } from "./LastTimeLine";
import type { PlannedSetView } from "@/hooks/useSessionPlayer";

/**
 * The active set row. Pre-filled with the prescribed load/reps so the
 * common case is one tap on Log set. Motion moment #1 (the 180ms spring
 * collapse into the completed stack) happens one level up in SessionPlayer,
 * keyed on the set's id via AnimatePresence — this component just renders
 * the live editable state and calls onLog.
 */
export function SetRow({
  set,
  positionLabel,
  last,
  pending,
  onLog,
}: {
  set: PlannedSetView;
  positionLabel: string;
  last: { loadKg: number; reps: number; rpe: number | null } | undefined;
  pending: boolean;
  onLog: (reps: number, loadKg: number, rpe: number | null) => void;
}) {
  const measure = useMeasure();
  const reduceMotion = useReducedMotion();
  const [reps, setReps] = useState(set.targetRepsHigh);
  const [loadKg, setLoadKg] = useState(set.targetLoadKg ?? last?.loadKg ?? 20);
  const [rpe, setRpe] = useState<number | null>(set.targetRpe ?? null);

  return (
    <motion.div layout={!reduceMotion} initial={false} className="flex flex-col gap-4 rounded-card border border-hairline bg-surface-raised p-5">
      <div>
        <p className="text-sm font-medium text-ink-primary">{set.exerciseName}</p>
        <p className="text-sm text-ink-muted">
          {set.isWarmup ? "Warmup" : positionLabel} · {set.targetRepsLow}–{set.targetRepsHigh} reps
          {set.targetRpe !== null ? ` @ RPE ${set.targetRpe}` : ""}
        </p>
        <LastTimeLine last={last} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-muted">Load ({measure.unitSystem === "imperial" ? "lb" : "kg"})</p>
          <Stepper value={loadKg} onChange={setLoadKg} step={set.loadIncrementKg || 2.5} min={0} size="lg" />
        </div>
        <div>
          <p className="mb-1.5 text-xs font-medium text-ink-muted">Reps</p>
          <Stepper value={reps} onChange={setReps} step={1} min={0} size="lg" />
        </div>
      </div>

      {!set.isWarmup ? <RpeSelector value={rpe} onChange={setRpe} /> : null}

      <Button size="lg" loading={pending} onClick={() => onLog(reps, loadKg, rpe)} className="w-full">
        Log set
      </Button>
    </motion.div>
  );
}
