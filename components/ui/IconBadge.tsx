import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Size = "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  md: "size-11",
  lg: "size-14",
};

/**
 * A soft-tinted circle behind a `lucide-react` icon — the one accent
 * colour (Harbor) at 10% instead of flat `text-ink-muted`, used anywhere
 * an icon is the visual anchor of a card (empty states, the next-session
 * prompt). Decorative only — never a stand-in for `StatusDot`'s
 * load-scale meaning, so it always uses `--color-action`, never a
 * load-* token.
 */
export function IconBadge({ icon, size = "lg", className }: { icon: ReactNode; size?: Size; className?: string }) {
  return (
    <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-action/10 text-action", SIZE_CLASS[size], className)}>
      {icon}
    </span>
  );
}
