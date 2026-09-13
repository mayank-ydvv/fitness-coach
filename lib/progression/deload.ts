import type { ProgressionDecision } from "./types";

/** 3+ exercises missing targets within one week triggers an early deload
 * for next week (spec §6), with the plain-language reason the app shows. */
export function shouldTriggerEarlyDeload(decisionsThisWeek: ProgressionDecision[]): { trigger: boolean; reason: string | null; missedCount: number } {
  const missedCount = decisionsThisWeek.filter((d) => d.missed).length;
  if (missedCount >= 3) {
    return {
      trigger: true,
      missedCount,
      reason: `You missed targets on ${missedCount} lifts this week. Next week is lighter on purpose.`,
    };
  }
  return { trigger: false, reason: null, missedCount };
}
