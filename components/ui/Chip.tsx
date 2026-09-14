"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { ButtonHTMLAttributes } from "react";

const CHIP_CLASS =
  "inline-flex min-h-11 items-center gap-1.5 rounded-chip px-3.5 text-sm font-medium transition-colors duration-[var(--duration-feedback)]";

/**
 * Smallest radius tier (`--radius-chip`) — the point of the radius scale
 * is that a chip and a card should never look like the same kind of
 * object. Selected state uses the one accent (Harbor); unselected sits
 * on Stone so a row of chips reads as a set of options, not a wall of
 * cards. Meets the 44px touch-target floor even though chips read
 * visually compact — the tap target is taller than the visible pill via
 * padding, not by inflating the pill itself.
 *
 * A toggle chip (`selected`) and a removable chip (`onRemove`) are kept
 * as separate render paths rather than one combined element: nesting a
 * remove button inside the chip's own `<button>` would put an
 * interactive element inside another interactive element, which is
 * invalid HTML and breaks keyboard/screen-reader operation of the inner
 * control.
 */
export function Chip({
  selected = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        CHIP_CLASS,
        selected
          ? "bg-action text-ink-on-brand"
          : "border border-hairline bg-surface-sunken text-ink-primary hover:border-ink-muted",
        className,
      )}
      {...props}
    />
  );
}

/** A removable tag — e.g. an applied filter. Not a toggle; the label is
 * static text and only the "×" is interactive, so it never collides with
 * the invalid-nested-button problem `Chip` itself avoids. */
export function RemovableChip({
  onRemove,
  className,
  children,
}: {
  onRemove: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span className={cn(CHIP_CLASS, "border border-hairline bg-surface-sunken pr-2 text-ink-primary", className)}>
      {children}
      {/* size-11 (44px) is the real tap target — -m-2.5 pulls the excess
          back in via negative margin so the chip itself doesn't visually
          balloon to fit it. The visible circle stays small; the tappable
          area doesn't. */}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Remove"
        className="-m-2.5 flex size-11 items-center justify-center rounded-full text-ink-muted hover:bg-black/10 hover:text-ink-primary"
      >
        <X size={13} aria-hidden />
      </button>
    </span>
  );
}
