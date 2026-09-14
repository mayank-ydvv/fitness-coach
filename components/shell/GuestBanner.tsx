/** Shown on every app page for an anonymous (guest) session — see
 * GuestButton and app/auth/signout/route.ts for how the account is created
 * and torn down. Purely presentational; the auth gate in (app)/layout.tsx
 * decides whether to render it.
 *
 * "Sign up to keep it" signs the guest out first (which deletes the guest
 * account server-side) rather than linking to /login directly — starting a
 * magic-link or Google flow on top of a live anonymous session would
 * silently orphan the anonymous user instead of cleaning it up. */
export function GuestBanner() {
  return (
    <div className="mx-auto mb-2 flex max-w-2xl items-center justify-between gap-3 rounded-control border border-hairline bg-surface-raised px-4 py-2.5 text-sm lg:max-w-4xl">
      <p className="text-ink-muted">You&apos;re browsing as a guest — nothing here is saved.</p>
      <form action="/auth/signout" method="post" className="shrink-0">
        <input type="hidden" name="next" value="/login" />
        <button type="submit" className="font-medium text-ink-primary underline underline-offset-2">
          Sign up to keep it
        </button>
      </form>
    </div>
  );
}
