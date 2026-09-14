import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";

const HABIT_WEEK = [true, true, false, true, true, true, false];

function SessionVisual() {
  const rows = [
    { name: "Barbell back squat", detail: "4 × 6 @ 82.5 kg" },
    { name: "Romanian deadlift", detail: "3 × 10 @ 60 kg" },
    { name: "Walking lunge", detail: "3 × 12 each side" },
  ];
  return (
    <div className="rounded-control border border-hairline bg-surface-sunken p-4">
      <div className="flex items-baseline justify-between">
        <p className="font-medium text-ink-primary">Lower body</p>
        <p className="text-sm text-ink-muted">~45 min</p>
      </div>
      <div className="mt-3 flex flex-col divide-y divide-hairline">
        {rows.map((r) => (
          <div key={r.name} className="flex items-baseline justify-between gap-3 py-2 text-sm">
            <span className="min-w-0 truncate text-ink-primary">{r.name}</span>
            <span className="metric shrink-0 text-ink-muted">{r.detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function MealVisual() {
  const macros = [
    { label: "Protein", value: "34g" },
    { label: "Carbs", value: "41g" },
    { label: "Fat", value: "12g" },
  ];
  return (
    <div className="rounded-control border border-hairline bg-surface-sunken p-4">
      <p className="font-medium text-ink-primary">Grilled chicken &amp; rice bowl</p>
      <p className="mt-0.5 text-sm text-ink-muted">512 kcal, logged from a photo</p>
      <div className="mt-3 flex gap-2">
        {macros.map((m) => (
          <div key={m.label} className="flex flex-1 flex-col items-center rounded-chip bg-surface-raised py-2">
            <span className="metric text-sm">{m.value}</span>
            <span className="text-[11px] text-ink-muted">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HabitVisual() {
  return (
    <div className="rounded-control border border-hairline bg-surface-sunken p-4">
      <p className="font-medium text-ink-primary">This week</p>
      <div className="mt-3 flex gap-2">
        {HABIT_WEEK.map((done, i) => (
          <span
            key={i}
            aria-hidden
            className={done ? "size-8 rounded-full bg-action" : "size-8 rounded-full border border-hairline bg-surface-raised"}
          />
        ))}
      </div>
      <p className="mt-2 text-sm text-ink-muted">5 of 7 days — one rest day used</p>
    </div>
  );
}

function ProgressVisual() {
  return (
    <div className="rounded-control border border-hairline bg-surface-sunken p-4">
      <p className="font-medium text-ink-primary">Weight, last 8 weeks</p>
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
    </div>
  );
}

function AiNoteVisual() {
  return (
    <div className="rounded-control border border-hairline bg-surface-sunken p-4">
      <p className="text-ink-primary">
        &ldquo;Lighter session today — you slept under six hours for three nights.&rdquo;
      </p>
      <p className="mt-2 text-sm text-ink-muted">Today&apos;s note, plain sentence, dismissible</p>
    </div>
  );
}

/**
 * `food` and `habits` are real nav-anchor targets (Nav.tsx routes
 * "Food" and "Habits" here with a plain anchor). `training` and
 * `progress` are deliberately NOT "training"/"progress" — those two
 * topics get their own deep-dive pinned chapter further down the page
 * (see ChapterSequence.tsx), and Nav routes "Training"/"Progress" to
 * those chapters instead, which needs the ids to not collide.
 */
const FEATURES = [
  {
    id: "training-overview",
    title: "Training that adjusts to what you did",
    body: "Miss a session or hit every rep — next week's targets move accordingly, not on a fixed schedule.",
    visual: <SessionVisual />,
    large: true,
  },
  {
    id: "food",
    title: "Food logging from a photo",
    body: "Photograph a meal and get calories and macros back in seconds. Recents cover most days after the first week.",
    visual: <MealVisual />,
  },
  {
    id: "habits",
    title: "Habits that survive a bad week",
    body: "One rest day a week doesn't break a streak. Consistency over the last few weeks matters more than any single day.",
    visual: <HabitVisual />,
  },
  {
    id: "progress-overview",
    title: "Progress you can actually read",
    body: "Weight, strength, and habit consistency over time — smoothed, not a wall of noisy daily dots.",
    visual: <ProgressVisual />,
  },
  {
    id: "ai-note",
    title: "An AI that explains itself",
    body: "When something changes, it says what and why, in one plain sentence. Never a badge, never a gradient border.",
    visual: <AiNoteVisual />,
  },
];

/**
 * Immediately follows the sticky Hero now that Problem is gone (see
 * Hero.tsx) — an opaque, full-width background plus `relative z-10` is
 * what makes it visually scroll up and cover Hero rather than the two
 * overlapping with no clear front/back order. Hero's own `min-h-screen`
 * (not padding here) is what keeps this heading below the fold on the
 * initial load — see Hero.tsx.
 */
export function Features() {
  return (
    <section className="relative z-10 bg-surface-base py-16">
      <div className="mx-auto max-w-5xl px-5">
        <h2 className="mb-8 text-3xl font-normal text-ink-primary">What it actually does</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {FEATURES.map((f) => (
            <Card key={f.id} id={f.id} className={cn("min-w-0", f.large && "md:col-span-2")}>
              <div className={f.large ? "grid gap-6 md:grid-cols-2 md:items-center" : undefined}>
                <div>
                  <h3 className="text-xl font-medium text-ink-primary">{f.title}</h3>
                  <p className="mt-2 text-ink-muted">{f.body}</p>
                </div>
                <div className={f.large ? "" : "mt-4"}>{f.visual}</div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
