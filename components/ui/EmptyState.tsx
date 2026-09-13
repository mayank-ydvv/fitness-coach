import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/** Empty states say what to do, per the copy voice: "Nothing logged yet.
 * Photograph your next meal and it'll land here." not "No data." */
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
    <div className={cn("flex flex-col items-center gap-3 py-10 text-center", className)}>
      {icon ? <div className="text-ink-muted">{icon}</div> : null}
      <p className="text-sm text-ink-muted">{line}</p>
      {action}
    </div>
  );
}
