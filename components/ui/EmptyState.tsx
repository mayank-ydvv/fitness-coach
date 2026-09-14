import { cn } from "@/lib/cn";
import type { ReactNode } from "react";
import { IconBadge } from "./IconBadge";

/** Empty states say what to do, per the copy voice: "Nothing logged yet.
 * Photograph your next meal and it'll land here." not "No data." The
 * icon sits in a soft accent-tinted circle (`IconBadge`) rather than a
 * bare muted glyph — the one deliberate bit of visual warmth every
 * empty state across the app now shares. */
export function EmptyState({
  icon,
  line,
  action,
  className,
}: {
  icon?: ReactNode;
  line: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center gap-4 py-8 text-center", className)}>
      {icon ? <IconBadge icon={icon} /> : null}
      <p className="max-w-xs text-sm text-ink-muted">{line}</p>
      {action}
    </div>
  );
}
