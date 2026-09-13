import type { Fault } from "./rules/types";

/** 100 per rep, -15 per major fault, -5 per minor, floor 0. Overall is the
 * mean across reps (spec §7). */
export function scoreRep(faultsThisRep: Fault[]): number {
  let score = 100;
  for (const f of faultsThisRep) score -= f.severity === "major" ? 15 : 5;
  return Math.max(0, score);
}

export function overallScore(repScores: number[]): number {
  if (repScores.length === 0) return 0;
  return Math.round(repScores.reduce((s, v) => s + v, 0) / repScores.length);
}
