"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion/tokens";

/**
 * The deep-dive walk-through through the actual app — onboarding,
 * today, training, progress, and the every-age close — as a pinned
 * chapter sequence. This sits BELOW the normal-flow Problem and
 * Features ("What it actually does") sections, not instead of them:
 * the user explicitly asked for the page to open with those two
 * scrolling normally, same as before, and only start the pinned
 * mechanic after — see DESIGN.md §23. Food, habits, and the AI note
 * already get their moment in Features' card grid, so they're not
 * repeated here as chapters; repeating them would be the exact
 * redundant-retelling problem the §22 merge was trying to avoid.
 *
 * FAQ and the closing CTA, further down the page, also stay outside
 * this — an accordion and a final CTA aren't narrative beats.
 */
const CHAPTERS = [
  {
    n: "01",
    kicker: "Onboarding",
    anchor: "onboarding",
    title: "Start with where you are",
    body: "Height, weight, goal, how much time you have. No BMI verdict, no dream-body questions — just what the plan needs.",
  },
  {
    n: "02",
    kicker: "Today",
    anchor: "today",
    title: "Know what to do today",
    body: "One next action above everything else. Someone opening the app at 7am knows what to do without reading.",
  },
  {
    n: "03",
    kicker: "Training",
    anchor: "training",
    title: "Train with a plan that adapts",
    body: "Large numbers, one-tap logging, a rest timer that takes over the screen. Built for sweaty hands, not a desk.",
  },
  {
    n: "04",
    kicker: "Progress",
    anchor: "progress",
    title: "Watch it add up",
    body: "A smoothed trend line, not daily noise. Strength, consistency, and weight — read together, not scattered across screens.",
  },
  {
    n: "05",
    kicker: "Every age",
    anchor: "every-age",
    title: "Built for every age.",
    body: "Whether this is your first week of exercise or your twentieth year training, the plan starts from your numbers, not an average.",
  },
] as const;

export function CHAPTER_COUNT() {
  return CHAPTERS.length;
}

export function chapterIndexForAnchor(anchor: string) {
  return CHAPTERS.findIndex((c) => c.anchor === anchor);
}

function activeChapterIndex(v: number, total: number) {
  return Math.min(total - 1, Math.max(0, Math.floor(v * total)));
}

export function ChapterSequence() {
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
 * See DESIGN.md §21: an earlier version blended neighboring chapters'
 * opacity continuously. Mathematically correct crossfades (opacities
 * summing to 1) still read as an unreadable double-exposure for dense
 * text and card mockups, unlike the full-bleed video/photography the
 * brief's mechanic assumes. Chapters swap with a clean, non-overlapping
 * `AnimatePresence mode="wait"` fade instead — the outgoing chapter
 * fully exits before the next enters.
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
    <section
      ref={ref}
      id="chapters"
      className="relative z-10"
      style={{ height: `${CHAPTERS.length * 100}vh` }}
    >
      <div className="sticky top-0 h-screen overflow-hidden bg-surface-inverse">
        <ChapterAtmosphere />
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
                <p className="metric text-sm text-ink-on-brand/50">
                  {chapter.n} <span className="ml-2 font-ui text-ink-on-brand/40">{chapter.kicker}</span>
                </p>
                <h3 className="mt-3 text-3xl font-normal text-ink-on-brand">{chapter.title}</h3>
                <p className="mt-4 text-ink-on-brand/70">{chapter.body}</p>
              </div>
              <div className="relative flex justify-center lg:justify-end">
                <ChapterGlow />
                <ChapterVisual index={active} />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-4 text-right md:right-10 lg:flex">
          {CHAPTERS.map((c, i) => (
            <div key={c.n} className={cn("transition-opacity duration-300", i === active ? "opacity-100" : "opacity-35")}>
              <p className="text-[11px] text-ink-on-brand/70">{c.kicker}</p>
              <p className="metric text-xs text-ink-on-brand">{c.n}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** A faint grain + soft accent glow across the whole dark panel so it
 * doesn't read as an empty void around the copy/visual — the stand-in
 * for the full-bleed photography the brief's original mechanic assumes,
 * since no such photography exists for this app (see DESIGN.md §18). */
function ChapterAtmosphere() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 top-1/2 size-[560px] -translate-y-1/2 rounded-full bg-action opacity-[0.12] blur-[120px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>\")",
        }}
      />
    </>
  );
}

/** A soft glow directly behind each chapter's mockup — gives the small
 * card some presence against the large dark panel instead of floating
 * in flat empty space. */
function ChapterGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-1/2 top-1/2 size-[420px] -translate-y-1/2 translate-x-1/2 rounded-full bg-action opacity-[0.18] blur-[100px] lg:right-10 lg:translate-x-0"
    />
  );
}

/** Below ~900px and under `prefers-reduced-motion`: five stacked
 * panels, no pinning, no cross-fade — same content, same order,
 * revealed normally as the page scrolls. */
function StackedChapters() {
  return (
    <section className="relative flex flex-col gap-3 overflow-x-hidden bg-surface-inverse py-3">
      <ChapterAtmosphere />
      {CHAPTERS.map((c, i) => (
        <div
          key={c.n}
          id={c.anchor}
          className="relative flex min-h-[70vh] flex-col items-center justify-center gap-8 px-5 py-16 text-center"
        >
          <div className="relative flex justify-center">
            <ChapterGlow />
            <ChapterVisual index={i} />
          </div>
          <div className="max-w-md">
            <p className="metric text-sm text-ink-on-brand/50">
              {c.n} <span className="ml-2 font-ui text-ink-on-brand/40">{c.kicker}</span>
            </p>
            <h3 className="mt-3 text-2xl font-normal text-ink-on-brand">{c.title}</h3>
            <p className="mt-3 text-ink-on-brand/70">{c.body}</p>
          </div>
        </div>
      ))}
    </section>
  );
}

function ChapterVisual({ index }: { index: number }) {
  switch (index) {
    case 0:
      return <OnboardingVisual />;
    case 1:
      return <TodayVisual />;
    case 2:
      return <TrainVisual />;
    case 3:
      return <ProgressVisual />;
    default:
      return <EveryAgeVisual />;
  }
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative w-full max-w-[340px] rounded-card border border-hairline bg-surface-raised p-5 shadow-floating">
      <div className="mb-3 flex items-center justify-between">
        <span className="size-2 rounded-full bg-hairline" aria-hidden />
        <span className="size-2 rounded-full bg-hairline" aria-hidden />
      </div>
      {children}
    </div>
  );
}

function OnboardingVisual() {
  const goals = ["Get stronger", "Move more", "Lose weight", "Build a habit"];
  return (
    <PhoneFrame>
      <p className="text-xs font-medium text-ink-muted">Step 2 of 6</p>
      <p className="mt-1 text-sm font-medium text-ink-muted">What&apos;s the goal?</p>
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
      <div className="mt-5 flex gap-3">
        <div className="flex-1 rounded-control bg-surface-sunken p-3">
          <p className="text-xs text-ink-muted">Weight</p>
          <p className="metric text-2xl text-ink-primary">78 kg</p>
        </div>
        <div className="flex-1 rounded-control bg-surface-sunken p-3">
          <p className="text-xs text-ink-muted">Days a week</p>
          <p className="metric text-2xl text-ink-primary">4</p>
        </div>
      </div>
      <div className="mt-4 rounded-full bg-action px-4 py-2.5 text-center text-sm font-medium text-ink-on-brand">
        Continue
      </div>
    </PhoneFrame>
  );
}

function TodayVisual() {
  const habitWeek = [true, true, false, true, true, false, false];
  return (
    <PhoneFrame>
      <p className="text-sm font-medium text-ink-muted">Today</p>
      <p className="metric mt-2 text-4xl text-ink-primary">840</p>
      <p className="text-sm text-ink-muted">kcal left of 2,400</p>
      <div className="mt-2 h-2 rounded-full bg-surface-sunken">
        <div className="h-2 w-2/3 rounded-full bg-action" />
      </div>
      <div className="mt-4 rounded-control bg-surface-sunken p-3">
        <p className="text-sm text-ink-muted">Next up</p>
        <p className="font-medium text-ink-primary">Upper body, 42 min</p>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-ink-muted">This week&apos;s habits</p>
        <div className="flex gap-1.5">
          {habitWeek.map((done, i) => (
            <span
              key={i}
              aria-hidden
              className={done ? "size-3 rounded-full bg-action" : "size-3 rounded-full border border-hairline"}
            />
          ))}
        </div>
      </div>
    </PhoneFrame>
  );
}

function TrainVisual() {
  const rows = [
    { name: "Barbell back squat", detail: "4 × 6 @ 82.5 kg", done: true },
    { name: "Romanian deadlift", detail: "3 × 10 @ 60 kg", done: true },
    { name: "Walking lunge", detail: "3 × 12 each side", done: false },
  ];
  return (
    <PhoneFrame>
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium text-ink-muted">Lower body</p>
        <p className="text-xs text-ink-muted">Week 3 · Day 2</p>
      </div>
      <div className="mt-3 flex flex-col divide-y divide-hairline">
        {rows.map((r) => (
          <div key={r.name} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className={cn("min-w-0 truncate", r.done ? "text-ink-muted line-through" : "text-ink-primary")}>
              {r.name}
            </span>
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
      <svg viewBox="0 0 200 60" className="mt-3 h-16 w-full">
        <polyline
          points="0,15 30,20 60,18 90,32 120,28 150,40 180,36 200,42"
          fill="none"
          stroke="#1F6F68"
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <p className="text-sm text-ink-muted">Smoothed trend, not daily noise</p>
      <div className="mt-4 flex gap-3">
        <div className="flex-1 rounded-control bg-surface-sunken p-3">
          <p className="text-xs text-ink-muted">Squat e1RM</p>
          <p className="metric text-lg text-ink-primary">142 kg</p>
        </div>
        <div className="flex-1 rounded-control bg-surface-sunken p-3">
          <p className="text-xs text-ink-muted">Habits, 4 wks</p>
          <p className="metric text-lg text-ink-primary">86%</p>
        </div>
      </div>
    </PhoneFrame>
  );
}

function EveryAgeVisual() {
  const statements = [
    { title: "First week of exercise", body: "Starts from your own numbers" },
    { title: "Twentieth year training", body: "Backs off after two missed targets" },
  ];
  return (
    <PhoneFrame>
      <div className="flex flex-col gap-3">
        {statements.map((s) => (
          <div key={s.title} className="rounded-control bg-surface-sunken p-3">
            <p className="text-xs font-medium text-ink-muted">{s.title}</p>
            <p className="mt-1 text-sm text-ink-primary">{s.body}</p>
          </div>
        ))}
      </div>
    </PhoneFrame>
  );
}
