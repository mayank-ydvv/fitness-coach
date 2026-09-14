"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion/tokens";

const CHAPTERS = [
  {
    n: "01",
    title: "Start with where you are",
    body: "Height, weight, goal, how much time you have. No BMI verdict, no dream-body questions — just what the plan needs.",
  },
  {
    n: "02",
    title: "Know what to do today",
    body: "One next action above everything else. Someone opening the app at 7am knows what to do without reading.",
  },
  {
    n: "03",
    title: "Train with a plan that adapts",
    body: "Large numbers, one-tap logging, a rest timer that takes over the screen. Built for sweaty hands, not a desk.",
  },
  {
    n: "04",
    title: "Watch it add up",
    body: "A smoothed trend line, not daily noise. Strength, consistency, and weight — read together, not scattered across screens.",
  },
] as const;

/**
 * The brief's §5 pinned chapter sequence — the landing page's
 * centerpiece. The hero stays a light, content-first section (it never
 * shipped as the full-bleed dark image the original mechanic assumes —
 * see DESIGN.md §18), so this is the one section that carries the
 * brief's original "cinematic marketing" language instead: a dark
 * interlude with the app's own screens as its "media", four chapters
 * advancing as the section scrolls past, driven continuously by scroll
 * position (via `useScroll`), never a one-shot trigger — it runs
 * backwards cleanly when the visitor scrolls up.
 *
 * No real screen-recorded video exists for this app, so each chapter's
 * "media" is a small rendered mockup of the actual screen (the same
 * technique Features.tsx already uses for its four visuals), not stock
 * photography or an invented video asset.
 */
export function ProductPreview() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <StackedChapters />;
  }

  return (
    <>
      <div className="hidden md:block">
        <PinnedChapters />
      </div>
      <div className="md:hidden">
        <StackedChapters />
      </div>
    </>
  );
}

function activeChapterIndex(v: number, total: number) {
  return Math.min(total - 1, Math.max(0, Math.floor(v * total)));
}

/**
 * Two earlier passes at this tried to keep exactly one chapter fully
 * legible AND keep a continuous scroll-linked opacity crossfade between
 * neighbors (per the brief's "left copy cross-fades"). The first had a
 * real bug (adjacent fade windows didn't overlap, so both chapters hit
 * full opacity independently right at the boundary). The second fixed
 * that bug — the two opacities were verified to sum to exactly 1 at
 * every point — and the result was STILL an unreadable double-exposure
 * whenever a visitor stopped scrolling mid-transition (confirmed against
 * the live site, not just in theory): a 60/40 opacity blend of two
 * overlapping paragraphs of text, or two overlapping card mockups, reads
 * as noise, not a crossfade — unlike the full-bleed video/photography
 * the brief's mechanic assumes, where a 60/40 blend still reads fine.
 *
 * So the foreground content (copy + mockup) now swaps with a clean,
 * non-overlapping `AnimatePresence mode="wait"` fade keyed on the
 * active chapter — the outgoing chapter fully leaves before the next
 * one enters, so there's never a moment with two chapters' text
 * simultaneously legible, no matter where a visitor stops scrolling.
 * It's still entirely scroll-driven (the active index is derived from
 * `scrollYProgress`, runs backwards fine) — just discretized at the
 * point where "which chapter" flips, rather than blended continuously.
 */
function PinnedChapters() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(activeChapterIndex(v, CHAPTERS.length));
  });

  const chapter = CHAPTERS[active];

  return (
    <section ref={ref} id="preview" className="relative" style={{ height: `${CHAPTERS.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-surface-inverse">
        <AnimatePresence mode="wait">
          <motion.div
            key={chapter.n}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: EASE.standard }}
            className="absolute inset-0 flex items-center"
          >
            <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 px-5 lg:grid-cols-[1fr_1fr]">
              <div className="max-w-md">
                <p className="metric text-sm text-ink-on-brand/50">{chapter.n}</p>
                <h3 className="mt-3 text-3xl font-normal text-ink-on-brand">{chapter.title}</h3>
                <p className="mt-4 text-ink-on-brand/70">{chapter.body}</p>
              </div>
              <div className="flex justify-center lg:justify-end">
                <ChapterVisual index={active} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-4 text-right md:right-10 lg:flex">
          {CHAPTERS.map((c, i) => (
            <span
              key={c.n}
              className={cn(
                "metric text-sm transition-opacity duration-300",
                i === active ? "text-ink-on-brand opacity-100" : "text-ink-on-brand opacity-35",
              )}
            >
              {c.n}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Below ~900px and under `prefers-reduced-motion`: four stacked panels,
 * no pinning, no parallax, no cross-fade — same content, same order,
 * revealed normally as the page scrolls (per the brief's own mobile and
 * reduced-motion fallback in §5/§13). */
function StackedChapters() {
  return (
    <section className="flex flex-col gap-3 bg-surface-inverse py-3">
      {CHAPTERS.map((c, i) => (
        <div key={c.n} className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-5 py-16 text-center">
          <ChapterVisual index={i} />
          <div className="max-w-md">
            <p className="metric text-sm text-ink-on-brand/50">{c.n}</p>
            <h3 className="mt-3 text-2xl font-normal text-ink-on-brand">{c.title}</h3>
            <p className="mt-3 text-ink-on-brand/70">{c.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function ChapterVisual({ index }: { index: number }) {
  if (index === 0) return <OnboardingVisual />;
  if (index === 1) return <TodayVisual />;
  if (index === 2) return <TrainVisual />;
  return <ProgressVisual />;
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[280px] rounded-card border border-hairline bg-surface-raised p-4 shadow-floating">{children}</div>
  );
}

function OnboardingVisual() {
  const goals = ["Get stronger", "Move more", "Lose weight", "Build a habit"];
  return (
    <PhoneFrame>
      <p className="text-sm font-medium text-ink-muted">What&apos;s the goal?</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {goals.map((g, i) => (
          <span
            key={g}
            className={cn(
              "rounded-full px-3.5 py-2 text-sm font-medium",
              i === 0 ? "bg-action text-ink-on-brand" : "border border-hairline bg-surface-sunken text-ink-primary",
            )}
          >
            {g}
          </span>
        ))}
      </div>
      <div className="mt-5 rounded-control bg-surface-sunken p-3">
        <p className="text-xs text-ink-muted">Weight</p>
        <p className="metric text-2xl text-ink-primary">78 kg</p>
      </div>
    </PhoneFrame>
  );
}

function TodayVisual() {
  return (
    <PhoneFrame>
      <p className="text-sm font-medium text-ink-muted">Today</p>
      <p className="metric mt-2 text-3xl text-ink-primary">840</p>
      <p className="text-sm text-ink-muted">kcal left of 2,400</p>
      <div className="mt-2 h-2 rounded-full bg-surface-sunken">
        <div className="h-2 w-2/3 rounded-full bg-action" />
      </div>
      <div className="mt-4 rounded-control bg-surface-sunken p-3">
        <p className="text-sm text-ink-muted">Next up</p>
        <p className="font-medium text-ink-primary">Upper body, 42 min</p>
      </div>
    </PhoneFrame>
  );
}

function TrainVisual() {
  const rows = [
    { name: "Barbell back squat", detail: "4 × 6 @ 82.5 kg" },
    { name: "Romanian deadlift", detail: "3 × 10 @ 60 kg" },
  ];
  return (
    <PhoneFrame>
      <p className="text-sm font-medium text-ink-muted">Lower body</p>
      <div className="mt-3 flex flex-col divide-y divide-hairline">
        {rows.map((r) => (
          <div key={r.name} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate text-ink-primary">{r.name}</span>
            <span className="metric shrink-0 text-ink-muted">{r.detail}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-full bg-action px-4 py-2.5 text-center text-sm font-medium text-ink-on-brand">
        Rest — 0:58
      </div>
    </PhoneFrame>
  );
}

function ProgressVisual() {
  return (
    <PhoneFrame>
      <p className="text-sm font-medium text-ink-muted">Weight, last 8 weeks</p>
      <svg viewBox="0 0 200 60" className="mt-3 h-14 w-full">
        <polyline
          points="0,15 30,20 60,18 90,32 120,28 150,40 180,36 200,42"
          fill="none"
          stroke="#1F6F68"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="mt-1 text-sm text-ink-muted">Smoothed trend, not daily noise</p>
    </PhoneFrame>
  );
}
