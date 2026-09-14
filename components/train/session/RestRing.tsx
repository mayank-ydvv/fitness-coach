import { ProgressRing } from "@/components/ui/ProgressRing";
import { Metric } from "@/components/ui/Metric";

/** Motion moment #2: the ring drains, switching --load-blue -> --load-green
 * at 10s remaining, via ProgressRing's built-in stroke transition. This IS
 * the one intentional ring pattern in the app — a depleting countdown arc
 * is functionally justified (continuous, at-a-glance time remaining), not
 * a decorative progress metaphor for a static number like the calorie
 * ring the brief rules out. `size` defaults to the small inline usage;
 * the full-screen RestTimer overlay passes a much larger one. */
export function RestRing({
  remainingSeconds,
  fraction,
  overdueSeconds,
  size = 140,
}: {
  remainingSeconds: number;
  fraction: number;
  overdueSeconds: number;
  size?: number;
}) {
  const tone = overdueSeconds > 0 ? "load-yellow" : remainingSeconds <= 10 ? "load-green" : "load-blue";
  return (
    <ProgressRing fraction={fraction} tone={tone} size={size} strokeWidth={size >= 200 ? 14 : 10}>
      {overdueSeconds > 0 ? (
        <div className="text-center">
          <p className="text-sm text-ink-muted">Rest was up</p>
          <Metric value={`${overdueSeconds}s`} size={size >= 200 ? "hero" : "lg"} />
          <p className="text-sm text-ink-muted">ago</p>
        </div>
      ) : (
        <Metric value={String(remainingSeconds)} unit="sec" size={size >= 200 ? "hero" : "xl"} />
      )}
    </ProgressRing>
  );
}
