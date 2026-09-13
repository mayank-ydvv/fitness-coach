import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "md" | "lg";

// Plain lookup objects, not cva — better inference, zero dependency.
// primary/danger use --color-action(-danger), not the load-* intensity
// scale — see the comment in globals.css on why those are kept separate
// (an axe-verified WCAG AA contrast fix, not a stylistic choice).
const VARIANT_CLASS: Record<Variant, string> = {
  primary: "bg-action text-ink-primary hover:brightness-110",
  secondary: "bg-surface-raised border border-hairline text-ink-primary hover:border-ink-muted",
  ghost: "text-ink-primary hover:bg-surface-raised",
  danger: "bg-action-danger text-ink-primary hover:brightness-110",
};

const SIZE_CLASS: Record<Size, string> = {
  md: "h-11 px-4 text-sm", // 44px — spec's default minimum touch target
  lg: "h-14 px-6 text-base", // 56px — session player minimum
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors",
        "disabled:opacity-50 disabled:pointer-events-none",
        VARIANT_CLASS[variant],
        SIZE_CLASS[size],
        className,
      )}
      {...props}
    />
  );
}
