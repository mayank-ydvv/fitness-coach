/**
 * "Remember me" — every successful sign-in already gets a 400-day
 * Supabase session cookie by default (that's `@supabase/ssr`'s own
 * `DEFAULT_COOKIE_OPTIONS.maxAge`, and this installed version applies
 * it unconditionally to every cookie it writes — passing a custom
 * `cookieOptions.maxAge` to `createBrowserClient`/`createServerClient`
 * does NOT override it, confirmed by reading `node_modules/@supabase/
 * ssr/dist/module/cookies.js`'s `storage.setItem`, not by guessing from
 * the docs). So the *default* behaviour already is "stay signed in
 * until you sign out" — there's no library knob to make a session
 * shorter.
 *
 * What the checkbox actually controls is a second, separate cookie:
 * `REMEMBER_COOKIE`. Checked → it gets `REMEMBER_MAX_AGE` (also 400
 * days, matching the session's own lifetime — no point outliving it).
 * Unchecked → it's set with no Max-Age at all, a true browser-session
 * cookie that disappears the moment every window closes, while the
 * underlying Supabase session cookie physically remains (it can't be
 * shortened). `middleware.ts` is what turns "this marker is gone but
 * the Supabase cookie is still there" into an actual sign-out on the
 * next visit — see the comment there for why presence/absence alone
 * (rather than a "0"/"1" value) is what's checked, and for the
 * one-time re-login this causes for sessions that predate this cookie.
 */
export const REMEMBER_COOKIE = "remember-me";
export const REMEMBER_MAX_AGE = 400 * 24 * 60 * 60;

/** Client-side only — call right after a session is established
 * (magic-link verify, or straight after `signInAnonymously`). */
export function setRememberCookie(remember: boolean) {
  if (typeof document === "undefined") return;
  const maxAge = remember ? `; Max-Age=${REMEMBER_MAX_AGE}` : "";
  document.cookie = `${REMEMBER_COOKIE}=1; Path=/${maxAge}; SameSite=Lax`;
}
