import { Trophy } from "lucide-react";

/** <Metric> + a text label — colour (the load-yellow tint) is never the
 * only carrier of "this was a PR", the icon+label always are too. */
export function PrBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-load-yellow-soft px-2.5 py-1 text-xs font-medium text-ink-primary">
      <Trophy size={14} className="text-load-yellow" aria-hidden />
      Personal record
    </span>
  );
}
