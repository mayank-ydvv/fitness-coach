"use client";

import { useRef, useState } from "react";
import { useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { cn } from "@/lib/cn";

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

/**
 * Per-chapter crossfade curve. Each chapter occupies [left, right]; the
 * fade in/out ramps are centered ON the shared boundary with its
 * neighbor (a `2*fade`-wide window straddling `left`/`right` equally),
 * not offset to one side of it — a real bug shipped briefly where the
 * fade-out ramp sat entirely AFTER the boundary and the fade-in ramp
 * sat entirely BEFORE it, so neither ramp actually overlapped the
 * other: each chapter reached its own full opacity independently right
 * at the boundary, and both chapters were fully visible at once for a
 * stretch (a visible "double exposure", reported by the user against
 * the live site). Centering both ramps on the same window makes them
 * complementary — at any point inside it, the two chapters' opacities
 * sum to 1, so there's never a moment where both read as fully opaque.
 */
function chapterOpacity(v: number, index: number, total: number, fade = 0.05) {
  const step = 1 / total;
  const left = index * step;
  const right = left + step;
  const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
  const rampIn = index === 0 ? 1 : clamp01((v - (left - fade)) / (2 * fade));
  const rampOut = index === total - 1 ? 1 : clamp01((right + fade - v) / (2 * fade));
  return Math.min(rampIn, rampOut);
}

function PinnedChapters() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const [active, setActive] = useState(0);
  const [opacities, setOpacities] = useState(() => CHAPTERS.map((_, i) => chapterOpacity(0, i, CHAPTERS.length)));

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    setActive(Math.min(CHAPTERS.length - 1, Math.max(0, Math.floor(v * CHAPTERS.length))));
    setOpacities(CHAPTERS.map((_, i) => chapterOpacity(v, i, CHAPTERS.length)));
  });

  return (
    <section ref={ref} id="preview" className="relative" style={{ height: `${CHAPTERS.length * 100}vh` }}>
      <div className="sticky top-0 h-screen overflow-hidden bg-surface-inverse">
        {CHAPTERS.map((c, i) => (
          <div key={c.n} style={{ opacity: opacities[i] }} className="absolute inset-0 flex items-center">
            <div className="mx-auto grid w-full max-w-5xl grid-cols-1 items-center gap-10 px-5 lg:grid-cols-[1fr_1fr]">
              <div className="max-w-md">
                <p className="metric text-sm text-ink-on-brand/50">{c.n}</p>
                <h3 className="mt-3 text-3xl font-normal text-ink-on-brand">{c.title}</h3>
                <p className="mt-4 text-ink-on-brand/70">{c.body}</p>
              </div>
              <div className="flex justify-center lg:justify-end">
                <ChapterVisual index={i} />
              </div>
            </div>
          </div>
        ))}

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
