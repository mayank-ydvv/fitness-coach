"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/cn";
import { AutoMarker } from "./AutoMarker";

const TONE_CLASS: Record<string, string> = {
  "load-green": "bg-load-green border-load-green",
  "load-yellow": "bg-load-yellow border-load-yellow",
  "load-blue": "bg-load-blue border-load-blue",
  "load-red": "bg-load-red border-load-red",
};

/**
 * Motion moment #3: fills from centre, 120ms, on tap.
 *
 * The old comment here claimed the global instant-transition rule in
 * globals.css covers this — it doesn't. That rule forces near-zero
 * durations on CSS transitions/animations only; this scale keyframe is
 * driven by Motion in JS, which the CSS rule never touches (found while
 * auditing every Motion usage in the app for the same gap — see
 * DESIGN.md Phase 8). Explicit `useReducedMotion()` check added.
 */
export function HabitDot({
  name,
  emoji,
  done,
  isAuto,
  colorToken,
  onToggle,
}: {
  name: string;
  emoji: string | null;
  done: boolean;
  isAuto: boolean;
  colorToken: string;
  onToggle: () => void;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={done}
      aria-label={`${name}${done ? ", done today" : ", not done today"}`}
      className="flex min-h-11 flex-col items-center gap-1 px-1"
    >
      <span className={cn("relative flex size-10 items-center justify-center overflow-hidden rounded-full border text-base", done ? TONE_CLASS[colorToken] ?? TONE_CLASS["load-green"] : "border-hairline bg-surface-sunken")}>
        {done ? (
          <motion.span
            initial={reduceMotion ? false : { scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.12, ease: [0.22, 1, 0.36, 1] }}
            className="text-ink-inverse"
          >
            {emoji ?? "✓"}
          </motion.span>
        ) : (
          <span className="text-ink-muted">{emoji ?? "•"}</span>
        )}
      </span>
      <span className="flex items-center gap-0.5 text-center text-[11px] text-ink-muted">
        <span className="max-w-14 truncate">{name}</span>
        {isAuto ? <AutoMarker /> : null}
      </span>
    </button>
  );
}
