import "server-only";
import { Type, type Schema } from "@google/genai";
import { z } from "zod";

export const GeneratedExerciseSchema = z.object({
  slug: z.string(),
  sets: z.number().int().min(1).max(6),
  reps_low: z.number().int().min(1).max(30),
  reps_high: z.number().int().min(1).max(30),
  rpe: z.number().min(5).max(10),
  rest_seconds: z.number().int().min(30).max(300),
});

export const GeneratedDaySchema = z.object({
  day_index: z.number().int().min(0).max(6),
  name: z.string(),
  estimated_minutes: z.number().int().positive(),
  exercises: z.array(GeneratedExerciseSchema).min(1),
});

export const GeneratedWeek1Schema = z.object({
  program_name: z.string(),
  rationale: z.string(),
  days: z.array(GeneratedDaySchema).min(1),
});

// Hand-written alongside the Zod schema above, kept in sync by hand (same
// dual-schema pattern as lib/ai/mealVision.ts) — this is what actually
// constrains Gemini's structured output via config.responseSchema; the
// JSON.stringify'd version further down is just for the prompt text.
export const PROGRAM_RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    program_name: { type: Type.STRING },
    rationale: { type: Type.STRING },
    days: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          day_index: { type: Type.INTEGER },
          name: { type: Type.STRING },
          estimated_minutes: { type: Type.INTEGER },
          exercises: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                slug: { type: Type.STRING },
                sets: { type: Type.INTEGER },
                reps_low: { type: Type.INTEGER },
                reps_high: { type: Type.INTEGER },
                rpe: { type: Type.NUMBER },
                rest_seconds: { type: Type.INTEGER },
              },
              required: ["slug", "sets", "reps_low", "reps_high", "rpe", "rest_seconds"],
            },
          },
        },
        required: ["day_index", "name", "estimated_minutes", "exercises"],
      },
    },
  },
  required: ["program_name", "rationale", "days"],
};

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    program_name: { type: "string" },
    rationale: { type: "string" },
    days: {
      type: "array",
      items: {
        type: "object",
        properties: {
          day_index: { type: "integer" },
          name: { type: "string" },
          estimated_minutes: { type: "integer" },
          exercises: {
            type: "array",
            items: {
              type: "object",
              properties: {
                slug: { type: "string" },
                sets: { type: "integer" },
                reps_low: { type: "integer" },
                reps_high: { type: "integer" },
                rpe: { type: "number" },
                rest_seconds: { type: "integer" },
              },
              required: ["slug", "sets", "reps_low", "reps_high", "rpe", "rest_seconds"],
            },
          },
        },
        required: ["day_index", "name", "estimated_minutes", "exercises"],
      },
    },
  },
  required: ["program_name", "rationale", "days"],
} as const;

/** Spec §10.2, adapted to week-1-only generation (see lib/program/expand.ts
 * for why weeks 2-6 are arithmetic, not another model call). */
export function buildProgramGeneratePrompt(params: {
  splitName: string;
  splitDays: { name: string; patterns: string[] }[];
  daysPerWeek: number;
  sessionMinutes: number;
  eligibleSlugs: string[];
  experienceLevel: string;
  limitations: string;
  volumeMin: number;
  volumeMax: number;
}): { system: string; user: string } {
  const dayRequirements = params.splitDays
    .map((d) => `  - "${d.name}": must include at least one exercise of EACH pattern — ${d.patterns.join(", ")}`)
    .join("\n");

  const system = `You design resistance training programs. Output ONLY valid JSON matching
the schema.

Hard constraints:
- Use ONLY exercise slugs from the allowed list. Never invent a slug.
- Produce exactly ${params.daysPerWeek} days, one per name below, in this order.
- Every day must cover every movement pattern listed for it — this is checked
  automatically and the whole response is rejected if any pattern is missing,
  so treat pattern coverage as a harder constraint than exercise count:
${dayRequirements}
- Weekly hard sets per major muscle group (chest, back, quads, hamstrings, glutes, shoulders, arms, core) must fall between ${params.volumeMin} and ${params.volumeMax}, counted like this: each set counts 1.0 toward the exercise's primary muscle and 0.5 toward each secondary muscle, summed across EVERY day in the week, warmup sets excluded. This is the single most common way a program gets rejected — before finalizing, add up every set's contribution to each of the 8 groups across all days and confirm each total is within the band. "back" and "arms" are the groups that overshoot most often, because rows/pulldowns/curls stack primary credit for them on top of secondary credit from presses and pulls done on OTHER days — budget fewer direct back/arm sets than you would in isolation, precisely because that secondary credit already exists. If a group would exceed ${params.volumeMax} once secondary credit is included, cut a set from that exercise or drop an accessory movement rather than leaving the total over.
- Keep each day within ${params.sessionMinutes} minutes, assuming the prescribed rest periods. If fitting every required pattern is tight, use single-set or shorter-rest entries for the smaller/isolation patterns (e.g. pull_v, core) rather than dropping them.
- Respect the stated limitations absolutely. If a limitation rules out a movement pattern, substitute a different exercise within the SAME pattern — never drop the pattern.
- Compound movements first in each day, heaviest first.
- reps_high must be an integer between 1 and 30 for EVERY exercise, with no exceptions — this includes high-rep bodyweight and core work (mountain climbers, bicycle crunches, etc). If an exercise is normally programmed for time rather than reps (e.g. a plank hold), still give a rep count of 30 or fewer and let sets/rest carry the volume, rather than writing a rep count above 30.
- This is week 1 only — do not describe progression across weeks, that is handled separately.
- If the athlete is a beginner, keep RPE targets conservative (6.5-7.5) for week 1.

Schema: { "program_name", "rationale", "days": [{ "day_index", "name", "estimated_minutes", "exercises": [{ "slug", "sets", "reps_low", "reps_high", "rpe", "rest_seconds" }] }] }`;

  const user = `Design week 1 of a ${params.splitName} program.
Experience level: ${params.experienceLevel}
Limitations: ${params.limitations || "none stated"}

Required movement-pattern coverage per day (see system instructions — every pattern listed must appear at least once that day):
${dayRequirements}

ALLOWED_SLUGS (use only these): ${params.eligibleSlugs.join(", ")}

Return ONLY the JSON described in your instructions, matching this exact schema:
${JSON.stringify(RESPONSE_SCHEMA)}`;

  return { system, user };
}

export function buildRetryAppendix(violations: { path: string; message: string; fix: string }[]): string {
  const lines = violations
    .slice(0, 5)
    .map((v) => `- ${v.path}: ${v.message}\n  Fix: ${v.fix}`)
    .join("\n");
  return `\n\nVALIDATION_FAILURES (fix these, keep everything else):\n${lines}`;
}
