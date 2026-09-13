import Link from "next/link";
import { Metric } from "@/components/ui/Metric";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { MacroBars } from "@/components/today/MacroBars";
import { NextSessionCard } from "@/components/today/NextSessionCard";
import { RecentMeals } from "@/components/today/RecentMeals";
import { WeightTrend } from "@/components/progress/WeightTrend";
import { VolumeBars } from "@/components/progress/VolumeBars";
import { HabitCompletion } from "@/components/progress/HabitCompletion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { makeFormatter } from "@/lib/units/format";
import { MUSCLE_GROUPS } from "@/lib/training/muscleGroups";
import {
  DEMO_TODAY,
  DEMO_WEIGHT_TREND,
  DEMO_VOLUME,
  DEMO_HABIT_COMPLETION,
  DEMO_FORM_ANALYSIS,
  DEMO_PROGRAM,
} from "@/lib/demo/data";

/**
 * Logged-out demo — no sign-up needed to see the app populated. Reuses
 * the same presentational components as the real Today/Progress pages,
 * fed static fixture data (spec §13) rather than a seeded demo account:
 * zero RLS surface, survives a paused free-tier project, can't be
 * vandalised by a reviewer.
 */
export default function DemoPage() {
  const { kcalTarget, kcalConsumed } = DEMO_TODAY;
  const fraction = kcalConsumed / kcalTarget;
  const measure = makeFormatter({ unitSystem: "metric", hideEnergy: false });
  const volumeReport = {
    credit: DEMO_VOLUME.credit,
    trainedGroups: MUSCLE_GROUPS.filter((g) => DEMO_VOLUME.credit[g] >= 1),
    outOfBand: [],
  };

  return (
    <div className="min-h-dvh bg-surface-base">
      <div className="mx-auto max-w-2xl px-5 py-6 lg:max-w-4xl">
        <div className="mb-6 flex items-center justify-between rounded-control border border-hairline bg-surface-raised px-4 py-3">
          <p className="text-sm text-ink-muted">This is a demo with sample data — nothing here is saved.</p>
          <Link href="/login">
            <Button size="md">Sign up</Button>
          </Link>
        </div>

        <div className="flex flex-col gap-5">
          <p className="text-sm text-ink-muted">{DEMO_TODAY.dateLabel}</p>

          <div className="flex flex-col items-center gap-2 py-4">
            <ProgressRing fraction={Math.min(fraction, 1)} tone={fraction > 1 ? "load-yellow" : "load-blue"} size={180} strokeWidth={12}>
              <div className="flex flex-col items-center">
                <Metric value={String(kcalTarget - kcalConsumed)} size="hero" />
                <span className="text-sm text-ink-muted">kcal left of {kcalTarget}</span>
              </div>
            </ProgressRing>
          </div>

          <NextSessionCard session={DEMO_TODAY.nextSession} />

          <Card className="flex flex-wrap gap-3">
            {DEMO_TODAY.habits.map((h) => (
              <div key={h.name} className="flex flex-col items-center gap-1">
                <span className={`flex size-10 items-center justify-center rounded-full border text-lg ${h.done ? "border-load-green bg-load-green-soft" : "border-hairline bg-surface-sunken"}`}>
                  {h.emoji}
                </span>
                <span className="max-w-14 truncate text-center text-xs text-ink-muted">{h.name}</span>
              </div>
            ))}
          </Card>

          <MacroBars
            protein={{ label: "Protein", valueLabel: `${DEMO_TODAY.macros.protein.consumedG}g of ${DEMO_TODAY.macros.protein.targetG}g`, fraction: DEMO_TODAY.macros.protein.consumedG / DEMO_TODAY.macros.protein.targetG }}
            carbs={{ label: "Carbs", valueLabel: `${DEMO_TODAY.macros.carbs.consumedG}g of ${DEMO_TODAY.macros.carbs.targetG}g`, fraction: DEMO_TODAY.macros.carbs.consumedG / DEMO_TODAY.macros.carbs.targetG }}
            fat={{ label: "Fat", valueLabel: `${DEMO_TODAY.macros.fat.consumedG}g of ${DEMO_TODAY.macros.fat.targetG}g`, fraction: DEMO_TODAY.macros.fat.consumedG / DEMO_TODAY.macros.fat.targetG }}
          />

          <RecentMeals meals={DEMO_TODAY.recentMeals} />

          <h2 className="mt-4 text-lg font-medium text-ink-primary">4 weeks of progress</h2>

          <WeightTrend bodyMetrics={DEMO_WEIGHT_TREND.map((p) => ({ recorded_on: p.date, weight_kg: p.weightKg }))} measure={measure} />
          <VolumeBars report={volumeReport} band={DEMO_VOLUME.band} />
          <HabitCompletion habits={DEMO_HABIT_COMPLETION} />

          <Card>
            <p className="mb-1 text-sm font-medium text-ink-primary">Form check — {DEMO_FORM_ANALYSIS.exerciseName}</p>
            <Metric value={String(DEMO_FORM_ANALYSIS.overallScore)} unit="/ 100" size="lg" />
            <p className="mt-2 text-sm text-ink-muted">{DEMO_FORM_ANALYSIS.coachSummary}</p>
          </Card>

          <Card>
            <p className="text-sm text-ink-primary">
              {DEMO_PROGRAM.name} — week {DEMO_PROGRAM.currentWeek} of {DEMO_PROGRAM.totalWeeks}
            </p>
          </Card>

          <Link href="/login">
            <Button size="lg" className="w-full">
              Sign up to start your own
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
