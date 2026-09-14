import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

/**
 * "Feels physical": border, background, AND (via Field's group-focus-within)
 * the label all respond together on focus — border shifts to the accent,
 * background lifts from Stone to Paper (the same lightening a real raised
 * surface gets). Invalid state keys off the native `aria-invalid`
 * attribute rather than a separate boolean prop, so a form only has to
 * set one thing and both the visual state and the assistive-tech
 * semantics stay in sync.
 */
export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 rounded-control border border-hairline bg-surface-sunken px-3 text-base text-ink-primary",
        "transition-[border-color,background-color] duration-[var(--duration-feedback)]",
        "placeholder:text-ink-muted",
        // The global :focus-visible ring in globals.css still applies on
        // top of this — border/background carry the "physical" response,
        // the ring carries the WCAG focus-appearance guarantee. Neither
        // replaces the other.
        "focus-visible:border-action focus-visible:bg-surface-raised",
        "aria-[invalid=true]:border-action-danger",
        className,
      )}
      {...props}
    />
  );
}
