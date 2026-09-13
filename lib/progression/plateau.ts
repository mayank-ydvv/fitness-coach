/** Best e1RM flat for 3 weeks -> offer swap/back-off/check-sleep-and-calories
 * (spec §6). A read model — pure function over already-logged e1RMs, not
 * part of the write path. */
export type WeeklyBestE1rm = { weekStart: string; bestE1rm: number };

export type PlateauSignal = {
  exerciseId: string;
  weeksFlat: number;
  intakeBelowTargetMostOfPeriod: boolean;
};

export function detectPlateau(
  exerciseId: string,
  weeklyBests: WeeklyBestE1rm[], // sorted ascending by weekStart
  proteinDaysBelowTarget: number, // over the same window
  totalDaysInWindow: number,
): PlateauSignal | null {
  if (weeklyBests.length < 3) return null;
  const lastThree = weeklyBests.slice(-3);
  const [w1, w2, w3] = lastThree;
  const flat = w3.bestE1rm <= w1.bestE1rm && w3.bestE1rm <= w2.bestE1rm * 1.02 && w2.bestE1rm <= w1.bestE1rm * 1.02;
  if (!flat) return null;

  return {
    exerciseId,
    weeksFlat: 3,
    intakeBelowTargetMostOfPeriod: totalDaysInWindow > 0 && proteinDaysBelowTarget / totalDaysInWindow > 0.5,
  };
}
