"use client";

import { Plus } from "lucide-react";
import { cn } from "@/lib/cn";

export function ManualItemRow({ onClick, className }: { onClick: () => void; className?: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-11 items-center justify-center gap-2 rounded-control border border-dashed border-hairline text-sm font-medium text-ink-muted hover:text-ink-primary",
        className,
      )}
    >
      <Plus size={16} aria-hidden />
      Add item
    </button>
  );
}
