"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { GuestButton } from "@/components/auth/GuestButton";
import { EASE, DURATION, STAGGER } from "@/lib/motion/tokens";
import { PLAN_GOALS, PLAN_PREVIEWS, type PlanGoal } from "./planPreviewData";

/**
 * The signature idea (DESIGN.md §8): the hero doesn't describe the
 * product, it runs a small piece of it. Picking a goal swaps the preview
 * below using the app's own components (Card, Chip) — a real UI update,
 * not a video loop or screenshot. This is the one signature motion
 * moment the brief allots (up to 800ms) — spent proving the product,
 * not decorating the headline.
 */
export function Hero() {
  const [goal, setGoal] = useState<PlanGoal>("strength");
  // Gates the preview's per-row stagger so it plays only on a real goal
  // SWITCH, never on first paint — "motion shows what changed", and
  // nothing has changed yet on page load. Without this, the initial
  // stagger races first paint: a scan immediately after load (an a11y
  // test, or just a fast machine) can catch a row still mid-fade, which
  // reads as a false-positive contrast violation — caught by
  // npm run test:a11y, not by eye.
  const [hasInteracted, setHasInteracted] = useState(false);
  const reduceMotion = useReducedMotion();
  const skipEntrance = reduceMotion || !hasInteracted;
  const days = PLAN_PREVIEWS[goal];

  return (
    <div id="top" className="mx-auto max-w-5xl px-5 pb-20 pt-10 lg:pt-16">
      <motion.div
        initial={reduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: DURATION.hero, ease: EASE.standard }}
        className="grid gap-10 lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-16"
      >
        <div>
          <h1 className="max-w-md text-4xl font-semibold leading-[1.1] text-ink-primary lg:text-5xl">
            Pick where you&apos;re starting.
          </h1>

          <div className="mt-6 flex flex-wrap gap-2.5">
            {PLAN_GOALS.map((g) => (
              <Chip
                key={g.id}
                selected={goal === g.id}
                onClick={() => {
                  setGoal(g.id);
                  setHasInteracted(true);
                }}
              >
                {g.label}
              </Chip>
            ))}
          </div>

          <p className="mt-6 max-w-md text-ink-muted">
            A training and food log that pays attention to what you actually did — not a plan built once
            and left to go stale.
          </p>

          <div className="mt-7 flex flex-col items-start gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login">
                <Button size="lg">Create your account</Button>
              </Link>
              <Link href="/demo">
                <Button variant="secondary" size="lg">
                  See a demo first
                </Button>
              </Link>
            </div>
            <GuestButton className="text-sm">Or continue as a guest — nothing you do will be saved</GuestButton>
          </div>
        </div>

        <Card className="lg:mt-2">
          <p className="text-sm font-medium text-ink-muted">Your first week, live</p>
          <div className="mt-3 flex flex-col">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={goal}
                initial={skipEntrance ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: DURATION.transition, ease: EASE.standard }}
                className="flex flex-col divide-y divide-hairline"
              >
                {days.map((d, i) => (
                  <motion.div
                    key={d.day}
                    initial={skipEntrance ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: DURATION.feedback, delay: skipEntrance ? 0 : i * STAGGER, ease: EASE.standard }}
                    className="flex items-baseline justify-between gap-4 py-3"
                  >
                    <span className="w-10 shrink-0 text-sm font-medium text-ink-muted">{d.day}</span>
                    <span className={d.minutes === null ? "text-ink-muted" : "text-ink-primary"}>{d.session}</span>
                    <span className="metric shrink-0 text-sm text-ink-muted">{d.minutes ? `${d.minutes} min` : ""}</span>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatePresence>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
