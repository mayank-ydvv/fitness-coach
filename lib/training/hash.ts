import "server-only";
import { createHash } from "node:crypto";

export type ProgramGenerationInput = {
  goal: string;
  daysPerWeek: number;
  equipment: string[];
  experienceLevel: string;
  limitations: string;
  sessionMinutes: number;
};

/** Canonical JSON (sorted keys, sorted array values where order doesn't
 * matter) -> sha256, so two logically-identical inputs hash the same
 * regardless of array ordering from the client. */
export function hashGenerationInput(input: ProgramGenerationInput): string {
  const canonical = {
    goal: input.goal,
    daysPerWeek: input.daysPerWeek,
    equipment: [...input.equipment].sort(),
    experienceLevel: input.experienceLevel,
    limitations: input.limitations.trim().toLowerCase(),
    sessionMinutes: input.sessionMinutes,
  };
  return createHash("sha256").update(JSON.stringify(canonical)).digest("hex");
}
