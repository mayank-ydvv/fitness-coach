import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import { MUSCLE_GROUPS } from "@/lib/training/muscleGroups";
import type { VolumeReport } from "@/lib/training/volume";

/** Weekly sets-per-muscle-group, intensity-coloured, target band shaded,
 * every bar numerically labelled (spec §6 — colour is never the only
 * carrier of meaning). */
export function VolumeBars({ report, band }: { report: VolumeReport; band: { min: number; max: number } }) {
  const maxScale = Math.max(band.max, ...MUSCLE_GROUPS.map((g) => report.credit[g])) * 1.1;
  const bandLeftPct = (band.min / maxScale) * 100;
  const bandWidthPct = ((band.max - band.min) / maxScale) * 100;

  return (
    <Card>
      <p className="mb-3 text-sm font-medium text-ink-primary">Weekly sets per muscle group</p>
      <div className="flex flex-col gap-2">
        {MUSCLE_GROUPS.map((group) => {
          const credit = report.credit[group];
          const trained = credit >= 1;
          const inBand = credit >= band.min && credit <= band.max;
          return (
            <div key={group} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs capitalize text-ink-muted">{group}</span>
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-surface-sunken">
                <div className="absolute inset-y-0 rounded-full bg-load-green-soft" style={{ left: `${bandLeftPct}%`, width: `${bandWidthPct}%` }} />
                <div
                  className={cn("absolute inset-y-0 left-0 rounded-full", !trained ? "bg-hairline" : inBand ? "bg-load-green" : "bg-load-yellow")}
                  style={{ width: `${Math.min(100, (credit / maxScale) * 100)}%` }}
                />
              </div>
              <span className="metric w-8 shrink-0 text-right text-sm text-ink-primary">{credit}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-ink-muted">
        Target band: {band.min}–{band.max} hard sets/week. Groups below 1 set aren&apos;t directly trained this program.
      </p>
    </Card>
  );
}
