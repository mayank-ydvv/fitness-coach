import { Metric } from "@/components/ui/Metric";

export function RepCounter({ count, phase }: { count: number; phase: string }) {
  return (
    <div className="absolute left-4 top-4 rounded-control bg-surface-base/90 px-3 py-2">
      <Metric value={String(count)} size="lg" />
      <p className="text-xs capitalize text-ink-muted">{phase}</p>
    </div>
  );
}
