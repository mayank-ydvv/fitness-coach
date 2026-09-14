import { cn } from "@/lib/cn";
import type { HTMLAttributes } from "react";

/**
 * Deliberately does NOT lift or grow its shadow on hover — that pattern
 * (every card lifting on hover) is one of the two clearest "generated
 * page" tells named in the brief, alongside scroll-triggered fade-ups.
 * A card that's genuinely a button/link should show its interactive
 * state some other way (background tint, border), not elevation change.
 */
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-card border border-hairline bg-surface-raised p-5 shadow-raised", className)}
      {...props}
    />
  );
}
