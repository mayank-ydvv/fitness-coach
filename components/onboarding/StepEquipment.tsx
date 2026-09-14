"use client";

import { EQUIPMENT, type Equipment } from "@/lib/types";
import { cn } from "@/lib/cn";
import type { StepProps } from "./types";

export const EQUIPMENT_LABELS: Record<Equipment, string> = {
  barbell: "Barbell",
  dumbbell: "Dumbbell",
  machine: "Machines",
  cable: "Cables",
  bodyweight: "Bodyweight",
  bands: "Bands",
};

export function StepEquipment({ draft, patch }: StepProps) {
  function toggle(item: Equipment) {
    const set = new Set(draft.equipment);
    if (set.has(item)) set.delete(item);
    else set.add(item);
    patch({ equipment: Array.from(set) });
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-medium text-ink-primary">What equipment do you have access to?</h2>
      <p className="text-sm text-ink-muted">Pick everything available — your program only uses these.</p>
      <div className="grid grid-cols-2 gap-2">
        {EQUIPMENT.map((item) => {
          const active = draft.equipment.includes(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => toggle(item)}
              className={cn(
                "min-h-14 rounded-control border px-4 py-3 text-left text-sm font-medium",
                active ? "border-action bg-action/10 text-ink-primary" : "border-hairline bg-surface-sunken text-ink-muted",
              )}
            >
              {EQUIPMENT_LABELS[item]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
