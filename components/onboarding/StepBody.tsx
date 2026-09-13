"use client";

import { useState } from "react";
import { SEXES, type Sex } from "@/lib/types";
// The eslint boundary rule exists to stop convert.ts from being used for
// *display* formatting (which must respect unit system + hide-energy via
// useMeasure()). This is bidirectional *input parsing* for a form field —
// there's no formatter equivalent for turning a typed ft/in pair back into
// canonical cm, and neither height nor weight has a hide-energy dimension.
// eslint-disable-next-line no-restricted-imports
import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "@/lib/units/convert";
import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { cn } from "@/lib/cn";
import type { StepProps } from "./types";

const SEX_LABELS: Record<Sex, string> = { male: "Male", female: "Female", unspecified: "Prefer not to say" };

export function StepBody({ draft, patch }: StepProps) {
  // Local draft for the imperial height fields — only cmHeight is the
  // source of truth in `draft`, this just holds the two-input UI state so
  // typing "5" then "'" then "9" doesn't get clobbered by a cm->ft/in
  // round-trip mid-entry.
  const initialFtIn = draft.heightCm ? cmToFtIn(draft.heightCm) : { feet: 5, inches: 8 };
  const [feet, setFeet] = useState(initialFtIn.feet);
  const [inches, setInches] = useState(initialFtIn.inches);

  const isImperial = draft.unitSystem === "imperial";

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-medium text-ink-primary">A bit about you</h2>

      <Field label="Units">
        <div className="inline-flex w-fit rounded-control border border-hairline bg-surface-sunken p-1">
          {(["metric", "imperial"] as const).map((u) => (
            <button
              key={u}
              type="button"
              onClick={() => patch({ unitSystem: u })}
              className={cn(
                "min-h-9 rounded-[calc(var(--radius-control)-4px)] px-3 text-sm font-medium",
                draft.unitSystem === u ? "bg-action text-ink-primary" : "text-ink-muted",
              )}
            >
              {u === "metric" ? "Metric" : "Imperial"}
            </button>
          ))}
        </div>
      </Field>

      <Field label="Date of birth" htmlFor="dob">
        <TextInput
          id="dob"
          type="date"
          value={draft.dateOfBirth}
          onChange={(e) => patch({ dateOfBirth: e.target.value })}
        />
      </Field>

      <Field label="Sex">
        <SegmentedControl
          aria-label="Sex"
          value={draft.sex ?? undefined}
          onChange={(v) => patch({ sex: v })}
          options={SEXES.map((s) => ({ value: s, label: SEX_LABELS[s] }))}
        />
      </Field>

      {isImperial ? (
        <Field label="Height">
          <div className="flex gap-3">
            <NumberInput
              aria-label="Feet"
              value={feet}
              onChange={(e) => {
                const f = Number(e.target.value) || 0;
                setFeet(f);
                patch({ heightCm: ftInToCm(f, inches) });
              }}
              className="w-20"
            />
            <NumberInput
              aria-label="Inches"
              value={inches}
              onChange={(e) => {
                const i = Number(e.target.value) || 0;
                setInches(i);
                patch({ heightCm: ftInToCm(feet, i) });
              }}
              className="w-20"
            />
          </div>
        </Field>
      ) : (
        <Field label="Height (cm)">
          <NumberInput
            value={draft.heightCm ?? ""}
            onChange={(e) => patch({ heightCm: Number(e.target.value) || null })}
          />
        </Field>
      )}

      <Field label={isImperial ? "Weight (lb)" : "Weight (kg)"}>
        <NumberInput
          value={draft.weightKg === null ? "" : isImperial ? Math.round(kgToLb(draft.weightKg) * 10) / 10 : draft.weightKg}
          onChange={(e) => {
            const raw = Number(e.target.value) || 0;
            patch({ weightKg: isImperial ? lbToKg(raw) : raw });
          }}
        />
      </Field>

      <Field label="Name (optional)" htmlFor="displayName">
        <TextInput
          id="displayName"
          value={draft.displayName}
          onChange={(e) => patch({ displayName: e.target.value })}
          placeholder="What should we call you?"
        />
      </Field>
    </div>
  );
}
