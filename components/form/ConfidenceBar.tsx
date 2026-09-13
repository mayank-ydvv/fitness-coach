import { StatusDot } from "@/components/ui/StatusDot";
import { droppedFrameRatio, shouldOfferRerecord } from "@/lib/form/confidence";

/** Frame-drop % with a text label; the re-record CTA at >20% — spec §7's
 * honesty requirement: never report a score built on too little data. */
export function ConfidenceBar({ framesTotal, framesDropped, onRerecord }: { framesTotal: number; framesDropped: number; onRerecord: () => void }) {
  const ratio = droppedFrameRatio(framesTotal, framesDropped);
  const offerRerecord = shouldOfferRerecord(framesTotal, framesDropped);
  const pct = Math.round(ratio * 100);

  return (
    <div className="flex items-center justify-between gap-3 rounded-control border border-hairline bg-surface-sunken p-3">
      <StatusDot tone={offerRerecord ? "load-red" : ratio > 0.1 ? "load-yellow" : "load-green"} label={`${pct}% of frames dropped`} />
      {offerRerecord ? (
        <button type="button" onClick={onRerecord} className="text-sm font-medium text-ink-primary underline underline-offset-2">
          Re-record
        </button>
      ) : null}
    </div>
  );
}
