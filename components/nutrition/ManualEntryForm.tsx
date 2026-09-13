"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";

export type ManualItemDraft = {
  name: string;
  grams: number | null;
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

/** The always-available path — every edge case in M2's correction flow
 * (not-food, rate-limited, low confidence) ends up offering this. */
export function ManualEntryForm({ onSubmit, onCancel }: { onSubmit: (draft: ManualItemDraft) => void; onCancel?: () => void }) {
  const [name, setName] = useState("");
  const [grams, setGrams] = useState("");
  const [kcal, setKcal] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");

  const valid = name.trim().length > 0 && Number(kcal) > 0;

  return (
    <div className="flex flex-col gap-3">
      <Field label="Food" htmlFor="manual-name">
        <TextInput id="manual-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Grilled chicken breast" />
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Grams (optional)" htmlFor="manual-grams">
          <NumberInput id="manual-grams" value={grams} onChange={(e) => setGrams(e.target.value)} />
        </Field>
        <Field label="Calories" htmlFor="manual-kcal">
          <NumberInput id="manual-kcal" value={kcal} onChange={(e) => setKcal(e.target.value)} />
        </Field>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Field label="Protein (g)" htmlFor="manual-protein">
          <NumberInput id="manual-protein" value={protein} onChange={(e) => setProtein(e.target.value)} />
        </Field>
        <Field label="Carbs (g)" htmlFor="manual-carbs">
          <NumberInput id="manual-carbs" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
        </Field>
        <Field label="Fat (g)" htmlFor="manual-fat">
          <NumberInput id="manual-fat" value={fat} onChange={(e) => setFat(e.target.value)} />
        </Field>
      </div>
      <div className="flex gap-2">
        {onCancel ? (
          <Button variant="secondary" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        ) : null}
        <Button
          disabled={!valid}
          className="flex-1"
          onClick={() =>
            onSubmit({
              name: name.trim(),
              grams: grams ? Number(grams) : null,
              kcal: Number(kcal),
              proteinG: Number(protein) || 0,
              carbsG: Number(carbs) || 0,
              fatG: Number(fat) || 0,
            })
          }
        >
          Add
        </Button>
      </div>
    </div>
  );
}
