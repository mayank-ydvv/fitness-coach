/**
 * The rotating insight-card generator (spec §9's Today priority-order item
 * 5). Pure — no AI call, generated entirely from data the app already
 * has. Exactly one insight shows at a time; this picks which one in a
 * fixed priority order: new PR > plateau warning > protein vs target >
 * streak milestone.
 */
export type Insight =
  | { kind: "pr"; exerciseName: string; loadKg: number; reps: number }
  | { kind: "plateau"; exerciseName: string; weeksFlat: number; intakeBelowTarget: boolean }
  | { kind: "protein"; averageG: number; targetG: number }
  | { kind: "streak"; habitName: string; days: number };

export type InsightInputs = {
  recentPr: { exerciseName: string; loadKg: number; reps: number } | null;
  plateau: { exerciseName: string; weeksFlat: number; intakeBelowTarget: boolean } | null;
  protein: { averageG: number; targetG: number } | null;
  streakMilestone: { habitName: string; days: number } | null;
};

const STREAK_MILESTONES = [7, 14, 30, 60, 100, 365];

export function isStreakMilestone(days: number): boolean {
  return STREAK_MILESTONES.includes(days);
}

/** Protein counts as "below target" only meaningfully below ~85% — a
 * near-miss isn't worth an insight slot. */
function proteinNoteworthy(averageG: number, targetG: number): boolean {
  return targetG > 0 && averageG / targetG < 0.85;
}

export function pickInsight(inputs: InsightInputs): Insight | null {
  if (inputs.recentPr) return { kind: "pr", ...inputs.recentPr };
  if (inputs.plateau) return { kind: "plateau", ...inputs.plateau };
  if (inputs.protein && proteinNoteworthy(inputs.protein.averageG, inputs.protein.targetG)) {
    return { kind: "protein", ...inputs.protein };
  }
  if (inputs.streakMilestone) return { kind: "streak", ...inputs.streakMilestone };
  return null;
}

/** Copy for each insight kind — plain, present tense, one fact + one
 * instruction where relevant (spec's copy voice). */
export function insightMessage(insight: Insight): string {
  switch (insight.kind) {
    case "pr":
      return `New PR: ${insight.exerciseName} at ${insight.loadKg} kg × ${insight.reps}.`;
    case "plateau":
      return `${insight.exerciseName} hasn't moved in ${insight.weeksFlat} weeks.${insight.intakeBelowTarget ? " Your intake has been under target most of that time." : ""}`;
    case "protein":
      return `7-day protein average is ${insight.averageG}g of your ${insight.targetG}g target.`;
    case "streak":
      return `${insight.habitName}: ${insight.days}-day streak.`;
  }
}
