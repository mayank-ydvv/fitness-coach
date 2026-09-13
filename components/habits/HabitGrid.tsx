import { buildContributionGrid } from "@/lib/habits/grid";
import { cn } from "@/lib/cn";
import type { HabitLogStatus } from "@/lib/habits/streaks";

// A done habit is a binary fact (done/not done that day), so this grid only
// ever needs 2 of the "up to 4" opacity steps the spec allows for — one
// colour token, done at full opacity, not-done as the sunken surface.
// Never a rainbow either way.
const TONE_BG: Record<string, string> = {
  "load-green": "bg-load-green",
  "load-yellow": "bg-load-yellow",
  "load-blue": "bg-load-blue",
  "load-red": "bg-load-red",
};

/** 12-week grid, one habit's colour token at 4 opacity steps — never a
 * rainbow. Every cell carries an accessible label (date + done/not). */
export function HabitGrid({ logs, todayDate, colorToken }: { logs: HabitLogStatus[]; todayDate: string; colorToken: string }) {
  const grid = buildContributionGrid(logs, todayDate);
  const toneBg = TONE_BG[colorToken] ?? TONE_BG["load-green"];

  return (
    <div className="flex gap-1 overflow-x-auto">
      {grid.map((week, wi) => (
        <div key={wi} className="flex flex-col gap-1">
          {week.map((cell) => (
            <div
              key={cell.date}
              role="img"
              aria-label={`${cell.date}: ${cell.done ? "done" : "not done"}`}
              className={cn("size-3 rounded-sm", cell.done ? toneBg : "bg-surface-sunken")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
