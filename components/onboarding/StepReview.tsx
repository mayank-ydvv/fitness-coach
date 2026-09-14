"use client";

// Input/display parsing exemption — same reasoning as StepHeight/StepWeight.
// eslint-disable-next-line no-restricted-imports
import { cmToFtIn, kgToLb } from "@/lib/units/convert";
import type { OnboardingDraft, StepKey } from "./types";
import { GOAL_LABELS } from "./StepGoal";
import { EXPERIENCE_LABELS } from "./StepExperience";
import { EQUIPMENT_LABELS } from "./StepEquipment";
import { ACTIVITY_LABELS } from "./StepActivity";
import { SEX_LABELS } from "./StepSex";

function formatDob(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" });
}

function formatHeight(heightCm: number | null, isImperial: boolean): string {
  if (heightCm === null) return "—";
  if (!isImperial) return `${heightCm} cm`;
  const { feet, inches } = cmToFtIn(heightCm);
  return `${feet} ft ${inches} in`;
}

function formatWeight(weightKg: number | null, isImperial: boolean): string {
  if (weightKg === null) return "—";
  return isImperial ? `${Math.round(kgToLb(weightKg) * 2) / 2} lb` : `${weightKg} kg`;
}

/**
 * "End with a summary the user can edit" — the flow used to go straight
 * from the last input to the server call with no chance to review.
 * Every row jumps back to its own step on click rather than re-running
 * the whole sequence, so fixing one answer doesn't cost the others.
 */
export function StepReview({ draft, goToStep }: { draft: OnboardingDraft; goToStep: (step: StepKey) => void }) {
  const isImperial = draft.unitSystem === "imperial";

  const rows: { step: StepKey; label: string; value: string }[] = [
    { step: "goal", label: "Goal", value: draft.goal ? GOAL_LABELS[draft.goal] : "—" },
    { step: "experience", label: "Experience", value: draft.experienceLevel ? EXPERIENCE_LABELS[draft.experienceLevel] : "—" },
    { step: "daysPerWeek", label: "Training days", value: `${draft.daysPerWeek} / week` },
    { step: "sessionMinutes", label: "Session length", value: `${draft.sessionMinutes} min` },
    { step: "equipment", label: "Equipment", value: draft.equipment.length ? draft.equipment.map((e) => EQUIPMENT_LABELS[e]).join(", ") : "—" },
    { step: "limitations", label: "Limitations", value: draft.limitations.trim() || "None" },
    { step: "activity", label: "Daily activity", value: draft.activityLevel ? ACTIVITY_LABELS[draft.activityLevel] : "—" },
    { step: "sex", label: "Sex", value: draft.sex ? SEX_LABELS[draft.sex] : "—" },
    { step: "dateOfBirth", label: "Date of birth", value: formatDob(draft.dateOfBirth) },
    { step: "height", label: "Height", value: formatHeight(draft.heightCm, isImperial) },
    { step: "weight", label: "Weight", value: formatWeight(draft.weightKg, isImperial) },
    { step: "name", label: "Name", value: draft.displayName.trim() || "—" },
  ];

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-xl font-medium text-ink-primary">Review your answers</h2>
        <p className="mt-1 text-sm text-ink-muted">Everything here shapes your plan — edit anything before we build it.</p>
      </div>
      <div className="flex flex-col divide-y divide-hairline rounded-card border border-hairline bg-surface-raised">
        {rows.map((r) => (
          <div key={r.step} className="flex items-center justify-between gap-4 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm text-ink-muted">{r.label}</p>
              <p className="truncate text-ink-primary">{r.value}</p>
            </div>
            <button
              type="button"
              onClick={() => goToStep(r.step)}
              className="-my-2.5 -mr-2 flex min-h-11 shrink-0 items-center px-2 text-sm font-medium text-action underline-offset-2 hover:underline"
            >
              Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
