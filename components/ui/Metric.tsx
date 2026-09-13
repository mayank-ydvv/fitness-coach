import { cn } from "@/lib/cn";

type MetricSize = "hero" | "xl" | "lg" | "base" | "sm";

const SIZE_CLASS: Record<MetricSize, string> = {
  hero: "text-metric",
  xl: "text-3xl",
  lg: "text-2xl",
  base: "text-xl",
  sm: "text-lg",
};

/**
 * The only component allowed to render a number. `value` is `string | null`
 * — never a raw number — so a call site that forgets to run a value through
 * useMeasure()/makeFormatter() (and therefore forgets "hide calorie
 * numbers") is a type error, not a runtime privacy leak. `null` renders
 * nothing (the hidden-energy case): pair it with a different sibling
 * component, not a blank space — see components/today/EnergyRing.tsx.
 */
export function Metric({
  value,
  unit,
  size = "lg",
  className,
}: {
  value: string | null;
  unit?: string;
  size?: MetricSize;
  className?: string;
}) {
  if (value === null) return null;
  return (
    <span className={cn("metric", SIZE_CLASS[size], "text-ink-primary", className)}>
      {value}
      {unit ? <span className="ml-1 font-ui text-sm font-medium text-ink-muted align-baseline">{unit}</span> : null}
    </span>
  );
}
