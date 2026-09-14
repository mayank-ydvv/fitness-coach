"use client";

import * as RadioGroup from "@radix-ui/react-radio-group";
import { cn } from "@/lib/cn";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  "aria-label": ariaLabel,
}: {
  options: { value: T; label: string; sublabel?: string }[];
  value: T | undefined;
  onChange: (value: T) => void;
  "aria-label": string;
}) {
  return (
    <RadioGroup.Root
      value={value}
      onValueChange={(v) => onChange(v as T)}
      aria-label={ariaLabel}
      className="grid auto-cols-fr grid-flow-col gap-1 rounded-control border border-hairline bg-surface-sunken p-1"
    >
      {options.map((opt) => (
        <RadioGroup.Item
          key={opt.value}
          value={opt.value}
          className={cn(
            "flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-[calc(var(--radius-control)-4px)] px-2 py-1.5 text-sm",
            // bg-action, not bg-load-blue: same WCAG AA contrast fix as
            // Button's primary variant — see globals.css. Checked text
            // uses ink-on-brand, not ink-primary, since it sits on that
            // same dark fill.
            "text-ink-muted data-[state=checked]:bg-action data-[state=checked]:text-ink-on-brand",
          )}
        >
          <span className="metric text-base leading-none">{opt.label}</span>
          {opt.sublabel ? <span className="font-ui text-xs opacity-80">{opt.sublabel}</span> : null}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  );
}
