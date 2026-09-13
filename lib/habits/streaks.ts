import { addDaysLocal, weekStartLocal } from "@/lib/time/localDay";

export type HabitLogStatus = { logDate: string; status: "done" | "skipped" };

/**
 * Current + longest streak, with one allowed "rest day" per week that
 * preserves the streak (spec §8, default on). A missed day that falls on
 * the week's already-used rest day doesn't break the streak; any other
 * missed day does. Breaking a streak reports the honest number — the
 * "never a guilt message" rule lives in the UI copy, not here.
 */
export function computeStreaks(
  logs: HabitLogStatus[], // any subset, doesn't need to be sorted or contiguous
  todayLocalDate: string,
  restDayEnabled: boolean,
): { current: number; longest: number } {
  const doneSet = new Set(logs.filter((l) => l.status === "done").map((l) => l.logDate));
  if (doneSet.size === 0) return { current: 0, longest: 0 };

  const restUsedByWeek = new Map<string, boolean>();

  function isRestDayAvailable(date: string): boolean {
    if (!restDayEnabled) return false;
    const week = weekStartLocal(date);
    return !restUsedByWeek.get(week);
  }
  function markRestDayUsed(date: string) {
    restUsedByWeek.set(weekStartLocal(date), true);
  }

  // Walk backward from today for the "current" streak. Bounded at the
  // earliest logged date — without this, an unlogged week before the habit
  // even existed looks identical to a legitimate rest day, and the walk
  // would happily consume rest days through empty history forever.
  const earliestDone = Array.from(doneSet).sort()[0];
  let current = 0;
  let cursor = todayLocalDate;
  // Today not yet done doesn't break an existing streak — only counts once logged.
  if (!doneSet.has(cursor)) cursor = addDaysLocal(cursor, -1);
  while (cursor >= earliestDone) {
    if (doneSet.has(cursor)) {
      current++;
      cursor = addDaysLocal(cursor, -1);
      continue;
    }
    if (isRestDayAvailable(cursor)) {
      markRestDayUsed(cursor);
      cursor = addDaysLocal(cursor, -1);
      continue;
    }
    break;
  }

  // Longest: scan the full range from earliest to latest logged date.
  const allDates = Array.from(doneSet).sort();
  const earliest = allDates[0];
  const latest = allDates[allDates.length - 1];
  const restUsedForLongest = new Map<string, boolean>();

  let longest = 0;
  let running = 0;
  let d = earliest;
  while (d <= latest) {
    if (doneSet.has(d)) {
      running++;
    } else {
      const week = weekStartLocal(d);
      if (restDayEnabled && !restUsedForLongest.get(week)) {
        restUsedForLongest.set(week, true);
        // rest day: streak continues, doesn't increment
      } else {
        running = 0;
      }
    }
    longest = Math.max(longest, running);
    d = addDaysLocal(d, 1);
  }

  return { current, longest: Math.max(longest, current) };
}
