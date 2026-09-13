"use client";

import { useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { StatusDot } from "@/components/ui/StatusDot";
import { Metric } from "@/components/ui/Metric";
import { PortionControl } from "./PortionControl";
import { rescaleItemByMultiplier, rescaleItemToGrams, type RescalableItem } from "@/lib/nutrition/rescale";

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

  const { tone, label } = confidenceTone(item.confidence);
  const hasRange = item.kcalLow !== null && item.kcalHigh !== null;

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
      <div className="absolute inset-y-0 right-0 flex w-20 items-center justify-center bg-load-red text-ink-primary">
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
          onMultiplier={(m) => onChange(rescaleItemByMultiplier(item, m))}
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
