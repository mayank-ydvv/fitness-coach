/**
 * Pure chart-data transforms. Callers fetch the raw rows (body_metrics,
 * set_logs, meals) and pass them in — nothing here touches Supabase.
 */

export type WeightPoint = { date: string; weightKg: number };
export function weightTrend(bodyMetrics: { recorded_on: string; weight_kg: number | null }[]): WeightPoint[] {
  return bodyMetrics
    .filter((m): m is { recorded_on: string; weight_kg: number } => m.weight_kg !== null)
    .map((m) => ({ date: m.recorded_on, weightKg: m.weight_kg }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type E1rmPoint = { date: string; e1rm: number };
/** Best TRUSTED e1RM per calendar day for one exercise, sorted ascending —
 * untrusted (reps > 12) sets never distort the trend line. */
export function e1rmTrend(setLogs: { completed_at: string; e1rm: number | null; e1rm_trusted: boolean | null; is_warmup: boolean }[]): E1rmPoint[] {
  const bestByDay = new Map<string, number>();
  for (const log of setLogs) {
    if (log.is_warmup || !log.e1rm_trusted || log.e1rm === null) continue;
    const day = log.completed_at.slice(0, 10);
    const existing = bestByDay.get(day);
    if (existing === undefined || log.e1rm > existing) bestByDay.set(day, log.e1rm);
  }
  return Array.from(bestByDay.entries())
    .map(([date, e1rm]) => ({ date, e1rm }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export type DailyProtein = { date: string; proteinG: number };
/** 7-day rolling average of protein from a day-by-day series (caller
 * excludes processing/failed meals when building the input — same rule as
 * lib/nutrition/rollup.ts). */
export function proteinSevenDayAverage(dailyProtein: DailyProtein[]): number | null {
  if (dailyProtein.length === 0) return null;
  const lastSeven = [...dailyProtein].sort((a, b) => a.date.localeCompare(b.date)).slice(-7);
  return Math.round(lastSeven.reduce((s, d) => s + d.proteinG, 0) / lastSeven.length);
}
