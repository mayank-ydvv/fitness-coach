"use client";

import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { useMeasure } from "@/components/prefs/PreferencesProvider";
import { PrBadge } from "./PrBadge";
import type { CompletedSet } from "@/hooks/useSessionPlayer";

/**
 * Collapsed logged sets above the active row. Motion moment #1 lives on
 * entry here (each row springs in as it's added), 180ms, spring-eased.
 *
 * transform + opacity only, not `height` — animating height is exactly
 * what the motion craft rules rule out ("never width, height, top,
 * left"); `layout` (a FLIP transform) already produces the same visual
 * "makes room" effect for the row above it without touching the height
 * property directly. Also gates that transform-based movement (`scale`,
 * `layout` itself) behind `useReducedMotion()` explicitly — the global
 * CSS reduced-motion rule in globals.css only forces near-zero durations
 * on CSS transitions/animations, not on Motion's JS-driven ones, despite
 * what this file's comment used to claim (see DESIGN.md Phase 8).
 */
export function CompletedStack({ completed, prSetIds }: { completed: CompletedSet[]; prSetIds: Set<string> }) {
  const measure = useMeasure();
  const reduceMotion = useReducedMotion();
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
              layout={!reduceMotion}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
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
