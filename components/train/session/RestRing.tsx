import { ProgressRing } from "@/components/ui/ProgressRing";
import { Metric } from "@/components/ui/Metric";

/** Motion moment #2: the ring drains, switching --load-blue -> --load-green
 * at 10s remaining, via ProgressRing's built-in stroke transition. */
export function RestRing({ remainingSeconds, fraction, overdueSeconds }: { remainingSeconds: number; fraction: number; overdueSeconds: number }) {
  const tone = overdueSeconds > 0 ? "load-yellow" : remainingSeconds <= 10 ? "load-green" : "load-blue";
  return (
    <ProgressRing fraction={fraction} tone={tone} size={140} strokeWidth={10}>
      {overdueSeconds > 0 ? (
        <div className="text-center">
          <p className="text-xs text-ink-muted">Rest was up</p>
          <Metric value={`${overdueSeconds}s`} size="lg" />
          <p className="text-xs text-ink-muted">ago</p>
        </div>
      ) : (
        <Metric value={String(remainingSeconds)} unit="sec" size="xl" />
      )}
    </ProgressRing>
  );
}
