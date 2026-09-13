"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { StepGoal } from "@/components/onboarding/StepGoal";
import { StepEquipment } from "@/components/onboarding/StepEquipment";
import { StepSchedule } from "@/components/onboarding/StepSchedule";
import { StepLimitations } from "@/components/onboarding/StepLimitations";
import { EMPTY_DRAFT, type OnboardingDraft } from "@/components/onboarding/types";
import { MedicalDisclaimer } from "./MedicalDisclaimer";
import type { ExperienceLevel } from "@/lib/types";

/**
 * Reuses onboarding's step components (same fields: goal, equipment,
 * schedule, limitations) — this is the same information, asked again only
 * because a program is generated on demand rather than only at signup.
 */
export function ProgramWizard({ initial, experienceLevel }: { initial: Partial<OnboardingDraft>; experienceLevel: ExperienceLevel }) {
  const router = useRouter();
  const { push } = useToast();
  const [draft, setDraft] = useState<OnboardingDraft>({ ...EMPTY_DRAFT, ...initial });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const patch = (partial: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...partial }));
  const steps = ["goal", "schedule", "equipment", "limitations"] as const;

  async function handleSubmit() {
    setSubmitting(true);
    const res = await fetch("/api/program/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        goal: draft.goal,
        experienceLevel,
        daysPerWeek: draft.daysPerWeek,
        sessionMinutes: draft.sessionMinutes,
        equipment: draft.equipment,
        limitations: draft.limitations,
      }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      push(data?.message ?? "Couldn't build your program. Try again.", "danger");
      return;
    }
    router.push("/train");
  }

  const canAdvance =
    (steps[step] === "goal" && draft.goal !== null) ||
    (steps[step] === "schedule" && draft.daysPerWeek > 0) ||
    (steps[step] === "equipment" && draft.equipment.length > 0) ||
    steps[step] === "limitations";

  return (
    <div className="flex flex-col gap-5">
      {steps[step] === "goal" && <StepGoal draft={draft} patch={patch} />}
      {steps[step] === "schedule" && <StepSchedule draft={draft} patch={patch} />}
      {steps[step] === "equipment" && <StepEquipment draft={draft} patch={patch} />}
      {steps[step] === "limitations" && <StepLimitations draft={draft} patch={patch} />}

      <MedicalDisclaimer />

      <div className="flex gap-3">
        {step > 0 ? (
          <Button variant="secondary" onClick={() => setStep((s) => s - 1)} disabled={submitting}>
            Back
          </Button>
        ) : null}
        <Button
          className="flex-1"
          size="lg"
          disabled={!canAdvance || submitting}
          onClick={() => (step === steps.length - 1 ? handleSubmit() : setStep((s) => s + 1))}
        >
          {step === steps.length - 1 ? (submitting ? "Building…" : "Build my program") : "Next"}
        </Button>
      </div>
    </div>
  );
}
