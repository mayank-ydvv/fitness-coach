"use client";

import { motion, useReducedMotion } from "motion/react";
import { EASE } from "@/lib/motion/tokens";

/**
 * The "something alive" side of the split auth layout. Was a hand-drawn
 * weight-trend SVG; replaced with a real photo (a folded gym towel by
 * a treadmill — a quiet "you're about to start" beat, not a gym-bro
 * action shot) at the user's request, sourced the same way as Hero's
 * background: 3 candidates shown, one picked. The original frame also
 * had a water bottle with a visible "true fruits" brand label running
 * down the glass — cropped tight to just the towel (public/images/
 * auth-bg.jpg is the pre-cropped file) rather than shipping someone
 * else's brand on the login page. Deliberately not one of Hero's or
 * the chapters' own photos — a fresh image so auth doesn't feel like a
 * re-run of a screen already scrolled past. Same diagonal-scrim
 * treatment as Hero for text legibility.
 */
export function AuthVisual() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative h-56 overflow-hidden md:h-full">
      <div
        aria-hidden
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url(/images/auth-bg.jpg)" }}
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[linear-gradient(200deg,rgba(22,20,15,0.15)_0%,rgba(22,20,15,0.55)_75%,rgba(22,20,15,0.72)_100%)]"
      />
      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE.standard }}
        className="absolute inset-x-0 bottom-0 max-w-[24ch] px-8 py-6 text-sm text-ink-on-brand/90 md:px-10 md:py-10 md:text-base"
      >
        Small changes, tracked over time — not a single day judged on its own.
      </motion.p>
    </div>
  );
}
