/**
 * The only place "today" is computed. Every streak, habit_logs.log_date, and
 * "is this meal today" check goes through here — never `new Date()` compared
 * to a UTC-derived string directly, or streaks snap at the wrong midnight
 * for every non-UTC user. Enforced by eslint's no-restricted-imports for
 * components/**; lib/habits and lib/nutrition should route through this too.
 */

/** YYYY-MM-DD for "now" in the given IANA timezone. */
export function todayLocal(timezone: string): string {
  return dateLocal(new Date(), timezone);
}

/** YYYY-MM-DD for an arbitrary instant in the given IANA timezone. */
export function dateLocal(instant: Date, timezone: string): string {
  // en-CA gives YYYY-MM-DD directly, no manual string surgery.
  return new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(instant);
}

/** Monday-start YYYY-MM-DD for the week containing `date` (also YYYY-MM-DD),
 * evaluated in local-calendar terms (no timezone maths needed once we're
 * working with a plain date string). */
export function weekStartLocal(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  const day = d.getUTCDay(); // 0 = Sunday
  const diff = (day + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - diff);
  return d.toISOString().slice(0, 10);
}

/** Add `days` (may be negative) to a YYYY-MM-DD date string. */
export function addDaysLocal(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** True if `date` (YYYY-MM-DD) is "today" in the given timezone. */
export function isTodayLocal(date: string, timezone: string): boolean {
  return date === todayLocal(timezone);
}
