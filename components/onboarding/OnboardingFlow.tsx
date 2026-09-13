"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { NutritionTargetsResult } from "@/lib/nutrition/types";
import { EMPTY_DRAFT, type OnboardingDraft } from "./types";
import { StepGoal } from "./StepGoal";
import { StepExperience } from "./StepExperience";
import { StepSchedule } from "./StepSchedule";
import { StepEquipment } from "./StepEquipment";
import { StepLimitations } from "./StepLimitations";
import { StepActivity } from "./StepActivity";
import { StepBody } from "./StepBody";
import { TargetsReveal } from "./TargetsReveal";

const STEPS = ["goal", "experience", "schedule", "equipment", "limitations", "activity", "body"] as const;

function canAdvance(step: (typeof STEPS)[number], draft: OnboardingDraft): boolean {
  switch (step) {
    case "goal":
      return draft.goal !== null;
    case "experience":
      return draft.experienceLevel !== null;
    case "schedule":
      return draft.daysPerWeek > 0 && draft.sessionMinutes > 0;
    case "equipment":
      return draft.equipment.length > 0;
    case "limitations":
      return true;
    case "activity":
      return draft.activityLevel !== null;
    case "body":
      return Boolean(draft.dateOfBirth && draft.sex && draft.heightCm && draft.weightKg);
  }
}

export function OnboardingFlow() {
  const router = useRouter();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<OnboardingDraft>(EMPTY_DRAFT);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targets, setTargets] = useState<NutritionTargetsResult | null>(null);

  const patch = (partial: Partial<OnboardingDraft>) => setDraft((d) => ({ ...d, ...partial }));

  if (targets) {
    return <TargetsReveal targets={targets} onContinue={() => router.push("/today")} />;
  }

  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  async function handleNext() {
    if (!isLast) {
      setStepIndex((i) => i + 1);
      return;
    }
    setSubmitting(true);
    setError(null);
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...draft, timezone, displayName: draft.displayName?.trim() || undefined }),
    });
    setSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Something went wrong. Try again.");
      return;
    }
    const data = await res.json();
    setTargets(data.targets);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-8">
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full bg-load-blue transition-[width] duration-300"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {step === "goal" && <StepGoal draft={draft} patch={patch} />}
      {step === "experience" && <StepExperience draft={draft} patch={patch} />}
      {step === "schedule" && <StepSchedule draft={draft} patch={patch} />}
      {step === "equipment" && <StepEquipment draft={draft} patch={patch} />}
      {step === "limitations" && <StepLimitations draft={draft} patch={patch} />}
      {step === "activity" && <StepActivity draft={draft} patch={patch} />}
      {step === "body" && <StepBody draft={draft} patch={patch} />}

      {error ? <p className="text-sm text-load-red">{error}</p> : null}

      <div className="mt-auto flex gap-3">
        {stepIndex > 0 ? (
          <Button variant="secondary" onClick={() => setStepIndex((i) => i - 1)} disabled={submitting}>
            Back
          </Button>
        ) : null}
        <Button
          className="flex-1"
          size="lg"
          onClick={handleNext}
          disabled={!canAdvance(step, draft) || submitting}
        >
          {isLast ? (submitting ? "Setting up…" : "Finish") : "Next"}
        </Button>
      </div>
    </div>
  );
}
