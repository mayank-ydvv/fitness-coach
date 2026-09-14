"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const ANCHORS = [
  { href: "#training", label: "Training" },
  { href: "#food", label: "Food" },
  { href: "#habits", label: "Habits" },
  { href: "#progress", label: "Progress" },
];

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

  if (reduceMotion) {
    return (
      <header
        className={cn(
          "sticky top-0 z-30 transition-[background-color,box-shadow] duration-[var(--duration-transition)]",
          scrolled ? "bg-surface-raised/95 shadow-raised backdrop-blur-sm" : "bg-transparent",
        )}
      >
        <NavContent />
      </header>
    );
  }

  // The header's own box is a constant size regardless of scroll — only
  // the inner capsule's width/radius/opacity animate. Position:sticky
  // only reserves flow space equal to the header's size at rest; letting
  // that size itself change with scroll desyncs the reserved space from
  // the stuck size and the page content ends up overlapping the nav
  // (found by actually loading the page, not by reading the diff).
  return (
    <header className="sticky top-0 z-30 flex justify-center px-3 py-3">
      <motion.div style={{ maxWidth: capsuleMaxWidth }} className="relative w-full">
        <motion.div
          style={{ borderRadius: capsuleRadius, opacity: progress }}
          className="pointer-events-none absolute inset-0 border border-hairline bg-surface-raised/95 shadow-floating backdrop-blur-sm"
          aria-hidden
        />
        <div className="relative">
          <NavContent />
        </div>
      </motion.div>
    </header>
  );
}

function NavContent() {
  return (
    <div className="flex items-center justify-between px-5 py-4">
      <Link href="#top" className="font-display text-lg font-semibold text-ink-primary">
        AI Fitness Coach
      </Link>
      <nav aria-label="Section" className="hidden items-center gap-6 md:flex">
        {ANCHORS.map((a) => (
          <a key={a.href} href={a.href} className="text-sm font-medium text-ink-muted hover:text-ink-primary">
            {a.label}
          </a>
        ))}
      </nav>
      <div className="flex items-center gap-3">
        <Link href="/login" className="text-sm font-medium text-ink-primary underline-offset-2 hover:underline">
          Log in
        </Link>
        <Link href="/login">
          <Button size="md">Create account</Button>
        </Link>
      </div>
    </div>
  );
}
