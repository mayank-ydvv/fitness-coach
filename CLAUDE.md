# AI Fitness Coach

Full build plan: see the plan this repo was built from — milestones M0–M6,
cross-cutting decisions, risks, and verification gates are all there. Ask
before assuming a decision wasn't already made deliberately; most were.

## Commands

```
npm run dev        # next dev --turbopack, http://localhost:3100 (fixed port — see .claude/launch.json)
npm run build      # next build --turbopack (prebuild syncs MediaPipe wasm — see lib/form/modelConfig.ts)
npm run lint       # eslint
npx tsc --noEmit   # typecheck (no dedicated script; strict mode, must be clean)
npm run check      # all four fixture suites: nutrition targets, progression engine, habit streaks, form rep-counting
npm run test:a11y  # Playwright + axe against /, /login, /demo (the only routes reachable without a real session — see e2e/axe.spec.ts)
npm run test:perf  # Today-interactive-under-2.5s budget, using /demo as the stand-in (same reason)
npm run test:e2e   # both of the above
```

`npm run check` runs `scripts/check-{targets,progression,streaks,form}.ts` via
`tsx` — plain scripts with a hand-rolled assert/report pattern (mirroring
gesture-fps's `?test=1` harness this app was built alongside), not a test
framework. `npm run test:e2e` needs Chromium installed once
(`npx playwright install chromium`) and a dev server already running on
port 3100.

## Supabase project

Project `fitness-coach`, ref `dfrcnbmgtgntllsahdgg`, region `ap-southeast-2`,
org `kusdlkdtcdecwtptctkh`. Free tier — **auto-pauses after 7 days idle**;
if a request 500s with no obvious cause, check whether the project needs
waking (Supabase dashboard, or any MCP call resumes it).

Migrations live in `supabase/migrations/000N_name.sql`, applied directly
against the live project via the Supabase MCP (`apply_migration`) — there is
no local Postgres and no `supabase db push` wired up. Apply new migrations
the same way, in order, and regenerate `lib/supabase/database.types.ts`
(MCP `generate_typescript_types`) afterward.

M0 wrote the **complete final schema** up front (all 16 tables, including
columns M3/M5/M6 need — `progression_runs`, `planned_sets.origin`,
`exercises.form_rules`, etc.) rather than splitting schema changes across
every milestone. Later milestones only add migrations for things that are
genuinely new (e.g. M5's `form_rules` threshold values, M6's cleanup
function) — check the existing schema before assuming a column is missing.

`.env.local` needs `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard → Project
Settings → API) and `GEMINI_API_KEY` pasted in before `lib/supabase/admin.ts`
or any `lib/ai/*` route will work — the MCP server doesn't expose either as a
readable secret.

## AI provider: Gemini, not Claude

Every `lib/ai/*` module calls Google Gemini (`@google/genai`, model
`gemini-3.6-flash` — see the comment in `lib/ai/client.ts` for why that
specific model and not `gemini-2.5-flash`) via `geminiClient()`, not
Anthropic. This mirrors the sibling `findr` project's already-proven
`lib/gemini.ts` pattern exactly: a dual schema per call (a Zod schema for
runtime validation/TS types, plus a hand-written `Type.OBJECT`-based
`Schema` for Gemini's `config.responseSchema` — the two are kept in sync
by hand, there's no automatic derivation between them), vision input via
`{ inlineData: { data, mimeType } }` rather than Anthropic's `image`
content-block shape, and a lazily-constructed client for the same
build-time-warning reason as before. If you're implementing a new AI call,
copy the shape from `lib/ai/mealVision.ts` or `findr/lib/gemini.ts`, not
from memory of the Anthropic SDK.

Google OAuth needs a client ID/secret configured in the Supabase dashboard
(Authentication → Providers → Google) before "Continue with Google" works —
that's a manual step outside what any tool here can do. Magic-link sign-in
works with no extra setup.

## Guest mode: an exception to "no anonymous sign-in"

The original plan's auth section says "real sessions (no anonymous sign-in,
unlike findr)". That was overridden later: the user explicitly asked for a
"continue as guest" option, so **Anonymous Sign-Ins are enabled** in the
Supabase dashboard (Authentication → Providers) and `GuestButton.tsx`
(`components/auth/GuestButton.tsx`) calls `supabase.auth.signInAnonymously()`
from the hero and the login page.

This is a real Supabase user (`is_anonymous: true` on the JWT), not a
client-only mock — a guest gets the actual app, writing real rows under
their own RLS-scoped `auth.uid()`, same as everyone else. No RLS policy
changes were needed because anonymous users already use the `authenticated`
role.

"Nothing is saved" is enforced on sign-out, not by withholding writes:
`app/auth/signout/route.ts` calls the existing `delete_account()` RPC when
`user.is_anonymous` is true, which deletes the `auth.users` row and
cascades everything the guest created. `GuestBanner.tsx`
(`components/shell/GuestBanner.tsx`, shown via `AppShell`'s `isGuest` prop)
keeps this visible while using the app. Its "Sign up to keep it" action
signs out first (cleaning up the guest row) rather than linking straight to
`/login`, because starting a magic-link/Google flow on top of a live
anonymous session would silently orphan that anonymous user instead of
cleaning it up.

## Design system: re-themed from dark to light (healthifyme.com reference)

The original build plan specifies a dark matte-graphite palette (spec §3:
`--surface-base #16181A`, `--ink-primary #F2F0ED`, `color-scheme: dark`).
That was deliberately overridden later: the user asked for the whole app's
look to match healthifyme.com's landing page — warm cream surfaces, white
cards, a deep forest-green brand color, pill-shaped controls — not just the
public landing page. `app/globals.css`'s `@theme` block now reads:

- `--color-surface-base #F7F2E7` (cream), `--color-surface-raised #FFFFFF`
  (white cards — now the *lightest* layer, inverted from the old dark
  scheme where raised was lighter-than-base but still dark),
  `--color-surface-sunken #EDE6D6` (recessed wells/inputs, now darker than
  base instead of lighter), `color-scheme: light`.
- `--color-ink-primary #1C1F1A`, `--color-ink-muted #63685C` (this exact
  value, not a rounder-looking one, because the first attempt at a muted
  gray — `#6E7268` — only cleared 4.4:1 against the cream background;
  `npm run test:a11y`'s axe gate caught it. Don't re-derive this color by
  eye without re-running that gate).
- `--color-action #1F5D46` (deep forest green, replacing the old blue
  `#3568B0`).
- **New token `--color-ink-on-brand: #FFFFFF`**, split out from
  `--color-ink-inverse`. Both are "text for a colored fill," but they now
  serve opposite ends of the lightness scale: `ink-on-brand` is for the
  dark `--color-action`/`--color-action-danger` fills (Button
  primary/danger, SegmentedControl's checked state, SkipLink), while
  `ink-inverse` stays for the mid-tone `--color-load-*` fills (HabitDot).
  Reusing one token for both broke contrast on one side or the other —
  don't collapse them back into one.
- `--radius-card`/`--radius-control` bumped to 20px/14px (from 14px/10px),
  and `<Button>` uses `rounded-full` (a true pill) instead of
  `rounded-control` specifically, matching the reference's CTA shape.

The `--color-load-*` intensity scale (green/yellow/blue/red for RPE/
intensity/form-fault severity) is **unchanged** — those hex values were
already chosen to be meaningful independent of the surrounding theme, and
this restyle didn't touch them. `BottomNav`/`LeftRail`'s active-nav-item
color moved from `text-load-blue` to `text-action`: that was already a
minor misuse of the load scale for a non-intensity purpose, and green now
reads as the brand color anyway.

If you touch `e2e/axe.spec.ts`: the landing page's hero has a staged
Motion entrance (`components/marketing/Hero.tsx`), and axe scanning
mid-fade produces a false-positive contrast violation (an element still at
`opacity: 0`). The test emulates `prefers-reduced-motion: reduce` before
`page.goto()` for exactly this reason — Hero already honors that media
query via `useReducedMotion()`, so this exercises the real settled state.
Don't remove that emulation to "simplify" the test.

## Conventions (see the plan for the reasoning behind each)

- Three Supabase clients: `lib/supabase/{client,server,admin}.ts`. Admin
  (service-role) is `server-only` and its allowed operations are enumerated
  in a comment at the top of the file — don't widen its use without updating
  that comment.
- `middleware.ts` (not `proxy.ts` — that's a Next 16 rename, this app is 15).
- No shadcn/ui. Three Radix primitives (`Dialog`, `RadioGroup`, `Slider`)
  installed directly; everything else in `components/ui/` is hand-rolled
  against the `@theme` tokens in `app/globals.css`.
- `<Metric>` is the only component allowed to render a number
  (`value: string | null`, never a raw number). `<StatusDot>` requires a
  `label`. Both are type-level enforcement of "hide calorie numbers" and
  "colour is never the sole meaning-carrier" — don't add a second numeral
  renderer or an optional-label status indicator.
- Units: SI in the DB (`*_kg`, `*_cm`, `*_kcal` column names), converted only
  through `lib/units/convert.ts`, displayed only through
  `makeFormatter()`/`useMeasure()`. Components may not import `convert.ts`
  directly (eslint `no-restricted-imports` enforces this).
- "Today" is computed only via `lib/time/localDay.ts` (same eslint rule) —
  never compare a bare `new Date()` against a stored date string, or streaks
  and daily rollups snap to the wrong midnight for non-UTC users.
- Every user-generated row's UUID is created client-side
  (`crypto.randomUUID()`), not server-side — this is what makes optimistic
  updates and Realtime patches idempotent by construction. Don't switch a
  table to server-generated IDs without re-reading why in the plan.
- Motion budget is exactly three moments (set-logged row collapse, rest-timer
  ring, habit-dot fill), all `prefers-reduced-motion`-aware. Don't add a
  fourth without checking the plan's reasoning first.
- `--color-action` / `--color-action-danger` (not `--color-load-blue` /
  `--color-load-red`) are what `<Button>` primary/danger and
  `<SegmentedControl>`'s checked state use. This was an axe-verified WCAG
  AA fix (M6): even pure white text on the spec's exact load-blue
  (`#3D7FD4`) only reaches 4.05:1 against the 4.5:1 text threshold — the
  load-* tokens stay exactly as specified for their actual scope (load
  bars, RPE badges, dots, rings), which only needs the more lenient 3:1
  non-text contrast rule and already passes. Don't put text directly on a
  `bg-load-*` fill; use `bg-action`/`bg-action-danger` for that.

## Deliberately NOT built: offline support, PWA

The user explicitly wants this as an **online-only web app** — no offline
queue, no service worker, no "add to home screen" manifest. This overrides
the original spec's PWA/offline sections (§12) and the M6 plan's offline-
outbox-unification task, both written before that was said.

Concretely: `useLogMeal.ts`/`useSessionPlayer.ts`/`useToggleHabit.ts` all
just fail with a plain error when there's no connection — no IndexedDB
queue, no retry-on-reconnect. (An earlier pass *did* build
`lib/offline/mealQueue.ts` for M2's meal photos; it was removed along with
its usage once this was clarified — don't resurrect it.) If "works offline"
ever comes back as a requirement, treat it as new scope, not a bug.
