"use client";

import Link from "next/link";
import { motion, useReducedMotion, type Variants } from "motion/react";
import { Button } from "@/components/ui/Button";
import { GuestButton } from "@/components/auth/GuestButton";

/**
 * Landing-page entrance choreography. Separate from the in-app "motion
 * budget" of exactly three moments documented in CLAUDE.md — that budget
 * scopes product interactions (logging a set, a habit dot, the rest
 * timer); this is marketing-surface, seen once per visitor, and is a
 * single staged reveal (one animation, several children), not a fourth
 * interaction moment.
 */
const container: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
  },
};

const item: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={container}
      initial={reduceMotion ? "show" : "hidden"}
      animate="show"
      className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-surface-base px-5 text-center"
    >
      <div>
        <motion.h1 variants={item} className="mb-2 text-3xl font-semibold text-ink-primary">
          AI Fitness Coach
        </motion.h1>
        <motion.p variants={item} className="mx-auto max-w-sm text-ink-muted">
          Photograph your meals. Get a program that adjusts to what you actually log. Check your form
          with your camera. See the numbers move.
        </motion.p>
      </div>
      <motion.div variants={item} className="flex flex-col items-center gap-3">
        <motion.div whileTap={reduceMotion ? undefined : { scale: 0.96 }}>
          <Link href="/login">
            <Button size="lg">Get started</Button>
          </Link>
        </motion.div>
        <Link href="/demo" className="text-sm font-medium text-ink-muted underline underline-offset-2">
          See a demo first
        </Link>
        <GuestButton>Or continue as a guest — nothing you do will be saved</GuestButton>
      </motion.div>
    </motion.div>
  );
}
