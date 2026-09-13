import { Metric } from "@/components/ui/Metric";

/** The honest broken-streak copy + restart prompt — never a guilt message
 * (spec §8). */
export function StreakCard({ current, longest }: { current: number; longest: number }) {
  return (
    <div className="flex gap-6">
      <div>
        <Metric value={String(current)} unit="days" size="lg" />
        <p className="text-xs text-ink-muted">Current streak</p>
      </div>
      <div>
        <Metric value={String(longest)} unit="days" size="lg" />
        <p className="text-xs text-ink-muted">Longest</p>
      </div>
      {current === 0 && longest > 0 ? (
        <p className="self-center text-sm text-ink-muted">Streak reset. Log it today to start a new one.</p>
      ) : null}
    </div>
  );
}
