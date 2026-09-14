"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { EASE, DURATION, STAGGER } from "@/lib/motion/tokens";

const CALLOUTS = [
  { n: 1, title: "One next action", body: "The session or meal you'd actually do first — not a wall of options." },
  { n: 2, title: "The number you check", body: "Calories left, stated plainly. No ring, no color coding it as good or bad." },
  { n: 3, title: "One AI note", body: "A plain sentence explaining what changed and why, dismissible, never more than one at a time." },
];

/** The second of the brief's two allotted scroll reveals — the sequence
 * itself is the tour: each callout appears after the last, walking a
 * visitor through the screen in the order they'd actually notice things. */
export function ProductPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const reduceMotion = useReducedMotion();

  return (
    <section ref={ref} className="mx-auto max-w-5xl px-5 py-16">
      <h2 className="mb-8 text-3xl font-semibold text-ink-primary">A look inside</h2>
      <div className="grid gap-10 md:grid-cols-[1fr_1.1fr] md:items-center">
        <div className="relative rounded-card border border-hairline bg-surface-raised p-5 shadow-raised">
          <div className="flex items-center justify-between">
            <p className="font-medium text-ink-primary">Good morning</p>
            <span className="size-6 rounded-full border border-hairline" />
          </div>

          <div className="relative mt-4 rounded-control bg-surface-sunken p-4">
            <span className="metric absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-action text-xs text-ink-on-brand">
              1
            </span>
            <p className="text-sm text-ink-muted">Next up</p>
            <p className="mt-1 font-medium text-ink-primary">Upper body session, 42 minutes</p>
          </div>

          <div className="relative mt-4 rounded-control bg-surface-sunken p-4">
            <span className="metric absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-action text-xs text-ink-on-brand">
              2
            </span>
            <p className="metric text-3xl text-ink-primary">1,240</p>
            <p className="text-sm text-ink-muted">kcal left today</p>
          </div>

          <div className="relative mt-4 rounded-control bg-surface-sunken p-4">
            <span className="metric absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-action text-xs text-ink-on-brand">
              3
            </span>
            <p className="text-sm text-ink-primary">
              &ldquo;Lighter session today — you slept under six hours for three nights.&rdquo;
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {CALLOUTS.map((c, i) => (
            <motion.div
              key={c.n}
              initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: DURATION.transition, delay: i * STAGGER * 3, ease: EASE.standard }}
              className="flex gap-4"
            >
              <span className="metric flex size-8 shrink-0 items-center justify-center rounded-full bg-action text-sm text-ink-on-brand">
                {c.n}
              </span>
              <div>
                <p className="font-medium text-ink-primary">{c.title}</p>
                <p className="mt-1 text-ink-muted">{c.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
