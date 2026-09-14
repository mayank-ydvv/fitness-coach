/**
 * Translates Supabase's raw auth error messages into copy that says what
 * to do next, per the brief's rule: "That email and password don't
 * match" — not "Authentication failed." Supabase's own strings are
 * accurate but not written for an end user (e.g. "Email rate limit
 * exceeded"), so this is a thin, honest rewrite — never hides the real
 * cause, just adds the next step. Falls back to the raw message with a
 * generic next step for anything not explicitly handled, rather than
 * guessing at wording for an error we haven't seen.
 */
export function describeAuthError(message: string): string {
  const lower = message.toLowerCase();

  if (lower.includes("rate limit")) {
    return "Too many sign-in emails sent recently. Wait a few minutes, then try again.";
  }
  if (lower.includes("invalid") && lower.includes("email")) {
    return "That doesn't look like a valid email address. Check it and try again.";
  }
  if (lower.includes("signups not allowed") || lower.includes("signup is disabled")) {
    return "New sign-ups aren't open right now. Try continuing as a guest instead.";
  }
  if (lower.includes("network") || lower.includes("fetch")) {
    return "Couldn't reach the sign-in server. Check your connection and try again.";
  }

  return `${message} — try again in a moment, or continue with Google instead.`;
}
