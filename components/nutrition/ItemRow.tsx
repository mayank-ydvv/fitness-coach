"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { StatusDot } from "@/components/ui/StatusDot";
import { Metric } from "@/components/ui/Metric";
import { PortionControl } from "./PortionControl";
import { rescaleItemToGrams, type RescalableItem } from "@/lib/nutrition/rescale";

export type CorrectionItem = RescalableItem & {
  id: string;
  name: string;
  portionDescription: string | null;
  confidence: number | null;
};

const SWIPE_THRESHOLD = 72;

function confidenceTone(confidence: number | null): { tone: "load-green" | "load-yellow" | "load-red"; label: string } {
  if (confidence === null) return { tone: "load-yellow", label: "Manually entered" };
  if (confidence >= 0.8) return { tone: "load-green", label: `${Math.round(confidence * 100)}% confident` };
  if (confidence >= 0.5) return { tone: "load-yellow", label: "Check this one" };
  return { tone: "load-red", label: "Check this one" };
}

export function ItemRow({
  item,
  onChange,
  onDelete,
}: {
  item: CorrectionItem;
  onChange: (next: CorrectionItem) => void;
  onDelete: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const dragging = useRef<{ startX: number } | null>(null);

  // The item exactly as it arrived (the AI's "1 sandwich" estimate, or a
  // previous save) — quantity always scales from this fixed point, never
  // from whatever the current grams happen to be, so tapping +/- repeatedly
  // can't compound rounding drift the way a live multiplier would.
  const [baseline] = useState(item);
  const [quantity, setQuantity] = useState(1);

  const { tone, label } = confidenceTone(item.confidence);
  const hasRange = item.kcalLow !== null && item.kcalHigh !== null;

  function handleQuantity(next: number) {
    setQuantity(next);
    if (baseline.grams) onChange(rescaleItemToGrams(baseline, Math.round(baseline.grams * next)));
  }

  function onPointerDown(e: React.PointerEvent) {
    dragging.current = { startX: e.clientX };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }
  function onPointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    const delta = e.clientX - dragging.current.startX;
    setDragX(Math.min(0, delta));
  }
  function onPointerUp() {
    if (dragX < -SWIPE_THRESHOLD) {
      onDelete();
    }
    setDragX(0);
    dragging.current = null;
  }

  return (
    <div className="relative overflow-hidden rounded-control">
      {/* action-danger (Ember), not load-red — this is a destructive-action
          affordance, not an RPE/intensity signal; ink-on-brand, not
          ink-primary, since it's text on that same solid dark fill. */}
      <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-action-danger text-ink-on-brand">
        <Trash2 size={18} aria-hidden />
      </div>
      <div
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ transform: `translateX(${dragX}px)` }}
        className="relative flex flex-col gap-3 border border-hairline bg-surface-raised p-3 transition-transform"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-ink-primary">{item.name}</p>
            {item.portionDescription ? <p className="text-xs text-ink-muted">{item.portionDescription}</p> : null}
            <StatusDot tone={tone} label={label} className="mt-1" />
          </div>
          <div className="shrink-0 text-right">
            <Metric value={String(item.kcal)} unit="kcal" size="base" />
            {hasRange ? (
              <p className="text-xs text-ink-muted">
                {item.kcalLow}–{item.kcalHigh}
              </p>
            ) : null}
          </div>
        </div>
        <PortionControl
          grams={item.grams}
          quantity={baseline.grams ? quantity : null}
          onQuantity={handleQuantity}
          onGrams={(g) => onChange(rescaleItemToGrams(item, g))}
        />
        <div className="grid grid-cols-3 gap-2 text-center text-xs text-ink-muted">
          <span>{item.proteinG}g protein</span>
          <span>{item.carbsG}g carbs</span>
          <span>{item.fatG}g fat</span>
        </div>
      </div>
    </div>
  );
}
