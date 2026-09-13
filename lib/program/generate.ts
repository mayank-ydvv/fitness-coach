import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import type { Equipment, ExperienceLevel, Goal } from "@/lib/types";
import { geminiClient, MODEL, parseJson } from "@/lib/ai/client";
import { assertUnderDailyCap, recordAiJob } from "@/lib/ai/jobs";
import { buildProgramGeneratePrompt, buildRetryAppendix, GeneratedWeek1Schema, PROGRAM_RESPONSE_SCHEMA } from "@/lib/ai/prompts/programGenerate";
import { getSplit, splitName } from "@/lib/training/splits";
import { volumeBand } from "@/lib/training/volume";
import { buildFallbackWeek1 } from "@/lib/training/templates";
import { hashGenerationInput } from "@/lib/training/hash";
import { validateWeek1 } from "./validate";
import { expandToMesocycle } from "./expand";
import { persistMesocycle } from "./persist";
import type { ExerciseRef, GeneratedWeek1 } from "./types";

export type GenerateProgramParams = {
  userId: string;
  goal: Goal;
  experienceLevel: ExperienceLevel;
  daysPerWeek: number;
  sessionMinutes: number;
  equipment: Equipment[];
  limitations: string;
};

export type GenerateProgramResult = { programId: string; fromCache: boolean; usedFallback: boolean };

export async function generateProgram(
  supabase: SupabaseClient<Database>,
  params: GenerateProgramParams,
): Promise<GenerateProgramResult> {
  const hash = hashGenerationInput({
    goal: params.goal,
    daysPerWeek: params.daysPerWeek,
    equipment: params.equipment,
    experienceLevel: params.experienceLevel,
    limitations: params.limitations,
    sessionMinutes: params.sessionMinutes,
  });

  const { data: existing } = await supabase
    .from("programs")
    .select("id")
    .eq("user_id", params.userId)
    .eq("generation_input_hash", hash)
    .eq("status", "active")
    .maybeSingle();
  if (existing) return { programId: existing.id, fromCache: true, usedFallback: false };

  await assertUnderDailyCap(supabase, "program_gen");

  const { data: exerciseRows, error: exerciseError } = await supabase
    .from("exercises")
    .select("id, slug, primary_muscle, secondary_muscles, movement_pattern, load_increment_kg")
    .in("equipment", params.equipment);
  if (exerciseError) throw new Error(`Couldn't load exercises: ${exerciseError.message}`);

  const eligibleExercises: ExerciseRef[] = (exerciseRows ?? []).map((r) => ({
    id: r.id,
    slug: r.slug,
    primaryMuscle: r.primary_muscle,
    secondaryMuscles: r.secondary_muscles,
    movementPattern: r.movement_pattern,
    loadIncrementKg: r.load_increment_kg,
  }));
  const eligibleBySlug = new Map(eligibleExercises.map((e) => [e.slug, e]));

  getSplit(params.daysPerWeek); // throws early on an unsupported days_per_week, before any AI call
  const band = volumeBand(params.goal);

  const started = Date.now();
  let week1: GeneratedWeek1;
  let usedFallback = false;

  try {
    week1 = await generateAndValidate({ ...params, eligibleExercises, band });
  } catch (err) {
    console.error("[program_gen] falling back:", err instanceof Error ? err.message : err);
    usedFallback = true;
    week1 = buildFallbackWeek1({
      daysPerWeek: params.daysPerWeek,
      eligibleExercises,
      sessionMinutes: params.sessionMinutes,
      experienceLevel: params.experienceLevel,
    });
  }

  const weeks = expandToMesocycle(week1, eligibleBySlug);

  const programId = await persistMesocycle(supabase, {
    userId: params.userId,
    name: week1.program_name,
    goal: params.goal,
    split: splitName(params.daysPerWeek),
    daysPerWeek: params.daysPerWeek,
    generationInput: { ...params },
    generationInputHash: hash,
    weeks,
  });

  await recordAiJob({
    userId: params.userId,
    kind: "program_gen",
    model: MODEL,
    status: usedFallback ? "fallback" : "succeeded",
    latencyMs: Date.now() - started,
  });

  return { programId, fromCache: false, usedFallback };
}

async function generateAndValidate(params: GenerateProgramParams & { eligibleExercises: ExerciseRef[]; band: { min: number; max: number } }): Promise<GeneratedWeek1> {
  const split = getSplit(params.daysPerWeek);
  const { system, user } = buildProgramGeneratePrompt({
    splitName: splitName(params.daysPerWeek),
    splitDays: split.map((d) => ({ name: d.name, patterns: d.patterns })),
    daysPerWeek: params.daysPerWeek,
    sessionMinutes: params.sessionMinutes,
    eligibleSlugs: params.eligibleExercises.map((e) => e.slug),
    experienceLevel: params.experienceLevel,
    limitations: params.limitations,
    volumeMin: params.band.min,
    volumeMax: params.band.max,
  });

  const client = geminiClient();

  async function callOnce(appendix?: string): Promise<GeneratedWeek1> {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: appendix ? user + appendix : user,
      config: {
        systemInstruction: system,
        responseMimeType: "application/json",
        responseSchema: PROGRAM_RESPONSE_SCHEMA,
      },
    });
    return parseJson(GeneratedWeek1Schema, response.text, "program generation");
  }

  // Two sequential Gemini calls have been observed taking ~25-30s each in
  // production — comfortably fine alone, but back-to-back they can exceed
  // this route's 60s Vercel function ceiling entirely, turning what should
  // be a graceful template fallback into a hard 504 with no response at
  // all. Track the wall-clock budget and skip the retry once there isn't
  // realistically enough time left for a second full call plus the
  // persistence writes after it — falling back is always safe; timing out
  // the whole request is not.
  const startedAt = Date.now();
  const RETRY_BUDGET_MS = 25_000;

  let candidate = await callOnce();
  let violations = validateWeek1({
    week: candidate,
    eligibleExercises: params.eligibleExercises,
    daysPerWeek: params.daysPerWeek,
    goal: params.goal,
    sessionCapMinutes: params.sessionMinutes,
    limitations: params.limitations,
  });

  if (violations.length > 0 && Date.now() - startedAt < RETRY_BUDGET_MS) {
    candidate = await callOnce(buildRetryAppendix(violations));
    violations = validateWeek1({
      week: candidate,
      eligibleExercises: params.eligibleExercises,
      daysPerWeek: params.daysPerWeek,
      goal: params.goal,
      sessionCapMinutes: params.sessionMinutes,
      limitations: params.limitations,
      bandWidening: 1,
    });
  }

  if (violations.length > 0) {
    throw new Error(`Program generation failed validation twice: ${violations.map((v) => v.message).join("; ")}`);
  }

  return candidate;
}
