"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/Button";
import { RestRing } from "./RestRing";
import { EASE, DURATION } from "@/lib/motion/tokens";
import type { useRestTimer } from "@/hooks/useRestTimer";

/**
 * A full-screen takeover, not an inline card (brief §9: "rest timer that
 * takes over the screen and is readable at a glance" — the plan's own
 * visual-direction note goes further: "a rest timer overlay floats more
 * than a card"). Minimal chrome: the ring, the copy, one button — the
 * exact set/rep controls stay reachable underneath but visually gone
 * while resting, since there's nothing to do but wait or skip.
 */
export function RestTimer({ timer }: { timer: ReturnType<typeof useRestTimer> }) {
  return (
    <AnimatePresence>
      {timer.active ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: DURATION.transition, ease: EASE.standard }}
          className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 bg-surface-base"
        >
          <RestRing remainingSeconds={timer.remainingSeconds} fraction={timer.fraction} overdueSeconds={timer.overdueSeconds} size={240} />
          <p className="text-center text-ink-muted">Keep this screen on — we&apos;ll buzz at zero.</p>
          <Button size="lg" variant="secondary" onClick={timer.skip}>
            Skip rest
          </Button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
