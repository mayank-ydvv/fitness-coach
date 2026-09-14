"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CHAPTER_COUNT, chapterIndexForAnchor } from "./ChapterSequence";

const ANCHORS = [
  { anchor: "training", label: "Training" },
  { anchor: "food", label: "Food" },
  { anchor: "habits", label: "Habits" },
  { anchor: "progress", label: "Progress" },
];

/**
 * The four chapters these nav links used to jump straight to (via a
 * plain `#id` anchor on their own section) now live inside
 * ChapterSequence's single pinned `#chapters` section, where only the
 * active chapter is actually mounted at any moment (see
 * ChapterSequence.tsx) — a plain hash link would only work on whichever
 * chapter happens to be mounted already. On the pinned (desktop) layout
 * this computes and scrolls to that chapter's slice of the section's
 * total scroll distance instead; on the stacked mobile/reduced-motion
 * fallback, every chapter is its own real element with its own id, so a
 * plain scrollIntoView already works.
 *
 * Both the pinned and stacked trees are always mounted — the `hidden`/
 * `md:hidden` classes that pick between them only toggle CSS display,
 * they don't unmount either branch — so `getElementById(anchor)` finds
 * the stacked chapter's div even on desktop, where it's
 * `display: none` and `scrollIntoView` on it silently does nothing
 * (found by actually clicking the link, not by reading the diff — it
 * looked correct until tried). Checking `offsetParent !== null` (null
 * for a `display: none` element and everything inside one) is what
 * actually distinguishes "this branch is the one currently rendered."
 *
 * Only "training" and "progress" resolve to a chapter (see §23 in
 * DESIGN.md — food/habits moved back to Features' own card grid, each
 * a real element with a real id, so a plain browser anchor jump is
 * enough for those two and this function is never even called for
 * them — see the `isChapterLink` check at the call site).
 */
function scrollToChapter(anchor: string) {
  const index = chapterIndexForAnchor(anchor);
  if (index < 0) return;

  const stackedEl = document.getElementById(anchor);
  if (stackedEl && stackedEl.offsetParent !== null) {
    stackedEl.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const chaptersEl = document.getElementById("chapters");
  if (!chaptersEl) return;
  const rect = chaptersEl.getBoundingClientRect();
  const top = rect.top + window.scrollY;
  // The scroll distance that actually maps to progress 0→1 is the
  // section's height MINUS the viewport height (a `sticky` child stops
  // advancing once its own bottom reaches the viewport bottom — the
  // same "end end" offset ChapterSequence's own useScroll uses) — not
  // the section's full height. Using the full height here overshoots
  // by one viewport's worth spread across all chapters, landing one
  // chapter past the intended one (found by actually clicking the
  // link and checking which chapter it landed on, not by the math
  // looking right on paper).
  const span = chaptersEl.offsetHeight - window.innerHeight;
  const step = span / CHAPTER_COUNT();
  window.scrollTo({ top: top + step * (index + 0.5), behavior: "smooth" });
}

/**
 * Detaches from a full-width transparent bar into a centered floating
 * capsule as the page scrolls past the hero — the brief's §5 "nav that
 * detaches". Driven directly by scroll position (via `useScroll`), not a
 * one-shot trigger, so it interpolates smoothly in both directions
 * rather than snapping at a threshold.
 *
 * Under `prefers-reduced-motion`, the smooth width/radius/margin morph is
 * skipped — that's real movement, not just an opacity fade — in favor of
 * the simple two-state background/shadow swap this component had before
 * (still driven by scroll, but with no interpolated motion).
 */
export function Nav() {
  const reduceMotion = useReducedMotion();
  const { scrollY } = useScroll();
  // A fixed 160px scroll distance, not hero height — the capsule always
  // finishes forming at the same scroll distance regardless of how tall
  // the hero renders at a given breakpoint.
  const progress = useTransform(scrollY, [0, 160], [0, 1], { clamp: true });

  const capsuleMaxWidth = useTransform(progress, [0, 1], [1024, 760]); // px
  const capsuleRadius = useTransform(progress, [0, 1], [0, 9999]); // px

  // Hero is now a dark full-bleed photo (see Hero.tsx), so the nav
  // needs light text while it's still the transparent bar over that
  // image, switching to dark text once the opaque capsule has formed —
  // otherwise the brand/section links are unreadable against the photo,
  // or dark-on-dark once the capsule is up. Same threshold as the
  // capsule's own formation (`progress`), just read as a plain boolean
  // via `useMotionValueEvent` rather than fed into `style` — see
  // DESIGN.md §19/§21 for why a scroll-linked value doesn't reliably
  // drive `style` here, and derived state does.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    if (!reduceMotion) return;
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [reduceMotion]);

  const [formed, setFormed] = useState(false);
  useMotionValueEvent(progress, "change", (v) => setFormed(v > 0.5));

  if (reduceMotion) {
    return (
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-30 transition-[background-color,box-shadow] duration-[var(--duration-transition)]",
          scrolled ? "bg-surface-raised/95 shadow-raised backdrop-blur-sm" : "bg-transparent",
        )}
      >
        <NavContent light={!scrolled} />
      </header>
    );
  }

  // `fixed`, not `sticky` — Hero is now a full-bleed photo (see
  // Hero.tsx) that should extend under the nav from the very top of the
  // page. A `sticky` nav reserves its own height in normal document
  // flow, which pushes Hero's image start down below that reserved
  // strip — the nav then sits on the plain page background for that
  // first stretch, not on the photo, so light nav text is unreadable
  // there until scrolled (found by loading the page, not by reading the
  // diff). `fixed` removes the nav from flow entirely, so Hero starts
  // at the true top and the photo is visible behind the nav immediately.
  // The header's own box is still a constant size regardless of scroll —
  // only the inner capsule's width/radius/opacity animate — for the
  // same reason as before (a `fixed` element doesn't reserve flow space
  // either way, but an animated own-size would still desync visually
  // from the capsule's morph).
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex justify-center px-3 py-3">
      <motion.div style={{ maxWidth: capsuleMaxWidth }} className="relative w-full">
        <motion.div
          style={{ borderRadius: capsuleRadius, opacity: progress }}
          className="pointer-events-none absolute inset-0 border border-hairline bg-surface-raised/95 shadow-floating backdrop-blur-sm"
          aria-hidden
        />
        <div className="relative">
          <NavContent light={!formed} />
        </div>
      </motion.div>
    </header>
  );
}

function NavContent({ light }: { light: boolean }) {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <Link
        href="#top"
        className={cn("font-display text-lg font-semibold", light ? "text-ink-on-brand" : "text-ink-primary")}
      >
        AI Fitness Coach
      </Link>
      <nav aria-label="Section" className="hidden items-center gap-6 md:flex">
        {ANCHORS.map((a) => (
          <a
            key={a.anchor}
            href={`#${a.anchor}`}
            onClick={(e) => {
              // Food/Habits aren't chapters (see scrollToChapter's
              // comment) — leave those as a plain anchor jump to their
              // real element in Features; only override the ones that
              // resolve to a pinned chapter.
              if (chapterIndexForAnchor(a.anchor) < 0) return;
              e.preventDefault();
              scrollToChapter(a.anchor);
            }}
            className={cn(
              "text-sm font-medium",
              light ? "text-ink-on-brand/80 hover:text-ink-on-brand" : "text-ink-muted hover:text-ink-primary",
            )}
          >
            {a.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className={cn(
            "text-sm font-medium underline-offset-2 hover:underline",
            light ? "text-ink-on-brand" : "text-ink-primary",
          )}
        >
          Log in
        </Link>
        <Link href="/login">
          <Button size="md">Create account</Button>
        </Link>
      </div>
    </div>
  );
}
