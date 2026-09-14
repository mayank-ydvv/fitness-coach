"use client";

import { cn } from "@/lib/cn";
import { motion, useReducedMotion } from "motion/react";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

// Plain lookup objects, not cva — better inference, zero dependency.
// primary/danger use --color-action(-danger), not the load-* intensity
// scale — see the comment in globals.css on why those are kept separate
// (an axe-verified WCAG AA contrast fix, not a stylistic choice).
const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-action text-ink-on-brand hover:brightness-110",
  secondary: "bg-surface-raised border border-hairline text-ink-primary hover:border-ink-muted",
  ghost: "text-ink-primary hover:bg-surface-sunken",
  danger: "bg-action-danger text-ink-on-brand hover:brightness-110",
};

const SIZE_CLASS: Record<Size, string> = {
  md: "h-11 px-4 text-sm", // 44px — spec's default minimum touch target
  lg: "h-14 px-6 text-base", // 56px — session player minimum
};

/**
 * `loading` shows progress IN the button — a thin indeterminate bar along
 * the bottom edge — rather than swapping the label for a bare spinner
 * (see DESIGN.md §Phase 3 / the brief's auth-form note). The label stays
 * visible so the button still reads as "doing the thing you asked," not
 * "frozen." Uses `motion/react` with transform-only animation, looping
 * only while an operation is genuinely in flight — not idle ambient motion.
 */
export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; loading?: boolean }) {
  const reduceMotion = useReducedMotion();
  return (
    <button
      aria-busy={loading || undefined}
      disabled={disabled || loading}
      className={cn(
        "relative isolate inline-flex items-center justify-center gap-2 overflow-hidden rounded-control font-medium",
        "transition-[filter,border-color,background-color] duration-[var(--duration-feedback)]",
        "active:scale-[0.98]",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    >
      <span className={cn(loading && "opacity-90")}>{children}</span>
      {loading ? (
        <span className="absolute inset-x-0 bottom-0 h-[2px] overflow-hidden bg-black/10">
          {/* Sliding position is real movement — under reduced motion,
              swap to a static bar with an opacity pulse instead. A
              looping fade is still "movement while resting" in spirit,
              but this only ever plays while a real operation is
              in-flight, the same justification as the rest-timer ring. */}
          <motion.span
            className="block h-full w-2/5 rounded-full bg-current"
            animate={reduceMotion ? { opacity: [1, 0.4, 1] } : { x: ["-40%", "140%"] }}
            transition={{ duration: reduceMotion ? 1.4 : 1.1, repeat: Infinity, ease: reduceMotion ? "easeInOut" : "linear" }}
          />
        </span>
      ) : null}
    </button>
  );
}
