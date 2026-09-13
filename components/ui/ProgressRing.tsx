"use client";

import { cn } from "@/lib/cn";

/** SVG ring. `fraction` in [0,1]. `tone` picks the stroke colour from the
 * intensity scale — pass a text label alongside via <Metric>/<StatusDot>,
 * this component carries no text of its own. Animate the `strokeDashoffset`
 * transition only on value change (motion moment #2 for the rest timer) —
 * never on mount. */
export function ProgressRing({
  fraction,
  tone = "load-blue",
  size = 64,
  strokeWidth = 6,
  className,
  children,
}: {
  fraction: number;
  tone?: "load-green" | "load-yellow" | "load-blue" | "load-red";
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(1, Math.max(0, fraction));
  const offset = circumference * (1 - clamped);

  const strokeClass =
    tone === "load-green"
      ? "stroke-load-green"
      : tone === "load-yellow"
        ? "stroke-load-yellow"
        : tone === "load-red"
          ? "stroke-load-red"
          : "stroke-load-blue";

  return (
    <div className={cn("relative inline-grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth} className="fill-none stroke-surface-sunken" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn("fill-none transition-[stroke-dashoffset] duration-300 ease-out", strokeClass)}
        />
      </svg>
      {children ? <div className="absolute inset-0 grid place-items-center">{children}</div> : null}
    </div>
  );
}
