import type { ReactNode } from "react";
import { Card } from "./Card";

/**
 * Consistent framing for every chart in the app (weight trend, e1RM
 * trend, volume bars, habit completion) — title, an optional range
 * control, and a required plain-language text alternative.
 *
 * `summary` is not optional, the same way `StatusDot`'s `label` and
 * `Metric`'s `value` typing aren't — "charts with text alternatives" is
 * a quality-floor requirement, not a nice-to-have, so a chart that
 * forgets one is a type error here rather than a silent a11y gap.
 * Implemented as `role="img"` + `aria-label` on the wrapper, which
 * replaces the chart's own SVG internals in the accessibility tree with
 * one sentence, rather than a screen reader announcing every circle/path.
 */
export function ChartShell({
  title,
  summary,
  rangeControl,
  children,
  className,
}: {
  title: string;
  summary: string;
  rangeControl?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-medium text-ink-primary">{title}</h3>
        {rangeControl}
      </div>
      <div role="img" aria-label={summary} className="w-full">
        {children}
      </div>
    </Card>
  );
}
