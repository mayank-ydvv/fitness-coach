import { cn } from "@/lib/cn";

type LoadToken = "load-green" | "load-yellow" | "load-blue" | "load-red";

const DOT_CLASS: Record<LoadToken, string> = {
  "load-green": "bg-load-green",
  "load-yellow": "bg-load-yellow",
  "load-blue": "bg-load-blue",
  "load-red": "bg-load-red",
};

/**
 * A coloured dot that NEVER stands alone — `label` is required, not
 * optional, and is always rendered as visible text next to the dot (not
 * just an aria-label). This is what makes "colour is never the sole
 * carrier of meaning" (spec §3) hold at the type level instead of relying
 * on every call site remembering it.
 */
export function StatusDot({
  tone,
  label,
  className,
}: {
  tone: LoadToken;
  label: string;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", DOT_CLASS[tone])} />
      <span className="text-sm text-ink-muted">{label}</span>
    </span>
  );
}
