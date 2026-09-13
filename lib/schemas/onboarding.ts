import { z } from "zod";
import {
  ACTIVITY_LEVELS,
  EQUIPMENT,
  EXPERIENCE_LEVELS,
  GOALS,
  SEXES,
} from "@/lib/types";

// Zod v4 idioms throughout: z.iso.date() (not the v3 z.string().date()),
// z.flattenError() (not err.flatten()) for API-route error shaping.
export const OnboardingSchema = z.object({
  goal: z.enum(GOALS),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(15).max(180),
  equipment: z.array(z.enum(EQUIPMENT)).min(1, "Pick at least one piece of equipment."),
  limitations: z.string().max(500).optional(),
  activityLevel: z.enum(ACTIVITY_LEVELS),
  dateOfBirth: z.iso.date(),
  sex: z.enum(SEXES),
  heightCm: z.number().positive().max(260),
  weightKg: z.number().positive().max(400),
  displayName: z.string().min(1).max(80).optional(),
});

export type OnboardingInput = z.infer<typeof OnboardingSchema>;

export function ageFromDob(dateOfBirthIso: string, asOf: Date = new Date()): number {
  const dob = new Date(dateOfBirthIso);
  let age = asOf.getFullYear() - dob.getFullYear();
  const hadBirthdayThisYear =
    asOf.getMonth() > dob.getMonth() ||
    (asOf.getMonth() === dob.getMonth() && asOf.getDate() >= dob.getDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age;
}
