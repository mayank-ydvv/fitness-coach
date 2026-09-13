import { cn } from "@/lib/cn";

type MacroBar = { label: string; valueLabel: string; fraction: number };

/** Protein gets visual priority (listed first, drawn first) — spec §5:
 * "the number that matters most for both listed goals." */
export function MacroBars({ protein, carbs, fat }: { protein: MacroBar; carbs: MacroBar; fat: MacroBar }) {
  return (
    <div className="flex flex-col gap-3">
      {[protein, carbs, fat].map((m) => (
        <div key={m.label}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="text-ink-primary">{m.label}</span>
            <span className="text-ink-muted">{m.valueLabel}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
            <div
              className={cn("h-full rounded-full", m.fraction > 1 ? "bg-load-yellow" : "bg-load-blue")}
              style={{ width: `${Math.min(m.fraction, 1) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
