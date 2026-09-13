"use client";

import { motion, AnimatePresence } from "motion/react";
import { useMeasure } from "@/components/prefs/PreferencesProvider";
import { PrBadge } from "./PrBadge";
import type { CompletedSet } from "@/hooks/useSessionPlayer";

/** Collapsed logged sets above the active row. Motion moment #1 lives on
 * entry here (each row springs in as it's added), 180ms, spring-eased. */
export function CompletedStack({ completed, prSetIds }: { completed: CompletedSet[]; prSetIds: Set<string> }) {
  const measure = useMeasure();
  if (completed.length === 0) return null;

  return (
    <div className="flex flex-col gap-1.5">
      <AnimatePresence initial={false}>
        {completed
          .slice()
          .reverse()
          .map((set) => (
            <motion.div
              key={set.id}
              layout
              initial={{ opacity: 0, scale: 0.96, height: 0 }}
              animate={{ opacity: 1, scale: 1, height: "auto" }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center justify-between rounded-control border border-hairline bg-surface-sunken px-3 py-2 text-sm"
            >
              <span className="text-ink-muted">
                {set.exerciseName} · {set.isWarmup ? "warmup" : `set ${set.setNumber}`}
              </span>
              <span className="flex items-center gap-2">
                <span className="metric text-ink-primary">
                  {measure.mass(set.actualLoadKg)} × {set.actualReps}
                </span>
                {prSetIds.has(set.id) ? <PrBadge /> : null}
              </span>
            </motion.div>
          ))}
      </AnimatePresence>
    </div>
  );
}
