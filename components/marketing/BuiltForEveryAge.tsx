"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { EASE, DURATION, STAGGER } from "@/lib/motion/tokens";

const STATEMENTS = [
  {
    title: "First week of exercise",
    body: "The plan starts from your own numbers and current ability — not an average, and not an assumption that weight loss is the goal.",
  },
  {
    title: "Twentieth year training",
    body: "Real progression logic tracks your actual loads and adjusts week to week. It backs off after two missed targets instead of pretending nothing happened.",
  },
];

/**
 * One of the brief's two allotted scroll-triggered reveals — used here
 * because the sequential reveal itself communicates the point (these are
 * two different people, arriving at the same plan from opposite ends),
 * not decoration. Everything else on this page is static.
 */
export function BuiltForEveryAge() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const reduceMotion = useReducedMotion();

  return (
    <section ref={ref} className="mx-auto max-w-3xl px-5 py-16">
      <h2 className="text-3xl font-normal text-ink-primary">Built for every age.</h2>
      <p className="mt-3 max-w-xl text-ink-muted">
        Whether this is your first week of exercise or your twentieth year training, the plan starts
        from your numbers, not an average.
      </p>
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {STATEMENTS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: DURATION.transition, delay: i * STAGGER * 2, ease: EASE.standard }}
            className="rounded-card border border-hairline bg-surface-raised p-5 shadow-raised"
          >
            <p className="font-medium text-ink-primary">{s.title}</p>
            <p className="mt-2 text-ink-muted">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
