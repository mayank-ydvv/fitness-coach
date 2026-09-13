import { addDaysLocal } from "@/lib/time/localDay";
import type { HabitLogStatus } from "./streaks";

export type GridCell = { date: string; opacity: 0 | 1 | 2 | 3; done: boolean };

/**
 * 12-week contribution grid -> one habit's colour token at 4 opacity steps
 * (spec §8: "never a rainbow"). Opacity here is just "how many of the last
 * few days around this one were done" so a lone miss doesn't look
 * identical to a lone hit next to a gap — still a single hue, four
 * intensities, not four colours.
 */
export function buildContributionGrid(logs: HabitLogStatus[], todayLocalDate: string, weeks = 12): GridCell[][] {
  const doneSet = new Set(logs.filter((l) => l.status === "done").map((l) => l.logDate));
  const totalDays = weeks * 7;
  const startDate = addDaysLocal(todayLocalDate, -(totalDays - 1));

  const cells: GridCell[] = [];
  for (let i = 0; i < totalDays; i++) {
    const date = addDaysLocal(startDate, i);
    const done = doneSet.has(date);
    cells.push({ date, done, opacity: done ? 3 : 0 });
  }

  // Group into weeks (columns), 7 rows each.
  const grid: GridCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    grid.push(cells.slice(w * 7, w * 7 + 7));
  }
  return grid;
}
