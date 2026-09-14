/**
 * Motion tokens for Motion (motion/react) call sites. Mirrors the
 * --ease-* and --duration-* custom properties in app/globals.css —
 * Motion reads plain numbers/arrays, not CSS custom properties, so the
 * values live twice by necessity. Keep both in sync if either changes;
 * see DESIGN.md §6 for the full motion budget these implement.
 *
 * Durations are in seconds (Motion's unit), not ms.
 */

export const EASE = {
  /** Transitions: panels, route changes, chart redraws. */
  standard: [0.22, 1, 0.36, 1] as const,
  /** Tactile feedback: set complete, habit check — a slight overshoot. */
  spring: [0.34, 1.56, 0.64, 1] as const,
} as const;

export const DURATION = {
  /** 120-200ms band: immediate confirmation (set logged, habit checked). */
  feedback: 0.16,
  /** 250-400ms band: panels, drawers, route transitions, chart redraws. */
  transition: 0.32,
  /** Up to 800ms — the landing-page hero only. Nothing else gets this long. */
  hero: 0.7,
} as const;

/** Stagger between related items revealing together (40-60ms band). */
export const STAGGER = 0.05;
