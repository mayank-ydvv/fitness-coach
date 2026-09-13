/** Query-key factory — one source so a mutation's setQueryData/invalidate
 * target always matches the query that reads it. Extended per-milestone;
 * M0/M1 only need profile + today. */
export const qk = {
  profile: () => ["profile"] as const,
  targets: () => ["nutrition-targets"] as const,
  today: (date: string) => ["today", date] as const,
  meals: (date: string) => ["meals", date] as const,
  rollup: (date: string) => ["rollup", date] as const,
  habitsToday: (date: string) => ["habits", "today", date] as const,
};
