"use client";

import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { NumberInput } from "@/components/ui/NumberInput";
import { Field } from "@/components/ui/Field";
import { platesPerSide } from "@/lib/training/plates";

export function PlateCalculatorSheet({ open, onOpenChange, targetKg }: { open: boolean; onOpenChange: (open: boolean) => void; targetKg: number }) {
  const [barKg, setBarKg] = useState(20);
  const result = platesPerSide(targetKg, barKg);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Plate calculator">
      <div className="flex flex-col gap-4">
        <Field label="Bar weight (kg)">
          <NumberInput value={barKg} onChange={(e) => setBarKg(Number(e.target.value) || 0)} />
        </Field>
        <div className="rounded-control bg-surface-sunken p-4 text-center">
          <p className="text-sm text-ink-muted">Per side</p>
          <p className="metric text-2xl text-ink-primary">
            {result.perSide.length > 0 ? result.perSide.join(" + ") : "—"}
          </p>
          {!result.exact ? (
            <p className="mt-1 text-xs text-ink-muted">Closest is {result.achievedKg} kg — can&apos;t hit {targetKg} kg exactly with these plates.</p>
          ) : null}
        </div>
      </div>
    </Sheet>
  );
}
