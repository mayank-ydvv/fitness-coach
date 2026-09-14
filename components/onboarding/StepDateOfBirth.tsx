"use client";

import { Field } from "@/components/ui/Field";
import { TextInput } from "@/components/ui/TextInput";
import type { StepProps } from "./types";

export function StepDateOfBirth({ draft, patch }: StepProps) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-xl font-medium text-ink-primary">When were you born?</h2>
      <p className="text-sm text-ink-muted">Used to calculate your metabolic rate accurately — never shown to anyone else.</p>
      <Field label="Date of birth" htmlFor="dob">
        <TextInput
          id="dob"
          type="date"
          autoComplete="bday"
          value={draft.dateOfBirth}
          onChange={(e) => patch({ dateOfBirth: e.target.value })}
        />
      </Field>
    </div>
  );
}
