import { cn } from "@/lib/cn";

/** A pulse, not a shimmer sweep — deliberately understated so it doesn't
 * read as an entrance animation (spec: "no entrance animations on page
 * load"). Respects prefers-reduced-motion via the global rule in globals.css. */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-control bg-surface-sunken", className)} />;
}
