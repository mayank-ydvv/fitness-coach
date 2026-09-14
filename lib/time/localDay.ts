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

/** The UTC offset (minutes; positive east of UTC) the given timezone has
 * at `instant`. Not exported — only `dayRangeUtc` needs it, and exporting
 * a bare offset invites someone to do their own (buggier) day-boundary
 * math with it instead of using that function. */
function tzOffsetMinutes(instant: Date, timezone: string): number {
  const part = new Intl.DateTimeFormat("en-US", { timeZone: timezone, timeZoneName: "longOffset" })
    .formatToParts(instant)
    .find((p) => p.type === "timeZoneName")?.value;
  // "GMT", "GMT+5:30", "GMT-07:00" — the bare zero-offset case has no
  // sign/digits at all, hence the fallback rather than assuming a match.
  const match = part?.match(/GMT([+-])(\d{1,2}):(\d{2})/);
  if (!match) return 0;
  const sign = match[1] === "-" ? -1 : 1;
  return sign * (Number(match[2]) * 60 + Number(match[3]));
}

/**
 * The real UTC instant range `[start, end)` covering one local calendar
 * day — use this to query a `timestamptz` column "for today"/"for this
 * date", never a bare `${date}T00:00:00` literal. Postgres/PostgREST
 * parses an offset-less literal like that in the *session's* timezone
 * (UTC on this project), not the user's — so for any user not at UTC+0
 * there's a multi-hour window every day (tied to their UTC offset, wide
 * enough to cover a whole evening or morning, not just a moment at
 * literal midnight) where a row correctly stored for "today" in their
 * timezone falls outside a same-day query built this way. This is
 * exactly what made a just-logged meal disappear on the next refetch —
 * not deleted, just silently excluded from "today" by every query using
 * the naive form. Grep for `T00:00:00` before adding a new one.
 */
export function dayRangeUtc(date: string, timezone: string): { start: string; end: string } {
  const startGuessUtc = new Date(`${date}T00:00:00Z`);
  const offsetMinutes = tzOffsetMinutes(startGuessUtc, timezone);
  const start = new Date(startGuessUtc.getTime() - offsetMinutes * 60_000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start: start.toISOString(), end: end.toISOString() };
}
