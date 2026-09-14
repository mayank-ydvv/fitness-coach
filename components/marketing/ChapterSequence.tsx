"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useReducedMotion, useScroll } from "motion/react";
import { cn } from "@/lib/cn";
import { EASE } from "@/lib/motion/tokens";

/**
 * The whole narrative middle of the landing page — the problem
 * statement, the walk-through of onboarding/today/food/training/
 * habits/progress, the AI differentiator, and the every-age close — as
 * one continuous pinned chapter sequence. This replaces what used to be
 * five separate normal-flow sections (Problem, Features, HowItWorks,
 * BuiltForEveryAge, and a 4-chapter ProductPreview) with a single
 * mechanic reused across all of it, per the user's explicit request
 * after seeing the original 4-chapter version. FAQ and the closing CTA
 * stay as normal (non-pinned) sections — an accordion and a final CTA
 * aren't narrative beats, they're things a visitor scans or acts on at
 * their own pace.
 *
 * Nine chapters is a lot of scroll distance (900vh) for one pinned
 * section — that's the direct cost of "the whole page becomes
 * chapters" rather than one small showcase. Each chapter is exactly as
 * long as the others regardless of copy length, which is the same
 * trade the original 4-chapter version already made.
 */
const CHAPTERS = [
  {
    n: "01",
    anchor: "problem",
    title: "Most plans ignore Tuesday.",
    body: "A program built once for someone else's week doesn't know you skipped leg day. Logging by hand means most people stop by day three. Without a record, it's hard to tell if anything's working.",
  },
  {
    n: "02",
    anchor: "onboarding",
    title: "Start with where you are",
    body: "Height, weight, goal, how much time you have. No BMI verdict, no dream-body questions — just what the plan needs.",
  },
  {
    n: "03",
    anchor: "today",
    title: "Know what to do today",
    body: "One next action above everything else. Someone opening the app at 7am knows what to do without reading.",
  },
  {
    n: "04",
    anchor: "food",
    title: "Food logging from a photo",
    body: "Photograph a meal and get calories and macros back in seconds. Recents cover most days after the first week.",
  },
  {
    n: "05",
    anchor: "training",
    title: "Train with a plan that adapts",
    body: "Large numbers, one-tap logging, a rest timer that takes over the screen. Built for sweaty hands, not a desk.",
  },
  {
    n: "06",
    anchor: "habits",
    title: "Habits that survive a bad week",
    body: "One rest day a week doesn't break a streak. Consistency over the last few weeks matters more than any single day.",
  },
  {
    n: "07",
    anchor: "progress",
    title: "Watch it add up",
    body: "A smoothed trend line, not daily noise. Strength, consistency, and weight — read together, not scattered across screens.",
  },
  {
    n: "08",
    anchor: "ai",
    title: "An AI that explains itself",
    body: "When something changes, it says what and why, in one plain sentence. Never a badge, never a gradient border.",
  },
  {
    n: "09",
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

        <div className="absolute right-6 top-1/2 hidden -translate-y-1/2 flex-col gap-3 text-right md:right-10 lg:flex">
          {CHAPTERS.map((c, i) => (
            <span
              key={c.n}
              className={cn(
                "metric text-xs transition-opacity duration-300",
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

/** Below ~900px and under `prefers-reduced-motion`: nine stacked
 * panels, no pinning, no cross-fade — same content, same order,
 * revealed normally as the page scrolls. */
function StackedChapters() {
  return (
    <section className="flex flex-col gap-3 bg-surface-inverse py-3">
      {CHAPTERS.map((c, i) => (
        <div
          key={c.n}
          id={c.anchor}
          className="flex min-h-[70vh] flex-col items-center justify-center gap-8 px-5 py-16 text-center"
        >
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
  switch (index) {
    case 0:
      return <ProblemVisual />;
    case 1:
      return <OnboardingVisual />;
    case 2:
      return <TodayVisual />;
    case 3:
      return <MealVisual />;
    case 4:
      return <TrainVisual />;
    case 5:
      return <HabitVisual />;
    case 6:
      return <ProgressVisual />;
    case 7:
      return <AiNoteVisual />;
    default:
      return <EveryAgeVisual />;
  }
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[280px] rounded-card border border-hairline bg-surface-raised p-4 shadow-floating">{children}</div>
  );
}

function ProblemVisual() {
  const days = ["Mon", "Tue", "Wed", "Thu"];
  return (
    <PhoneFrame>
      <p className="text-sm font-medium text-ink-muted">This week&apos;s plan</p>
      <div className="mt-3 flex flex-col divide-y divide-hairline">
        {days.map((d) => (
          <div key={d} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="text-ink-primary">{d}</span>
            <span className="text-ink-muted">Same as last week</span>
          </div>
        ))}
      </div>
    </PhoneFrame>
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

function MealVisual() {
  const macros = [
    { label: "Protein", value: "34g" },
    { label: "Carbs", value: "41g" },
    { label: "Fat", value: "12g" },
  ];
  return (
    <PhoneFrame>
      <p className="font-medium text-ink-primary">Grilled chicken &amp; rice bowl</p>
      <p className="mt-0.5 text-sm text-ink-muted">512 kcal, logged from a photo</p>
      <div className="mt-3 flex gap-2">
        {macros.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center rounded-chip bg-surface-sunken py-2">
            <span className="metric text-sm text-ink-primary">{m.value}</span>
            <span className="text-[11px] text-ink-muted">{m.label}</span>
          </div>
        ))}
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

function HabitVisual() {
  const week = [true, true, false, true, true, true, false];
  return (
    <PhoneFrame>
      <p className="font-medium text-ink-primary">This week</p>
      <div className="mt-3 flex gap-2">
        {week.map((done, i) => (
          <span
            key={i}
            aria-hidden
            className={done ? "size-8 rounded-full bg-action" : "size-8 rounded-full border border-hairline bg-surface-sunken"}
          />
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-muted">5 of 7 days — one rest day used</p>
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

function AiNoteVisual() {
  return (
    <PhoneFrame>
      <p className="text-ink-primary">
        &ldquo;Lighter session today — you slept under six hours for three nights.&rdquo;
      </p>
      <p className="mt-2 text-sm text-ink-muted">Today&apos;s note, plain sentence, dismissible</p>
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
