/**
 * "On weeks you hit your sleep habit 5+ times, your average session RPE
 * was lower." Only surfaced with >=4 weeks of data, and always labelled an
 * observation, not causation (spec §8). Pure statistics over
 * already-aggregated weekly data — no query logic here.
 */
export type WeeklyDatum = { weekStart: string; habitHitCount: number; avgSessionRpe: number | null };

export type CorrelationResult = {
  hitWeeksAvgRpe: number;
  missWeeksAvgRpe: number;
  weeksConsidered: number;
} | null;

export function correlateHabitWithRpe(weeks: WeeklyDatum[], hitThreshold: number): CorrelationResult {
  const withRpe = weeks.filter((w) => w.avgSessionRpe !== null);
  if (withRpe.length < 4) return null;

  const hitWeeks = withRpe.filter((w) => w.habitHitCount >= hitThreshold);
  const missWeeks = withRpe.filter((w) => w.habitHitCount < hitThreshold);
  if (hitWeeks.length === 0 || missWeeks.length === 0) return null;

  const avg = (arr: WeeklyDatum[]) => arr.reduce((s, w) => s + (w.avgSessionRpe ?? 0), 0) / arr.length;

  return {
    hitWeeksAvgRpe: Math.round(avg(hitWeeks) * 10) / 10,
    missWeeksAvgRpe: Math.round(avg(missWeeks) * 10) / 10,
    weeksConsidered: withRpe.length,
  };
}
