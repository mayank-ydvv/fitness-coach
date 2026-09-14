# Design system — running log

Source of truth for the visual re-theme approved 2026-09-14. Read this
before touching any screen so later phases stay consistent with earlier
ones. Supersedes the earlier healthifyme.com-inspired cream+green pass
entirely (that work is gone from `app/globals.css`, not layered under
this).

Presentation only. Nothing in this doc or the phases under it touches
application logic, routing, API calls, or auth.

## Central problem this is solving

Used by a 17-year-old and a 68-year-old; in a gym with sweaty hands, in a
kitchen mid-cooking. "Futuristic" here means depth, material quality, and
how the interface responds — not visual density or decoration. Generous
type, large targets, strong contrast, obvious affordances, always. If a
later change shrinks text or hides an action to look sleeker, it's wrong,
full stop — revert it rather than rationalizing it.

## 1. Palette

Six core values plus one semantic-only value. All implemented in
`app/globals.css`'s `@theme` block under the existing token *names*
(`--color-surface-base`, `--color-ink-primary`, etc.) — the names didn't
change from the previous pass, only the hex values, so no component had
to be touched to pick up the new palette.

| Name | Token | Hex | Role | Contrast |
|---|---|---|---|---|
| Canvas | `--color-surface-base` | `#F4F2ED` | Page background | — |
| Paper | `--color-surface-raised` | `#FCFBF9` | Cards, sheets — lightest layer | Graphite/Paper 16.2:1 |
| Stone | `--color-surface-sunken` | `#EAE6DF` | Inputs, wells, chip rest-state | Graphite/Stone 13.5:1 |
| Graphite | `--color-ink-primary` | `#211D1A` | Primary text, primary numbers | 14.95:1 on Canvas (AAA) |
| Ash | `--color-ink-muted` | `#6B655D` | Secondary/muted text | 5.15:1 on Canvas, 5.57:1 on Paper (AA) |
| Harbor | `--color-action` | `#1F6F68` | The one accent — primary action AND focus/live state (`--color-focus` aliases to it) | White/Harbor 5.95:1 |
| *(semantic only)* Ember | `--color-action-danger` | `#A13F35` | Errors, destructive actions. Nowhere else — never used for "over target" | White/Ember 6.41:1 |

`--color-hairline: #DEDAD1` — borders, separate from Stone.

**Decisions made during implementation, not in the original text plan:**
- `--color-focus` now aliases directly to `--color-action` (Harbor)
  instead of keeping a separate blue. The brief's own definition of the
  accent's job — "marking the primary action and live/active state" —
  already covers focus, so a second hue was one more color than the
  system needs.
- `--color-ink-inverse` (text on top of a mid-tone `--color-load-*` fill,
  e.g. `HabitDot`'s done state) is now `var(--color-ink-primary)` rather
  than its own hex. Under the old dark theme ink-primary was *light*, so
  ink-inverse needed a separate dark value; now that ink-primary is
  itself dark (Graphite), the two tokens would just be duplicate hex
  values. Aliased instead of duplicated so they can't drift apart by
  accident. The token name stays, so call sites still document *why*
  they're using it (text-on-a-colored-fill, not text-on-a-plain-surface).
- `--color-ink-on-brand` (white text on the dark Harbor/Ember fills —
  Button primary/danger, SegmentedControl's checked state, SkipLink) is
  unchanged from the previous pass and still needed: it's the opposite
  end of the lightness scale from ink-inverse and the two must stay split.

The `--color-load-*` intensity scale (RPE/exercise-intensity/form-fault
severity) is untouched — those hex values already carry meaning
independent of the surrounding theme, and none of the "avoid neon
green/progress rings" guidance applies to them (they're semantic status
color, not the brand accent, and are never rendered as a ring — see
`ProgressRing`/`StatusDot`, which draw a linear arc/dot, not a concentric
ring in the Apple Watch sense).

## 2. Type

Two faces:
- **Fraunces** (variable serif, Google Fonts) — headlines and every large
  number the user reads (calories remaining, weight, streak, e1RM).
  Wired as `--font-display` and `--font-metric` in `app/globals.css`, both
  pointing at the same `--font-fraunces` next/font variable set in
  `app/layout.tsx`. Weights requested: `500`, `600` — the text plan's
  informal "540/560" was rounded to these two, the nearest static
  instances next/font/google actually publishes for this family.
- **Public Sans** — everything else (labels, body, buttons, nav).
  Unchanged from every earlier pass.

Replaces Barlow Condensed entirely — grepped the repo first to confirm
nothing else referenced `--font-barlow-condensed` before removing it from
`app/layout.tsx`.

| Token | Face | Size | Line-height | Tracking | Role |
|---|---|---|---|---|---|
| `--text-metric` | Fraunces | `clamp(2.75rem, 6vw, 4.5rem)` | 1.05 | −0.01em | Hero display AND hero metric (calories/weight/streak headline number) |
| `--text-4xl` | Fraunces | 2.5rem (40px) | 1 | −0.01em | metric-lg |
| `--text-3xl` | Fraunces (via `h1-h4` rule) | 2.25rem (36px) | 1.1 | −0.01em | display-section |
| `--text-2xl` | Public Sans | 1.5rem (24px) | 1.25 | 0 | heading-lg |
| `--text-xl` | Public Sans | 1.25rem (20px) | 1.3 | 0 | heading-md |
| `--text-lg` | Public Sans | 1.125rem (18px) | 1.6 | 0 | body-lg |
| `--text-base` | Public Sans | 1.0625rem (17px) | 1.6 | 0 | body — the sitewide floor |
| `--text-sm` | Public Sans | 0.9375rem (15px) | 1.4 | 0 | labels, chip text |
| `--text-xs` | Public Sans | 0.875rem (14px) | 1.4 | 0 | meta/timestamps only — never reading content, never below this size anywhere |

The `.metric` utility (`app/globals.css`) forces `font-variant-numeric:
tabular-nums lining-nums` on top of the Fraunces family, so a numeral
never accidentally renders with oldstyle/proportional figures — added
`lining-nums` to the pre-existing `tabular-nums` specifically because
Fraunces (like most serif text families) defaults to oldstyle figures,
which look elegant in prose but wrong in a data readout ("1,847 kcal"
with varying cap-heights per digit).

`h1`–`h4` get `font-family: var(--font-display)` globally (new rule in
`app/globals.css`) so every heading picks up Fraunces without every call
site needing a class.

## 3. Radius — encodes hierarchy

Four steps, smallest-to-largest matches least-to-most "container-like":

| Token | Value | Use |
|---|---|---|
| `--radius-chip` | 8px | Portion chips, tags, small pills |
| `--radius-control` | 12px | Inputs, buttons, segmented-control items |
| `--radius-card` | 20px | Cards, panels |
| `--radius-sheet` | 28px | Bottom sheets, modals — the largest container |

`--radius-control` moved from 14px (the previous pass) to 12px, and
`--radius-chip`/`--radius-sheet` are new. `--radius-card` (20px) is
unchanged.

**Deferred to Phase 3:** `Button.tsx` still has `rounded-full` from the
previous (rejected) pass — a leftover, not a decision. It'll read the new
colors correctly already (Tailwind resolves `bg-action`/`text-ink-on-brand`
to the new hex immediately), but the shape itself — full pill vs.
`rounded-control` — gets fixed when Button is rebuilt with all its states
in Phase 3, not patched piecemeal now. Per the approved plan, buttons
should land at the "input" radius tier, not a pill (a pill matches
Healthify's soft-wellness framing; this system's framing is precision
instrument), but this is a Phase 3 task, not a Phase 2 token.

## 4. Shadows — two elevation tiers

Both multi-layer (tight contact shadow + wide soft ambient + a hairline
top highlight standing in for caught light on a raised Paper surface).
Tailwind v4 turns `--shadow-*` theme keys directly into `shadow-raised` /
`shadow-floating` utilities — no separate wiring needed.

- `--shadow-raised` — the standard card/panel tier.
- `--shadow-floating` — deliberately heavier: for anything that floats
  *above* the page rather than sitting *on* it (the rest-timer takeover,
  a sheet, a toast). Not applied to any component yet — that's Phase 3
  (`Card`, `Sheet`, `Toast`, the rest-timer overlay).

## 5. Motion tokens

`--ease-standard` / `--ease-spring` and `--duration-feedback` /
`--duration-transition` / `--duration-hero` live in `app/globals.css` for
any plain-CSS transition. Motion (`motion/react`) components read plain
JS values, not CSS custom properties, so the same values are mirrored in
`lib/motion/tokens.ts` (`EASE`, `DURATION`, `STAGGER`) — **keep both in
sync by hand if either changes**; nothing enforces this automatically.

No component wiring yet (that's each interior phase's job — e.g. the
rest timer, habit-check, set-complete moments in Phase 7) — Phase 2 only
establishes the values so nothing downstream invents its own duration or
easing curve.

## 6. Grain

A fixed, `pointer-events: none` SVG-turbulence overlay on `body::before`
at 2.5% opacity, `mix-blend-mode: multiply`. Applies sitewide (it's behind
all real content in normal stacking order) rather than per-surface, since
Canvas is the only surface large enough for grain to read as intentional
texture rather than noise on small elements.

## 7. Spacing — deliberately unchanged

Still Tailwind v4's default 4px-based `--spacing` scale. This was already
decided in an earlier pass (see `CLAUDE.md`: "Don't touch `--spacing` —
v4's default 0.25rem already makes `px-5` = the spec's 20px gutter") and
nothing in the new brief argues against it — noted here explicitly so it
isn't mistaken for something Phase 2 forgot.

## 8. Signature idea

The landing-page hero doesn't describe the product — it runs it. A
visitor taps a goal and watches a real week of programming assemble
itself in a live preview built from the app's real components, not a
screenshot or a video loop. Every other AI touchpoint (a lighter session,
a nudged rest day) follows the same rule afterward: a plain sentence,
never a badge or a gradient border. Not implemented yet — this is the
Phase 4 (landing page) deliverable.

## 9. Flagged, not decided here

- **Age-appropriate deficit logic.** `profiles.date_of_birth` exists and
  `lib/nutrition/guardrails.ts` computes calorie floors/deficits. A
  younger-user cap would live there. Not touched — logic change, needs
  separate explicit sign-off per the brief's own instruction.

## 10. Phase 3 — core components

Rebuilt with the Phase 2 tokens and real states, not just a color swap:

- **Button** — fixed the leftover `rounded-full` pill from the rejected
  pass (now `rounded-control`, per §3's decision). New `loading` prop:
  progress shows as a thin indeterminate bar along the bottom edge
  (`bg-current`, so it always contrasts correctly against whatever
  variant it's on) rather than swapping the label for a spinner — per
  the brief's auth-form note. `active:scale-[0.98]` for a tactile press.
  Not wired into any call site yet — `LoginForm` still uses its own
  text-swap ("Sending link…"); wiring `loading` into it is Phase 5's job
  (the brief scopes "progress shown in the button" to the login form
  specifically, under §6).
- **Field** — label now defaults to Ash and shifts to Graphite on
  `group-focus-within`, so the label itself responds to its input's
  focus, per §6's "border, background, and label all respond."
- **TextInput / NumberInput** — border shifts to Harbor and background
  lifts from Stone to Paper on focus (the global `:focus-visible` ring
  still applies on top — one gives the "physical" feel, the other is the
  WCAG focus-appearance guarantee, neither replaces the other). Invalid
  state keys off `aria-invalid`.
  - **Bug caught during verification**: the invalid-state class was
    written as `aria-invalid:border-action-danger` — `aria-invalid` is
    not one of Tailwind's built-in shorthand ARIA variants (unlike
    `aria-checked`/`aria-pressed`/etc.), so the class silently generated
    no CSS at all. Confirmed by actually setting `aria-invalid="true"` in
    the browser and reading `getComputedStyle` before and after the fix.
    Corrected to the explicit arbitrary-attribute form,
    `aria-[invalid=true]:border-action-danger`, and re-verified.
- **PasswordInput** — new. TextInput plus a real 44×44px visibility
  toggle (not an icon crammed into the input's own padding); the
  toggle's accessible name changes with state ("Show password"/"Hide
  password").
- **Card** — new shadow/radius tokens. Explicitly does *not* lift or grow
  its shadow on hover — per the brief, that's one of the two clearest
  "generated page" tells (the other being scroll-fade-ups).
- **Chip / RemovableChip** — new, split into two components rather than
  one combined one. A single `Chip` handling both "toggle" and
  "removable-with-×" would need a button nested inside a button, which
  is invalid HTML and breaks the inner control's keyboard/screen-reader
  operation — caught before shipping, not after.
- **ChartShell** — new. `summary` (a plain-language text alternative) is
  a required prop, the same way `Metric`'s `value` and `StatusDot`'s
  `label` are non-optional — enforces "charts with text alternatives" at
  the type level instead of hoping every chart remembers it.
- **Sheet** — radius bumped to the new `--radius-sheet` tier, shadow to
  `shadow-floating`. Real open/close motion: mobile slides fully
  off-screen, desktop scales from center, both driven by Radix's
  `data-state` attribute — Radix's own Presence machinery waits for the
  CSS animation to finish before unmounting, so no `AnimatePresence`
  needed here. Overlay backdrop changed from a raw `bg-black/60` to
  `bg-ink-primary/40`, so the scrim is a themed color, not a hardcoded one.
- **Toast** — same `shadow-floating` tier; now wrapped in Motion's
  `AnimatePresence` (unlike Sheet, toasts mount/unmount from plain React
  state, not a Radix Presence-aware primitive, so Motion is what actually
  has to delay the removal for the exit animation — the CSS
  `data-state` trick Sheet uses doesn't apply here). Its danger-tone
  border was `border-load-red`; corrected to `border-action-danger` — the
  same class of bug as the LineChart one below.
- **Bug caught while touching this area, not introduced by it**:
  `LineChart.tsx`'s last-point label had `fill="#F2F0ED"` hardcoded — the
  *old* dark-theme `ink-primary` value. Once the re-theme flipped
  `ink-primary` to dark, that label became invisible near-white text on
  the light background. Fixed to `fill="currentColor"` + `text-ink-primary`
  so it can't drift out of sync with the token again. Six more instances
  of the same underlying mistake — error/destructive text using
  `text-load-red` (the RPE/intensity color) instead of
  `text-action-danger` (Ember, the actual error color) — were found by
  grep and fixed across `CaptureClient.tsx`, `auth/confirm/page.tsx`,
  `DeleteAccount.tsx`, `GuestButton.tsx`, `ConfirmSignIn.tsx`, and
  `OnboardingFlow.tsx`. `HabitDot.tsx`'s `load-red` mapping was left
  alone — that one is a legitimate habit-color choice, not an error.
- **Skeleton, EmptyState, BottomNav, LeftRail** — reviewed, no changes
  needed; they already inherit the new tokens automatically and had no
  hardcoded values.

Verified live: input focus/invalid states confirmed via
`getComputedStyle` in the browser (not just visual inspection), Sheet
open/close on the Habits "Add habit" dialog, Card shadow/radius on
Habits' empty state. Full re-run of typecheck, lint, and
`npm run test:a11y` (all 5 tests) after every fix.

## 11. Phase 4 — landing page

Full rebuild under `components/marketing/`, composed by `LandingPage.tsx`
and rendered from `app/page.tsx` — replaces the minimal single-section
`Hero.tsx` that predated this brief. `Nav`, `Hero`, `Problem`, `Features`,
`HowItWorks`, `BuiltForEveryAge`, `ProductPreview`, `Faq`, `ClosingCta`,
`Footer`. No social-proof section — no real testimonials exist, and the
brief is explicit: skip entirely rather than invent any.

- **Hero is the signature idea, actually built**: a goal picker (`Chip`)
  swaps a live plan preview below it using real app components, not a
  screenshot or video loop. Deterministic, illustrative data
  (`planPreviewData.ts`) — explicitly not a call to
  `lib/program/generate.ts`, since this is a stranger with no account yet.
- **Nav** changes to a Paper background + shadow on scroll (persistent
  chrome, not a content reveal — not the same thing as the banned
  "sections fade in on scroll" pattern).
- **Two scroll-triggered reveals, the brief's stated maximum**:
  `BuiltForEveryAge`'s two statements and `ProductPreview`'s three
  callouts. Both used because the *sequence* communicates something (two
  different people arriving at the same plan; a numbered tour through a
  screen) — everything else on the page is static, no fade/slide-up.
- **Faq** uses native `<details>`/`<summary>` — zero JS, fully
  keyboard-operable and screen-reader-correct for free, styled to match
  the token system with a rotating `ChevronDown`.
- **Caught before shipping**: the footer originally linked to
  `/settings/privacy` (doesn't exist) and `mailto:support@aifitnesscoach.app`
  (a fabricated domain). Neither was real. Fixed by pointing "Privacy" to
  the FAQ's actual privacy answer on the same page (`#privacy`) and
  dropping "Contact" entirely rather than invent an address — flagged
  here instead of silently shipping a fake one.
- **Two real bugs caught by `npm run test:a11y`, not by eye**:
  1. `Hero`'s plan-preview rows played their staggered entrance animation
     on first page load (not just on a goal switch), racing axe's scan —
     it caught a row still mid-fade and reported a false-positive
     contrast violation. `prefers-reduced-motion` emulation alone didn't
     catch this because Motion-driven opacity animates over real
     wall-clock time regardless of the OS motion preference (only
     CSS-driven transitions get force-collapsed by the global reduced-
     motion rule) — the actual fix was a `hasInteracted` gate: nothing
     animates until the user has actually clicked a goal chip once. Page
     load now renders already-settled, matching "motion shows what
     changed" — nothing has changed yet on load.
  2. The 360px-no-horizontal-scroll test failed by exactly 8px on `/`.
     Traced (not guessed) via `getBoundingClientRect`/`scrollWidth`
     diffing in the live browser, cross-checked against `/demo` (which
     passes the same test at the same viewport) to rule out an
     environment/scrollbar artifact before concluding it was real. Root
     cause: a classic CSS Grid "blowout" — `Features.tsx`'s exercise rows
     (`Barbell back squat` / `4 × 6 @ 82.5 kg`) in a `justify-between` flex
     row with no `min-width: 0`, so the row's min-content size forced the
     whole grid wider than its container. Fixed with `truncate` on the
     name span and `min-w-0` on both the span and the grid-item `Card`
     (the standard fix for this exact class of bug). A second, smaller
     instance in `ProductPreview.tsx` — a numbered badge deliberately
     hung `-right-2 -top-2` outside its box — was pulled fully inside
     (`right-2 top-2`) rather than left as a second overflow source.

Verified live at both 360px and desktop widths, goal-picker interaction
confirmed to actually swap content (not just visually spot-checked),
FAQ accordion opens/closes via real click. Full re-run of typecheck,
lint, `npm run test:a11y` (all 5), and `npm run check` (all 46 fixture
assertions) after the fixes above.

## 12. Phase 5 — auth pages

**The brief assumes traditional email/password auth (signup, forgot-
password, reset). This app is passwordless by design** — magic link
(which doubles as signup on first use) + Google OAuth + guest mode (see
the earlier guest-mode work, unrelated to this visual pass). There is no
password anywhere in the real flow, so no forgot-password/reset screens
were built for a mechanism that doesn't exist — inventing one would mean
adding real password logic, out of scope for a presentation-only phase.
Flagged here rather than silently reinterpreted or silently skipped.
Applied the brief's actual *intent* — every real state designed, physical
inputs, progress in the button, honest error copy, one shared layout — to
the auth surface that's actually here.

- **`AuthShell`** (new) — the shared split layout `/login` and
  `/auth/confirm` both use: form on one side, `AuthVisual` on the other.
  Visual collapses to a short strip above the form on mobile rather than
  disappearing (`order-1` mobile, `md:order-1`/`md:order-2` desktop).
  Written so a forgot-password/reset screen would slot into the same
  shell automatically, if this app ever grows real passwords.
- **`AuthVisual`** (new) — the "something alive," drawn from the app's
  own subject matter: a smoothed trend line that draws itself in once via
  `pathLength` on mount (not a stock gym photo, not a gradient blob). Not
  a loop — draws once and stops, then a static caption. Reduced motion
  renders it already-drawn.
- **`LoginForm`** — every real state now designed: focus/invalid physical
  response (inherited from Phase 3's `TextInput`/`Field`, now actually
  wired via `aria-invalid={status === "error"}`, which the previous
  version never set), submitting (`Button`'s `loading` prop — a real
  in-flight `signInWithOtp` call, not a fake timer), a richer success
  state (`MailCheck` icon, restated email, an escape hatch to "Use a
  different email" instead of being stuck), and honest error copy via the
  new `authErrorCopy.ts` (below). "New here?" doesn't toggle to a
  separate signup form — there isn't one — it's one line clarifying the
  same link creates the account.
- **`authErrorCopy.ts`** (new) — translates Supabase's raw error strings
  ("Email rate limit exceeded") into copy that says what to do next
  ("Wait a few minutes, then try again"), per the brief's explicit
  example. Falls back to the raw message plus a generic next step for
  anything not explicitly handled, rather than guessing at wording for an
  error not yet seen in practice.
- **`ConfirmSignIn`** — added the "success before redirect" state the
  brief calls for, which plainly didn't exist before (verifying jumped
  straight to `router.replace` with zero confirmation the click worked).
  Now: verifying (loading in the button) → a real, brief success state
  (`CircleCheck`, "You're in — taking you there now") → redirect after
  500ms. Also wired `loading` instead of the old manual text-swap.

Verified live: focus state (Harbor border + Paper background lift),
typed-then-submitted a genuinely invalid recipient and confirmed the
Ember invalid border plus the translated error copy actually renders (not
Supabase's raw string), then sent a real magic link to the account
owner's own inbox (the one Resend's sandbox can actually deliver to) and
caught the loading state (dimmed label, sliding progress bar) and the
success state (icon, restated email, escape hatch) live, mid-flow, not
simulated. The confirm page's malformed-link error state verified live;
its verifying/success states rely on the same `Button`/`CircleCheck`
primitives already proven on the login page rather than a second live
click-through, since that requires opening a real emailed link.
`getBoundingClientRect`-based coordinate clicks were unreliable after a
manual `resize_window` call in this session (clicks landed at the wrong
element) — switched to ref-based clicks (`find`/`read_page` → `ref`) for
every interaction after that, which resolved it. Full re-run of
typecheck, lint, and `npm run test:a11y` (all 5) afterward.

## 13. Phase 6 — onboarding flow

Restructured `components/onboarding/` around the brief's most specific
section. Nothing about the actual submission — `app/api/onboarding/route.ts`,
the Zod schema, the guardrail math — was touched; this is entirely about
how many screens the same fields are spread across and how they're
presented.

- **One question per screen, actually.** `StepSchedule` (days/week +
  session length) and the old `StepBody` (units, DOB, sex, height,
  weight, name — six fields on one screen) each violated this. Split
  into `StepDaysPerWeek`, `StepSessionMinutes`, `StepSex`,
  `StepDateOfBirth`, `StepHeight`, `StepWeight`, `StepName` — one
  question each. The step sequence and its `StepKey` type moved to
  `types.ts` so `OnboardingFlow` and the new review step share one
  source of truth instead of risking drift.
  - **`StepSchedule.tsx` was NOT deleted** — `components/train/
    ProgramWizard.tsx` (the in-app "regenerate program" flow) still
    imports and uses it. Checked with a repo-wide grep before touching
    anything; that file is Phase 7 (interior/training) territory, not
    this phase's. `StepBody.tsx` had zero remaining references after the
    split and was removed.
- **Steppers instead of text boxes** for height and weight — "sliders
  and steppers beat keyboards on mobile." The units toggle now lives on
  the Height screen specifically (the first place units matter) rather
  than a standalone "pick units" screen asked in a vacuum; Weight reads
  `draft.unitSystem` silently afterward — "remembered," not re-asked.
- **A "why" line added** under Experience, Sex, Date of birth, Height,
  Weight, Name — all had none before. Goal/Schedule/Equipment/Activity
  already had one.
- **The missing editable summary** — the flow used to go straight from
  the last input to the server call with zero chance to review. New
  `StepReview.tsx`: every answer, plainly formatted (respecting the
  user's chosen units), each with an "Edit" link that jumps straight
  back to that one step — confirmed live that editing Sex and returning
  forward preserved every other answer, not just that field.
- **Selection color moved from `--color-load-blue` to `--color-action`**
  across `StepGoal`/`StepEquipment`/`StepActivity` and the progress bar
  — same class of fix as Phase 2/3: load-* is RPE/intensity, a plain
  "this option is selected" state is the accent's job.
- **No BMI verdict anywhere, trivially** — traced whether onboarding
  computes or shows one before assuming either way:
  `refuseGoalWeightBelowBmiFloor()` exists in `lib/nutrition/
  guardrails.ts`, but no `goalWeightKg` field exists anywhere in
  `OnboardingDraft`/`OnboardingSchema` — onboarding never collects a goal
  weight at all, so there's nothing to gate or hide here. That guardrail
  is invoked from somewhere else (a later goal-weight edit in Settings,
  outside onboarding's scope).
- **Age-appropriate deficit targets — flagged, not implemented**, per
  the brief's own instruction. Traced precisely, not vaguely: `profiles.
  date_of_birth` is already collected (now via `StepDateOfBirth`), and
  `ageFromDob()` already exists (exported from `lib/schemas/
  onboarding.ts`) but is unused by the targets calculation. The hook
  point is `lib/nutrition/targets.ts`'s `fat_loss` branch (~line 112,
  where `rawDeficit`/`capLossRate` are computed) — that's where an
  age-based cap on deficit percentage would go. Not touched.

Verified live, full run-through: every new step in sequence, unit toggle
on Height carrying through to Weight, Back preserving state, the
Review screen's Edit-jump (tested on Sex) preserving every other
answer, and a real submission through to `TargetsReveal` with real
server-computed numbers (2507 kcal, 127g/342g/70g) — proof the
restructuring didn't disturb the actual calculation path underneath it.
Typecheck, lint, `npm run test:a11y` (all 5), and `npm run check` (all
51 fixture assertions) all pass.

## 14. Phase 7 — interior (home, training, food, habits, progress)

The largest phase — five major sections. Scoped deliberately: fixed every
confirmed, explicit brief violation and wired several already-built
backend features that had no UI calling them yet; did NOT build new
backend features from scratch (those are flagged in §15, not silently
skipped).

**Home**
- **Removed the banned calorie ring.** `EnergyRing` used `ProgressRing` —
  the exact Apple Watch-style pattern the brief rules out for a static
  daily number. Now a plain `<Metric>` + a neutral horizontal bar that
  never changes color based on being over target (it used to go
  `load-yellow` past 100% — the same "over budget as alarm" mistake the
  brief separately warns against). `app/demo/page.tsx` had its own
  hand-duplicated copy of the same ring; fixed by making it import and
  reuse `EnergyRing` instead of re-implementing it — one fewer place for
  the two to drift apart.
- **"One clear next action" was `session={null}`, hardcoded.** Today's
  `NextSessionCard` never showed a real session for any user, ever — the
  page always rendered the "no program" empty state regardless of
  whether one existed. Fixed by reusing the exact "next unstarted
  occurrence" query already proven in `app/(app)/train/page.tsx`, not a
  second version of the same rule. The card's CTA now also starts the
  session directly (`StartSessionButton`, the same one Train uses)
  instead of linking to a list the user still has to act on from.
- **`InsightCard` and `pickInsight()`/`insightMessage()` existed and were
  never called from anywhere.** New `lib/progress/todayInsight.ts`
  assembles the inputs and wires it into Today, reusing the exact pure
  functions the real Progress page already trusts for the same signals
  (`computeDailyRollup`, `proteinSevenDayAverage`, `computeStreaks`,
  `isStreakMilestone`). Scoped deliberately to the protein and
  streak-milestone signals only — see §15 for why PR/plateau wiring was
  cut from this pass, not dropped. Also added the dismiss behavior the
  brief requires and the card never had (`localStorage`, keyed per day).
- **Quick-log shortcut.** New `QuickLog.tsx` — "Log a meal" now
  persistent on Today, not buried inside `RecentMeals`' empty state
  (which disappears the moment one meal exists today — exactly wrong for
  "the third meal of the fourth day," the brief's own example). No
  "Log weight" shortcut added — see §15, there's no weight-logging UI
  anywhere in the app to point it at.
- **`app/(app)/today/loading.tsx`** — new, matches Today's real block
  shape. No other route got a loading.tsx in this pass; flagged in §15.

**Training / in-session**
- **The rest timer was an inline card, not a takeover.** Rewrote
  `RestTimer.tsx` as a fixed, full-viewport overlay (the plan's own
  visual-direction note: "a rest timer overlay floats more than a
  card") — minimal chrome, a much larger `RestRing` (now takes a `size`
  prop instead of a hardcoded 140), the skip button, nothing else.
  `SetRow`/`SessionPlayer` were already close to right — pre-filled
  values (one-tap for the expected case), 56px `Stepper` targets — left
  alone.
- Note on `RestRing`/`ProgressRing` staying as rings: the countdown ring
  is a deliberately different case from the banned calorie ring — a
  continuously depleting arc for a live countdown is functionally
  justified (the brief's own motion section explicitly asks for "rest
  timer counting down as a continuous visual"); a ring standing in for a
  static number is what's actually banned. Don't conflate the two later.
- `PrBadge.tsx` used a `Trophy` icon — explicitly banned ("trophy icons
  for achievements"). Removed; text alone now carries "Personal record,"
  in the accent instead of `load-yellow` (a PR is a highlight, not an
  RPE/intensity signal).

**Food logging** — reviewed in depth, most of this section was already
right: `ItemRow`'s kcal-as-range + confidence `StatusDot` + secondary
macro breakdown, `PortionControl`'s chip-plus-fine-control already avoid
typing-first entry, `MealCard` never color-codes by budget. One real fix:
its swipe-to-delete reveal used `bg-load-red text-ink-primary` — same
class of token misuse as Phase 3's LineChart/Toast bugs (destructive
action, not an RPE signal; text on that fill needs `ink-on-brand`, not
`ink-primary`, for contrast). Fixed to `bg-action-danger text-ink-on-brand`.

**Habits**
- **Edit and archive already existed on the backend
  (`PATCH /api/habits/[id]`, supports name/emoji/cadence/target/
  rest-day/`archived`) and had no UI calling them at all** — only create
  was wired. `HabitsPageClient.tsx` now opens the same `HabitEditor`
  sheet pre-filled for editing, and archiving (`HabitEditor`'s new
  `onArchive`) actually removes the habit. Verified live: created a
  habit, edited it, archived it, watched it disappear and the page fall
  back to the empty state correctly.
- Added `layout` + `AnimatePresence` around the habit-card list — "layout
  transitions when the list changes," which didn't exist (archiving used
  to just abruptly reflow).
- Cadence-selected color fixed from `load-blue` to the accent (same
  plain-selection-state pattern as Phase 6's onboarding chips).
- Reorder (drag-and-drop) NOT built — flagged in §15, needs a small
  schema-touching change (the PATCH route doesn't accept `sortIndex` yet,
  though the column exists), which this pass didn't make unilaterally.

**Progress**
- **`weightTrend()` had zero smoothing** — literally raw daily dots,
  exactly what the brief calls out ("daily fluctuation is noise... must
  show a smoothed trend line"). New `smoothWeightTrend()` in
  `lib/progress/series.ts` (EMA, alpha=0.25) — a pure transform in the
  file that already documents itself as presentation-only, not a new
  business rule.
- **No range switching existed anywhere** — the page always queried a
  fixed 12-week window server-side with no client control at all.
  `WeightTrend` is now a client component with a week/month/all
  `SegmentedControl` that actually re-slices and re-smooths on each
  change (verified live — switching ranges visibly redraws a different
  curve, not the same one clipped). The server query's 12-week floor was
  removed so "All" means all, not "the last 12 weeks re-labeled."
  - Real bug caught here: the first version of this made `WeightTrend`
    `"use client"` while its two Server Component callers kept passing
    the whole `measure` object (from `makeFormatter()`, full of
    closures) as a prop — "functions cannot be passed to Client
    Components," a real runtime error, not a lint warning. Fixed by
    passing `unitSystem` (plain, serializable) instead and calling
    `makeFormatter()` (a pure, universal function) inside the client
    component itself. Caught by actually loading `/demo`, not by
    reading the diff.
- **`ChartShell` (built in Phase 3) had never been used anywhere.**
  Both `WeightTrend` and `E1rmTrend` now use it — consistent framing
  plus the required text alternative for each chart.
- **"Let the user choose the headline metric"** — new
  `HeadlineMetricPicker.tsx`, a client-only (`localStorage`) reorder
  across Weight/Strength/Habits, deliberately not a new profile column —
  reordering which chart leads is presentation, not a data-model change.
  Verified live via the actual DOM order, not just the visual (the
  reorder was real; a habit-less test account made the "Habits" choice
  look broken at a glance since `HabitCompletion` legitimately renders
  `null` for zero habits — confirmed via DOM inspection before
  concluding either way).
- **Early/sparse-data empty state** — the page only ever had one
  all-or-nothing empty state. Added a distinct "still gathering data"
  banner (real signal count under a small threshold, not the true-zero
  case) plus a small honest non-scale-wins line (sessions logged, weeks
  with a habit done) using data already being fetched, not invented.
- `E1rmTrend` already had a real per-exercise selector — effectively
  "personal bests over time" already existed; just wrapped in
  `ChartShell` for the text alternative.

Verified live throughout, not just by reading the diff: `/demo` (which
shares components with Today/Progress and caught the real
`WeightTrend` bug above), a guest account walked through habit
create/edit/archive end-to-end, and the headline-metric reorder
confirmed via direct DOM inspection. Full re-run of typecheck, lint,
`npm run test:a11y` (all 5), and `npm run check` (all 51 fixture
assertions) after every fix.

## 15. Flagged in Phase 7 — real gaps, not silently built or skipped

Per the same rule as the age-appropriate-deficit and goal-weight/BMI
flags earlier: named here rather than either rushed into existence or
quietly left out.

- **No weight-logging UI anywhere in the app.** `body_metrics` is
  read-only from Progress; onboarding writes one starting value and
  nothing since. A real gap, not a styling one — needs a new form + API
  route, out of scope for a presentation-only pass.
- **PR and plateau detection are not wired into Today's insight card.**
  `detectPlateau` needs a per-exercise weekly-best-e1RM aggregation
  across every exercise the user has trained — Progress already does
  this over a 12-week window; duplicating it here with no cache between
  the two pages was cut rather than rushed. `pickInsight` already ranks
  these above protein/streak, so wiring them in later is additive.
- **Habit reorder (drag-and-drop) is not built.** The `PATCH
  /api/habits/[id]` route doesn't accept a `sortIndex` field yet, though
  the column exists and is already used to `ORDER BY`. Extending an
  existing route's schema by one field is small, but it's still a
  logic-adjacent change this pass didn't make unilaterally.
- **Progress photos are not built.** A genuinely new feature (upload,
  storage bucket policy, a private-by-default display) — infrastructure
  work, not a presentation pass.
- **`loading.tsx` was added only for Today**, not Train/Eat/Habits/
  Progress. The pattern is established (see Today's); extending it
  sitewide is mechanical but wasn't done for every route in this pass.

## 16. Phase 8 — audit pass

**Touch targets.** Grepped for every small (`size-6/7/8`) interactive
element site-wide, not just the ones added this project. Two real
violations, both introduced in Phase 7: `RemovableChip`'s × (24px) and
`InsightCard`'s dismiss (32px), both well under the 44px floor. Fixed
with the standard technique — a real 44px (`size-11`) button pulled back
with negative margin so the visible icon stays small and the chip/card
doesn't visually balloon. Also caught two "Edit" text-links (Habits list,
onboarding's `StepReview`) with no explicit tap-height at all — given
`min-h-11` via the same negative-margin technique. Confirmed the fix via
`getBoundingClientRect()` in the browser, not just the class name: 44×48px.

**Keyboard focus.** Tabbed through Habits live — every stop (nav links,
the add-habit `+`, a habit dot, the Edit button) showed a clear Harbor
outline via the global `:focus-visible` rule. No interactive element in
the codebase sets `outline-none` without a substitute (grepped for it —
zero matches).

**Reduced motion — a real, systemic gap, not a one-off.** Grepped every
Motion (`motion.div`/`span`/`path`) usage in the app for real movement
(`layout`, `scale:`, `x:`, `y:`) with no `useReducedMotion()` guard
nearby. Found four, three of them pre-existing (not introduced this
project) and each carrying a comment claiming reduced motion was already
handled globally — which is false for Motion's JS-driven animations
(only CSS transitions/animations get force-collapsed by the global rule
in `globals.css`; this exact gap was first caught in Phase 4's Hero and
clearly hadn't propagated as a lesson through the rest of the codebase
before this audit):
- `CompletedStack.tsx` (session-logged-set collapse, one of the app's
  three official "motion moments") — also animated `height` directly,
  which the brief's own craft rules separately rule out
  ("never width, height, top, left"). `layout`'s FLIP transform already
  produces the same "makes room" effect without it. Fixed both issues.
- `SetRow.tsx` — `layout` gated behind `useReducedMotion()`.
- `HabitDot.tsx` (motion moment #3, the habit-check fill) — same false
  "handled globally" claim, same fix.
- `Button.tsx`'s loading-bar (new this project, Phase 3) — sliding
  position is real movement; swapped to a static bar with an opacity
  pulse under reduced motion (opacity fades stay allowed per the
  brief's own reduced-motion rule).
- Fixed in `HabitsPageClient.tsx`'s new card-list animation
  (Phase 7) at the same time, before it could join this list.

**Text zoom to 200%.** Checked Habits (mixed text/numerals) and Today
(the large hero `Metric`) via `document.body.style.zoom`. No clipping,
no overlap, no horizontal scrollbar (`scrollWidth === clientWidth`
confirmed via JS, not just eyeballed) at either.

**Contrast.** Relied primarily on `npm run test:a11y`'s axe pass across
all five checks (this is exactly the gate that caught two real
regressions earlier in this project — Phase 2's `ink-muted` and Phase
4's animation-timing race) rather than re-deriving every color pair by
hand a second time.

### Self-critique — three things that still looked generic, found and fixed

1. **Middle-dot-joined meta text** (`"5 exercises · ~52 min"`) — one of
   the brief's own explicitly named generic-web-default tells, present
   in 7 files. Fixed the three highest-visibility ones (the landing
   page's `Features`/`ProductPreview` mockups, Today's
   `NextSessionCard`) by writing out the relationship in words instead
   of joining unrelated facts with a dot. **Not fully swept** —
   `ExerciseLibrary.tsx`, `SetRow.tsx`, `CompletedStack.tsx`, and
   `train/page.tsx`'s deload line still have it; named here rather than
   silently left.
2. **ALL-CAPS eyebrow labels above headings** — also explicitly named
   in the brief's ban list, found in `NextSessionCard`, `RecentMeals`,
   and twice in `train/page.tsx` (all four pre-existing, not introduced
   by this project, but never caught until this audit). Fixed all four:
   normal case, weight/color doing the hierarchy work instead of
   letter-case.
3. **Every card on Today reads as visually identical** — the brief's
   other named tell ("identical rounded cards... for every piece of
   content"). All of Today's cards used the same `shadow-raised`
   regardless of importance. Fixed the one place hierarchy actually
   matters most: `NextSessionCard` — literally "the one clear next
   action above everything else" per the brief's own Today priority
   order — now uses `shadow-floating`, visually outranking the passive
   cards below it. **Not a full pass** — Habits/Progress/Train still
   present the same card for every content type; flagged rather than
   quietly claimed as done.

Re-ran typecheck, lint, `npm run test:a11y` (all 5), and `npm run check`
(all 51 fixture assertions) after every fix in this phase — all pass.

## Phase status

- [x] Phase 1 — design plan (approved 2026-09-14)
- [x] Phase 2 — design tokens (`app/globals.css`, `app/layout.tsx`,
      `lib/motion/tokens.ts`)
- [x] Phase 3 — core components (§10 above)
- [x] Phase 4 — landing page (§11 above)
- [x] Phase 5 — auth pages (§12 above)
- [x] Phase 6 — onboarding flow (§13 above)
- [x] Phase 7 — interior (§14 above; flagged gaps in §15)
- [x] Phase 8 — audit pass + self-critique (§16 above)

All eight phases complete. Remaining known gaps are listed in §15 and
§16's self-critique — not hidden, not claimed as done.

## §17 Visual tokens v2 — the Superpower structural reference (2026-09-14)

After Phase 8 shipped, the user supplied the actual style-extraction file
for the reference named in the original brief's §3b ("Superpower",
superpower.com) plus a screen recording of the live site. The Phase 1–8
work had been built from the brief's *prose description* of that
reference, not the real extracted tokens, and diverged from it in three
structural ways the brief explicitly calls out as things to take
verbatim: type weight, shadow depth, and corner geometry. This section is
a token-only revision — no new components, no layout changes, no content
changes — reconciling those three things. The scroll mechanic in the
brief's §5 (pinned hero, detaching capsule nav, numbered chapter
sequence) is explicitly deferred to a separate pass; nothing here builds
it.

**1. Display type — weight 400, tight tracking, sans not serif.**
Fraunces (serif, 500/600) is removed entirely. `--font-display` and
`--font-metric` now both point at Inter Tight (400/500) — the brief's own
named licensed substitute for the reference's proprietary NB
International Pro. Six marketing section headings (`Hero`, `ClosingCta`,
`Features`, `Problem`, `BuiltForEveryAge`, `HowItWorks`, `Faq`,
`ProductPreview`) went from `font-semibold` to `font-normal`: weight 400
at display size is, per the brief, "the single most distinctive thing in
the reference." `Nav.tsx`'s wordmark deliberately stays bold — the brief
allows the brand mark as one of only two places (alongside the accent
color) where the rationing rule doesn't apply.

Body copy is untouched at 17px/1.6 — the brief's own instruction was to
keep the reference's type *treatment* (the tracking mechanic) while
raising its type *size* (the reference ships 15px body, ours stays at
17px). Tracking now follows the reference's table exactly: `-0.025em` at
`--text-metric` (display) down to `-0.005em` at `--text-base` (body),
tightening in one step per scale rung rather than the flat `-0.01em`
Phase 2 used everywhere above body size.

**2. Shadows — flat, not layered.** `--shadow-raised` was a three-layer
stack (contact shadow + wide ambient + inset top highlight) — Phase 2's
own signature "instrument" depth treatment. The reference's brief section
is explicit that this is superseded, not supplemented: "This overrides
the layered-shadow guidance in section 3 — go flat, it suits this system
better." `--shadow-raised` is now the reference's exact value,
`0 2px 2px rgba(0,0,0,0.05)`. `--shadow-floating` keeps a little more
weight than raised (two soft layers, no inset highlight) — not because
cards get elevation back, but because a few surfaces (Sheet, Toast, the
rest-timer full-screen takeover) still need to read as genuinely above
the page rather than sitting flush on it. `Card.tsx` itself needed no
edit — it already read the `shadow-raised` token rather than a hardcoded
value, so the flattening propagated through every card, sheet, and panel
in the app without a per-component change.

**3. Radius — pill buttons, tighter card/chip scale.** Added a new
`--radius-pill: 9999px` token used directly by `Button.tsx` (not through
`--radius-control`) — buttons/CTAs are always a true pill regardless of
what radius inputs or `SegmentedControl` items use, matching the
reference's own split (`buttons: 9999px` vs `cards: 15px` vs
`smallCards: 5px` in the extracted tokens). `--radius-card` moved
20px → 16px (close to the reference's 15px), `--radius-chip` moved
8px → 6px (close to its 5px), `--radius-control` moved 12px → 10px
(inputs/segmented items stay rectangular-ish, not pills — the reference
doesn't specify an input radius, and a pill-shaped text field would read
wrong), `--radius-sheet` moved 28px → 22px to keep the same proportional
gap above the new card value.

**Left unchanged, deliberately:** the Harbor accent (`--color-action`)
and the full Canvas/Paper/Stone palette — the reference's rule that "one
accent color, used only on filled primary buttons and the brand mark"
was already true of Harbor before this pass, so there was nothing to
reconcile there. The `--color-load-*` intensity scale, all motion tokens,
and every piece of copy are untouched.

Verified live in the browser (dev server) on the landing page (Hero
headline, section headings, primary/secondary CTAs) and `/demo` (Today's
card stack, macro bars, pill CTA) after the change — flat cards read
correctly against Canvas, the pill button doesn't collide with its own
label at any size, and Inter Tight's tabular figures render the calorie/
macro numbers cleanly. `npx tsc --noEmit` and `npm run lint` both clean.
The pinned-scroll landing mechanic (brief §5) is the next item, not
started here.

## §18 The pinned chapter sequence (2026-09-14)

Built the brief's §5 signature mechanic: `Nav.tsx` now detaches from a
full-width transparent bar into a centered floating capsule as the page
scrolls (continuous, driven by `useScroll`/`useTransform` off `window`
scroll — not a threshold snap), and `ProductPreview.tsx` was rewritten
entirely into a four-chapter pinned sequence with a numbered index
(01–04), replacing its previous simple fade-in tour.

**Scoped down from the brief's literal mechanic in one place:** the
brief's §5 assumes the hero itself is the thing that gets progressively
covered by a solid section scrolling up over it. This app's hero shipped
as a light, content-first section (the interactive goal-picker), never
the full-bleed dark image the covering effect needs — rebuilding Hero to
match would undo approved, shipped work well outside "add the scroll
mechanic." So the pinned sequence is its own dark section further down
the page, carrying the brief's original "cinematic marketing" language
(§3: near-black surfaces, white type) that Hero itself didn't end up
using. Hero is untouched.

**No real video exists for this app.** Each chapter's "media" is a small
rendered mockup of the actual screen it describes (onboarding goal-pick,
Today, an in-session set with rest timer, the weight trend) — the same
technique `Features.tsx` already uses for its four visuals — floated in
a light card over the dark chapter background, rather than stock footage
or an invented video asset.

**Not built:** a persistent FAQ accordion inside the sequence (the brief
asks for one). The page already has a full FAQ section immediately after
this one; embedding a second, smaller copy of it here would just be
duplicate content for no real benefit, so it was left out rather than
built to satisfy the letter of the brief. Flagging this rather than
silently dropping it.

**A real bug, found only by loading the page:** the capsule nav's outer
`<header>` originally animated its own padding (0 → 12px) to create the
"floating gap," which changed the header's contributed height as the
page scrolled. `position: sticky` reserves flow space equal to the
element's rest-state size; when a sticky element's *own* box keeps
changing size while scrolling, the reserved space and the "stuck" render
size drift apart and page content ends up rendering underneath/behind
the nav instead of below it — the hero's CTA row was visibly overlapping
the nav bar. Fixed by giving the header a constant outer box (fixed
padding, never animated) and moving all the animated width/radius/
opacity onto an inner div instead, which doesn't affect the header's own
contributed height at all.

**A second real bug, in the crossfade math itself:** the first
implementation drove each chapter's opacity from four parallel
`useTransform(scrollYProgress, ...)` calls, one per chapter. Scroll
position updated correctly (verified with a temporary on-screen debug
readout of `scrollYProgress`), but the rendered opacities didn't track
it — chapter 1 stayed at its initial opacity regardless of scroll.
Replaced with a plain derived-state approach instead: one
`useMotionValueEvent` callback computes all four chapters' opacities
from the current scroll fraction via a small `chapterOpacity()` function
and stores them as normal React state, applied as plain inline
`style={{opacity}}`. Simpler, and verified correct at the start, middle,
and end of the sequence.

Verified live at both a forced 1280×900 desktop viewport (pinned
sequence: capsule nav forms correctly, chapters crossfade in the right
order, numbered index tracks the active chapter, first/last chapters
reach full opacity exactly at the sequence's start/end) and the pane's
native ~620px width (stacked fallback: four plain panels, no pinning,
same content and order). The stacked path is also what
`prefers-reduced-motion` renders — not separately screenshotted, since
it's the identical component already verified under the mobile check.
`npm run test:a11y` (all 5) passes after the change.

## §19 The sticky-hero-covered mechanic (2026-09-14)

Completed the brief's §5 mechanic that §18 deliberately deferred: Hero
now stays pinned (`position: sticky; top: 0`) while Problem — the very
next section — scrolls up over it. `Problem.tsx` was given an opaque
`bg-surface-base` (previously it inherited the page background with no
own fill, which happened to be the same color as Hero, so there was
nothing to visually "cover" with) and `relative z-10` so it explicitly
paints in front. Hero itself gets a slight scale-down (1 → 0.96) and
darken (0 → 0.4 opacity black overlay) as it's covered, driven
continuously by scroll position, so it reads as receding rather than
just being clipped off — exactly the brief's own description of the
effect.

**Two more real bugs, both found by reading actual computed styles, not
by eye — the screenshot tool's rendering of this custom-emulated
viewport size turned out to be visually unreliable for wide layouts, so
`getBoundingClientRect()`/`getComputedStyle()` checks were the ground
truth throughout this section, confirmed against a plain narrower
viewport once the numbers checked out:**　

1. Passing a scroll-linked `useTransform` value straight into a
   `motion.div`'s `style` prop *alongside* an `animate` prop targeting a
   different property (`opacity`/`y`) rendered as `transform: none` —
   the value never took effect, even though the source `scrollYProgress`
   was confirmed live via a temporary on-screen debug readout. This is
   the same class of bug as §18's chapter-crossfade issue. Fixed the
   same way: `useMotionValueEvent` computes `scale`/`darken` into plain
   React state, applied via a plain (non-`motion`) wrapping `div`'s
   inline `style` — sidestepping Motion's `style`+`animate` merge
   entirely rather than fighting it.

2. Even after that fix, progress stayed frozen at its initial value.
   Cause: `useScroll({ target })` was pointed at the sticky element
   *itself*. Once a sticky element is pinned, its own
   `getBoundingClientRect()` freezes at its stuck position (`top: 0`)
   and never changes again no matter how far you keep scrolling — so
   scroll progress measured against it plateaus at whatever value it had
   the instant it became stuck. `ProductPreview.tsx`'s chapter sequence
   never hit this because its `ref` was always on the outer, *non*-sticky
   `<section>`, with the sticky positioning one level inside. Fixed Hero
   the same way: the ref moved to a new plain outer wrapper; the
   `sticky` class moved to a plain inner `div` one level down.

Verified via `getBoundingClientRect`/`getComputedStyle` at several
scroll positions (0, mid-recede, fully covered) confirming the recede
transform ramps from `scale(1)`/`opacity 0` to `scale(0.96)`/
`opacity 0.4` and clamps there — plus `npx tsc --noEmit`, `npm run lint`,
and `npm run test:a11y` (all 5) clean after the change.

## §20 Chapter crossfade double-exposure (2026-09-14)

User-reported bug against the live site, screenshotted from real Safari:
at certain scroll positions in the §18 pinned chapter sequence, two
chapters' headline/body text and mockups were both fully legible,
overlapping and unreadable — not a subtle blend, a genuine "double
exposure."

Root cause, found in `chapterOpacity()`: each chapter's fade-out window
sat entirely *after* its own end boundary, and the next chapter's
fade-in window sat entirely *before* that same boundary — two adjacent,
non-overlapping windows either side of the boundary, rather than one
shared window. That meant chapter N's plateau (opacity 1) extended all
the way to the boundary, and chapter N+1's fade-in *also* reached
opacity 1 by that same boundary — both hit full opacity independently,
right where they met, instead of trading off. From the boundary onward
chapter N was fading out `[end, end+fade]` while chapter N+1 sat at a
full, un-fading 1 — an extended stretch where both were highly visible
at once, exactly matching the screenshot.

Rewrote it around a single shared transition window centered on each
boundary (`[boundary-fade, boundary+fade]`), with the two neighbors'
ramps mathematically complementary across it — at any point inside, the
two opacities sum to exactly 1, so neither is ever independently at
"full" while the other is still substantial. Also narrowed `fade` from
0.075 to 0.05 (of a 0.25 chapter width), shortening how long any overlap
lasts at all.

Verified by sampling opacities across a boundary (e.g. at the 01→02
transition: 1.00/0.00 → 0.06/0.94 → 0.00/1.00, strictly monotonic and
summing to 1, never both high) and visually in the browser — one legible
chapter at a time, no overlap. `npx tsc --noEmit`, `npm run lint`, and
`npm run test:a11y` (all 5) clean.

## §21 §20 wasn't enough — the double-exposure was a design problem, not a math bug (2026-09-14)

User re-reported the same glitch against the live site (with a fresh
screenshot) after §20 shipped. Reproduced it directly: scrolled to a
point inside the crossfade window and read the actual opacities — 0.59
and 0.41, summing to exactly 1, confirming §20's fix was mathematically
correct. Screenshotted that exact moment anyway, and it looked just as
broken as before.

The real problem: §20 fixed *the math* but not *the premise*. The
brief's crossfade assumes full-bleed photography or video, where a
60/40 opacity blend of two frames still reads fine. This section's
"media" is dense text and light UI-card mockups — for that content,
*any* significant simultaneous opacity on two chapters reads as noise,
correct math or not. Narrowing the fade window further would only
shrink the odds of a visitor stopping mid-transition, not eliminate the
failure mode.

Replaced the continuous multi-chapter opacity blend with a clean
`AnimatePresence mode="wait"` swap of the whole chapter block (copy +
mockup together), keyed on the same scroll-derived `active` chapter
index used for the numbered index. The outgoing chapter's exit
animation fully finishes before the next one's enter animation starts —
there is no scroll position, including a visitor stopping mid-scroll,
where two chapters' text can be simultaneously legible. Still entirely
scroll-driven (active is derived from `scrollYProgress` on every scroll
frame, runs backwards fine) — just discretized at the point where
"which chapter" flips, rather than blended.

`chapterOpacity()` is gone; nothing else in the file needed to change.
Verified by sampling the DOM at ten scroll offsets spanning all four
chapters (including several deliberately inside the old crossfade
zones) — exactly one chapter's content present at every single one, by
element count, not just by eye. `npx tsc --noEmit`, `npm run lint`, and
`npm run test:a11y` (all 5) clean.

## §22 The whole landing page becomes chapters (2026-09-14)

User liked the pinned-chapter mechanic and asked for the whole site to
be divided into chapters using it, not just the one showcase section.
Clarified scope via a direct question: merge Problem, Features,
HowItWorks, and BuiltForEveryAge into the chapter sequence; leave FAQ
and the closing CTA as normal sections (an accordion and a final CTA
aren't narrative beats a visitor scrolls through passively).

`ProductPreview.tsx` (4 chapters) is replaced by `ChapterSequence.tsx`
(9 chapters), and `Problem.tsx`, `Features.tsx`, `HowItWorks.tsx`, and
`BuiltForEveryAge.tsx` are deleted outright — their content is folded
into the new chapters rather than kept as a second, redundant telling:
Problem (condensed from three paragraphs to one), Onboarding, Today,
Food (from Features' food card), Training, Habits (from Features'
habits card), Progress, an AI note (from Features' AI card), and Built
for every age. `HowItWorks`'s four numbered steps weren't given their
own chapters — their content (start from your numbers, log what you
did, it adjusts next week) was already covered by the merged chapters
above, and repeating it as a tenth chapter would be pure duplication.
900vh of pinned scroll is a real cost of "the whole page becomes
chapters" — flagged, not hidden.

`Nav.tsx`'s four section links (Training/Food/Habits/Progress) used to
be plain `#id` anchors into their own standalone sections. Rewrote them
to compute and scroll to the right slice of the single `#chapters`
pinned section on desktop, falling back to a plain `scrollIntoView` on
the stacked mobile/reduced-motion layout where each chapter is still a
real, individually-`id`'d element.

**Three real bugs, all found by actually clicking things and checking
where they landed, not by reading the diff:**

1. **Duplicate `id="chapters"`.** Both the pinned and stacked wrapper
   sections had it — both branches are always mounted (`hidden`/
   `md:hidden` only toggles CSS display, never unmounts either one), so
   `document.getElementById` resolved ambiguously. Removed the id from
   the stacked wrapper; only individual stacked chapters need their own
   id, and the outer wrapper never did.
2. **Nav's per-anchor links silently did nothing on desktop.**
   `document.getElementById(anchor)` always found the *stacked* variant's
   chapter div (same "always mounted" reason as above), and calling
   `scrollIntoView` on a `display: none` element is a silent no-op.
   Fixed by checking `offsetParent !== null` — null for a hidden element
   and everything inside one — to tell which branch is actually
   rendered, not just present in the DOM.
3. **Nav's computed scroll target landed one chapter later than
   intended.** It divided the section's full height by the chapter count
   to get a per-chapter pixel step. But the actual scroll distance a
   `sticky` child advances over is the section's height *minus the
   viewport height* (`ChapterSequence`'s own `useScroll` uses exactly
   this via its `["start start", "end end"]` offset) — using the full
   height overshoots, compounding across chapters until it's a whole
   chapter off. Clicking "Habits" landed on the Progress chapter until
   this was fixed; verified after by checking all four nav links land on
   their own named chapter, not just that they scroll somewhere.

Also hit a `ReferenceError` from a stale Turbopack HMR cache still
referencing a variable already removed from source (confirmed by
diffing the error against the actual file, which had no such
reference) — resolved with a full dev-server restart and a `.next`
cache clear, not a code change.

Verified: real scroll-wheel input advancing correctly through several
chapters in sequence (not just programmatic jumps, which turned out to
have their own unrelated timing quirks against this large a section);
all four nav links landing on their correctly-named chapter; the mobile
stacked fallback rendering all 9 chapters with working anchor ids;
`npx tsc --noEmit`, `npm run lint`, and `npm run test:a11y` (all 5)
clean.

## §23 Un-merging the opening, and filling the chapters (2026-09-14)

Two follow-up requests after §22 shipped. First: the user wanted the
page's opening back to normal scrolling — Hero, then "Most plans
ignore Tuesday" (Problem), then "What it actually does" (Features) —
with the pinned mechanic only starting after that, not immediately
after Hero. Second: the chapters themselves read as visually empty (a
huge dark panel around one small card) and needed real content.

**Un-merging.** Restored `Problem.tsx` and `Features.tsx` verbatim from
before §22 (`git show` against the commit before they were deleted,
rather than retyping them from memory — this is why their copy is
byte-identical to the original). `ChapterSequence.tsx` drops from nine
chapters to five: onboarding, today, training, progress, every-age.
Food, habits, and the AI note are NOT restored as chapters on top of
being restored as Features cards — they'd be told twice, which is the
exact redundancy problem §22 was trying to avoid in the first place;
they now live only in Features' card grid, same as originally.
Hero's own sticky-cover comment reverts to naming Problem as the thing
that covers it, since Problem is its next sibling again.

Nav's four section links needed a split fix, not a revert: "Food" and
"Habits" go back to being plain anchor jumps (Features' cards have
real ids again), but "Training" and "Progress" now name BOTH a
Features card and a chapter. Features' own ids for those two are
renamed to `training-overview`/`progress-overview` so they don't
collide with the chapter anchors, and Nav's click handler only
overrides the click (computing a chapter scroll target) when the
anchor actually resolves to a chapter — otherwise it lets the default
`href="#food"`/`href="#habits"` jump proceed untouched.

**Filling the chapters.** Three changes, applied to every chapter:
- `PhoneFrame` grew from 280px to a responsive `w-full max-w-[340px]`
  (a fixed 340px overflowed horizontally at 360px viewports — caught
  by `npm run test:a11y`'s horizontal-scroll check, not by eye) and
  gained a small two-dot "device chrome" bar so it reads more like a
  real screen.
- Each mockup gained a second real detail instead of sitting alone in
  its card: onboarding gained a step counter and a second stat plus a
  Continue button; today gained a habit-dot row; training gained a
  "Week 3 · Day 2" header and a struck-through completed-set state;
  progress gained a secondary e1RM/habit-consistency stat row.
- Added `ChapterAtmosphere` (a soft accent-colored glow plus a faint
  grain texture across the whole dark panel) and `ChapterGlow` (a
  tighter glow directly behind each mockup) — a stand-in for the
  full-bleed photography the brief's original mechanic assumes, since
  none exists for this app. Also added short kicker labels ("Onboarding",
  "Today", …) next to each chapter's number, both by the headline and
  in the numbered index rail, giving the number some context instead of
  reading as a bare digit.

Verified: Problem and Features render as normal-scroll sections again
(screenshotted mid-scroll past both); the pinned sequence still starts
correctly right after Features and all five enriched chapters render
without the double-exposure or empty-card issues from §20-22; the
mobile stacked fallback at 360px shows the full-width card with no
clipping; `npx tsc --noEmit`, `npm run lint`, and `npm run test:a11y`
(all 5, including the horizontal-scroll check this section's first
pass broke and then fixed) clean.
