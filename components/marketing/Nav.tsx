"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

const ANCHORS = [
  { href: "#training", label: "Training" },
  { href: "#food", label: "Food" },
  { href: "#habits", label: "Habits" },
  { href: "#progress", label: "Progress" },
];

/** Persistent chrome, not a content reveal — picks up a Paper background
 * and shadow once the page has scrolled past the hero, so long pages
 * don't lose their nav to the same background it started on. This is
 * distinct from (and not a violation of) the "no fading/sliding sections
 * on scroll" rule, which is about content reveals, not nav chrome. */
export function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 24);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-30 transition-[background-color,box-shadow] duration-[var(--duration-transition)]",
        scrolled ? "bg-surface-raised/95 shadow-raised backdrop-blur-sm" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
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
    </header>
  );
}
