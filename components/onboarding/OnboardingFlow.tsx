"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { NutritionTargetsResult } from "@/lib/nutrition/types";
import { EMPTY_DRAFT, STEPS, type OnboardingDraft, type StepKey } from "./types";
import { StepGoal } from "./StepGoal";
import { StepExperience } from "./StepExperience";
import { StepDaysPerWeek } from "./StepDaysPerWeek";
import { StepSessionMinutes } from "./StepSessionMinutes";
import { StepEquipment } from "./StepEquipment";
import { StepLimitations } from "./StepLimitations";
import { StepActivity } from "./StepActivity";
import { StepSex } from "./StepSex";
import { StepDateOfBirth } from "./StepDateOfBirth";
import { StepHeight } from "./StepHeight";
import { StepWeight } from "./StepWeight";
import { StepName } from "./StepName";
import { StepReview } from "./StepReview";
import { TargetsReveal } from "./TargetsReveal";

function canAdvance(step: StepKey, draft: OnboardingDraft): boolean {
  switch (step) {
    case "goal":
      return draft.goal !== null;
    case "experience":
      return draft.experienceLevel !== null;
    case "daysPerWeek":
      return draft.daysPerWeek > 0;
    case "sessionMinutes":
      return draft.sessionMinutes > 0;
    case "equipment":
      return draft.equipment.length > 0;
    case "limitations":
      return true;
    case "activity":
      return draft.activityLevel !== null;
    case "sex":
      return draft.sex !== null;
    case "dateOfBirth":
      return Boolean(draft.dateOfBirth);
    case "height":
      return Boolean(draft.heightCm);
    case "weight":
      return Boolean(draft.weightKg);
    case "name":
      return true;
    case "review":
      return true;
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
  const isReview = step === "review";

  async function submit() {
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

  function handleNext() {
    if (isReview) {
      submit();
      return;
    }
    setStepIndex((i) => i + 1);
  }

  return (
    <div className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 px-5 py-8">
      <div className="h-1 w-full overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full bg-action transition-[width] duration-300"
          style={{ width: `${((stepIndex + 1) / STEPS.length) * 100}%` }}
        />
      </div>

      {step === "goal" && <StepGoal draft={draft} patch={patch} />}
      {step === "experience" && <StepExperience draft={draft} patch={patch} />}
      {step === "daysPerWeek" && <StepDaysPerWeek draft={draft} patch={patch} />}
      {step === "sessionMinutes" && <StepSessionMinutes draft={draft} patch={patch} />}
      {step === "equipment" && <StepEquipment draft={draft} patch={patch} />}
      {step === "limitations" && <StepLimitations draft={draft} patch={patch} />}
      {step === "activity" && <StepActivity draft={draft} patch={patch} />}
      {step === "sex" && <StepSex draft={draft} patch={patch} />}
      {step === "dateOfBirth" && <StepDateOfBirth draft={draft} patch={patch} />}
      {step === "height" && <StepHeight draft={draft} patch={patch} />}
      {step === "weight" && <StepWeight draft={draft} patch={patch} />}
      {step === "name" && <StepName draft={draft} patch={patch} />}
      {step === "review" && <StepReview draft={draft} goToStep={(key) => setStepIndex(STEPS.indexOf(key))} />}

      {error ? <p className="text-sm text-action-danger">{error}</p> : null}

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
          loading={submitting}
          disabled={!canAdvance(step, draft)}
        >
          {isReview ? "Confirm and continue" : "Next"}
        </Button>
      </div>
    </div>
  );
}
