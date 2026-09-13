"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { usePreferencesControls } from "@/components/prefs/PreferencesProvider";
import { cn } from "@/lib/cn";
import type { UnitSystem } from "@/lib/types";

export function PreferencesPanel({
  initialUnitSystem,
  initialHideEnergy,
}: {
  initialUnitSystem: UnitSystem;
  initialHideEnergy: boolean;
}) {
  const { setUnitSystem, setHideEnergy } = usePreferencesControls();
  const { push } = useToast();
  const [unitSystem, setLocalUnitSystem] = useState(initialUnitSystem);
  const [hideEnergy, setLocalHideEnergy] = useState(initialHideEnergy);
  const [saving, setSaving] = useState(false);

  async function save(next: { unitSystem?: UnitSystem; hideEnergy?: boolean }) {
    setSaving(true);
    // Optimistic — the whole point of this control is that the app reflects
    // it immediately.
    if (next.unitSystem) {
      setLocalUnitSystem(next.unitSystem);
      setUnitSystem(next.unitSystem);
    }
    if (next.hideEnergy !== undefined) {
      setLocalHideEnergy(next.hideEnergy);
      setHideEnergy(next.hideEnergy);
    }
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    setSaving(false);
    if (!res.ok) push("Couldn't save that — try again.", "danger");
  }

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <p className="mb-2 text-sm font-medium text-ink-primary">Units</p>
        <div className="inline-flex rounded-control border border-hairline bg-surface-sunken p-1">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              type="button"
              disabled={saving}
              onClick={() => save({ unitSystem: u })}
              className={cn(
                "min-h-9 rounded-[calc(var(--radius-control)-4px)] px-3 text-sm font-medium",
                unitSystem === u ? "bg-action text-ink-primary" : "text-ink-muted",
              )}
            >
              {u === "metric" ? "Metric" : "Imperial"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-ink-primary">Hide calorie numbers</p>
          <p className="text-sm text-ink-muted">
            Keeps photo logging and macros, removes every kcal display across the app.
          </p>
        </div>
        <Button
          variant={hideEnergy ? "primary" : "secondary"}
          size="md"
          disabled={saving}
          onClick={() => save({ hideEnergy: !hideEnergy })}
        >
          {hideEnergy ? "On" : "Off"}
        </Button>
      </div>
    </Card>
  );
}
