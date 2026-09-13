"use client";

import { useState } from "react";
import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/Button";
import { HABIT_CADENCES } from "@/lib/types";

export type HabitDraft = { name: string; emoji: string; cadence: "daily" | "weekly"; targetPerWeek: number; restDayEnabled: boolean };

export function HabitEditor({ initial, onSubmit, onCancel }: { initial?: Partial<HabitDraft>; onSubmit: (draft: HabitDraft) => void; onCancel?: () => void }) {
  const [name, setName] = useState(initial?.name ?? "");
  const [emoji, setEmoji] = useState(initial?.emoji ?? "");
  const [cadence, setCadence] = useState<"daily" | "weekly">(initial?.cadence ?? "daily");
  const [targetPerWeek, setTargetPerWeek] = useState(initial?.targetPerWeek ?? 7);
  const [restDayEnabled, setRestDayEnabled] = useState(initial?.restDayEnabled ?? true);

  return (
    <div className="flex flex-col gap-3">
      <Field label="Name" htmlFor="habit-name">
        <TextInput id="habit-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Train" />
      </Field>
      <Field label="Emoji (optional)" htmlFor="habit-emoji">
        <TextInput id="habit-emoji" value={emoji} onChange={(e) => setEmoji(e.target.value)} placeholder="💪" maxLength={4} />
      </Field>
      <div className="flex gap-2">
        {HABIT_CADENCES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCadence(c)}
            className={
              "min-h-9 flex-1 rounded-control border px-3 text-sm capitalize " +
              (cadence === c ? "border-load-blue bg-load-blue-soft text-ink-primary" : "border-hairline text-ink-muted")
            }
          >
            {c}
          </button>
        ))}
      </div>
      <Field label="Target per week" htmlFor="habit-target">
        <NumberInput id="habit-target" value={targetPerWeek} onChange={(e) => setTargetPerWeek(Number(e.target.value) || 1)} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-primary">
        <input type="checkbox" checked={restDayEnabled} onChange={(e) => setRestDayEnabled(e.target.checked)} />
        Allow one rest day per week without breaking the streak
      </label>
      <div className="flex gap-2">
        {onCancel ? (
          <Button variant="secondary" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button
          className="flex-1"
          disabled={!name.trim()}
          onClick={() => onSubmit({ name: name.trim(), emoji, cadence, targetPerWeek, restDayEnabled })}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
