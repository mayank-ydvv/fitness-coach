"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion/tokens";

/**
 * The "something alive" side of the split auth layout — drawn from the
 * app's own subject matter (a weight trend, smoothed, the same shape
 * WeightTrend/LineChart draw inside the real app), not a stock gym photo
 * or a gradient blob. Draws itself in once via `pathLength` on mount —
 * the auth pages' own small motion moment, not a loop: it draws once and
 * stops, same "nothing loops while someone is reading" rule as
 * everywhere else. Under reduced motion it just renders settled.
 */
export function AuthVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="flex h-full flex-col justify-center bg-surface-sunken px-8 py-8 md:px-10 md:py-16">
      <svg
        viewBox="0 0 320 200"
        className="h-24 w-full max-w-sm md:h-auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label="A smoothed weight trend line, gradually sloping down over several weeks"
      >
        <motion.path
          d="M10,40 C50,45 60,70 90,68 S140,90 160,95 S210,120 230,118 S280,150 310,160"
          fill="none"
          stroke="#1F6F68"
          strokeWidth={3}
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease: EASE.standard }}
        />
      </svg>
      <p className="mt-4 max-w-[22ch] text-sm text-ink-muted md:mt-6 md:text-base">
        Small changes, tracked over time — not a single day judged on its own.
      </p>
    </div>
  );
}
