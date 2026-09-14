"use client";

import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import type { StepProps } from "./types";

export function StepName({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-medium text-ink-primary">What should we call you?</h2>
      <p className="text-sm text-ink-muted">Optional — used only inside the app, never shared.</p>
      <Field label="Name (optional)" htmlFor="displayName">
        <TextInput
          id="displayName"
          autoComplete="given-name"
          value={draft.displayName}
          onChange={(e) => patch({ displayName: e.target.value })}
          placeholder="e.g. Alex"
        />
      </Field>
    </div>
  );
}
