/** Epley formula. Only trusted for reps <= 12 (spec: "only trust for reps ≤ 12") —
 * higher-rep sets estimate 1RM too unreliably to drive progression decisions. */
export function epley(loadKg: number, reps: number): { value: number; trusted: boolean } {
  const value = loadKg * (1 + reps / 30);
  return { value: Math.round(value * 10) / 10, trusted: reps <= 12 };
}
