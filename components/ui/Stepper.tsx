"use client";

import { Minus, Plus } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/cn";

/** −/+ stepper with long-press auto-repeat. 56px targets by default for the
 * session player; pass className to override for tighter contexts. */
export function Stepper({
  value,
  onChange,
  step = 1,
  min,
  max,
  format = (v) => String(v),
  size = "lg",
  className,
}: {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  format?: (value: number) => string;
  size?: "lg" | "md";
  className?: string;
}) {
  const repeatRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clamp = (v: number) => {
    let next = v;
    if (min !== undefined) next = Math.max(min, next);
    if (max !== undefined) next = Math.min(max, next);
    return next;
  };

  const bump = (dir: 1 | -1) => onChange(clamp(Math.round((value + dir * step) * 100) / 100));

  const startRepeat = (dir: 1 | -1) => {
    bump(dir);
    repeatRef.current = setInterval(() => bump(dir), 120);
  };
  const stopRepeat = () => {
    if (repeatRef.current) clearInterval(repeatRef.current);
    repeatRef.current = null;
  };

  const btnSize = size === "lg" ? "size-14" : "size-11"; // 56px / 44px

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <button
        type="button"
        aria-label="Decrease"
        className={cn(btnSize, "flex items-center justify-center rounded-control border border-hairline bg-surface-sunken text-ink-primary")}
        onPointerDown={() => startRepeat(-1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      >
        <Minus size={20} aria-hidden />
      </button>
      <span className="metric min-w-16 text-center text-xl">{format(value)}</span>
      <button
        type="button"
        aria-label="Increase"
        className={cn(btnSize, "flex items-center justify-center rounded-control border border-hairline bg-surface-sunken text-ink-primary")}
        onPointerDown={() => startRepeat(1)}
        onPointerUp={stopRepeat}
        onPointerLeave={stopRepeat}
      >
        <Plus size={20} aria-hidden />
      </button>
    </div>
  );
}
