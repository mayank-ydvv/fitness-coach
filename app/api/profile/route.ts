import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { computeNutritionTargets } from "@/lib/nutrition/targets";
import { ageFromDob } from "@/lib/schemas/onboarding";
import {
  ACTIVITY_LEVELS,
  EQUIPMENT,
  EXPERIENCE_LEVELS,
  GOALS,
  SEXES,
  UNIT_SYSTEMS,
} from "@/lib/types";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) return NextResponse.json({ error: "Couldn't load your profile." }, { status: 500 });
  return NextResponse.json({ profile: data });
}

// Fields that change what the nutrition target should be — a PATCH touching
// any of these recomputes nutrition_targets after saving.
const TARGET_AFFECTING_FIELDS = ["goal", "activityLevel", "sex", "heightCm", "weightKg", "dateOfBirth"] as const;

const ProfilePatchSchema = z
  .object({
    displayName: z.string().min(1).max(80),
    dateOfBirth: z.iso.date(),
    sex: z.enum(SEXES),
    heightCm: z.number().positive().max(260),
    weightKg: z.number().positive().max(400),
    unitSystem: z.enum(UNIT_SYSTEMS),
    hideEnergy: z.boolean(),
    goal: z.enum(GOALS),
    experienceLevel: z.enum(EXPERIENCE_LEVELS),
    daysPerWeek: z.number().int().min(1).max(7),
    sessionMinutes: z.number().int().min(15).max(180),
    equipment: z.array(z.enum(EQUIPMENT)),
    limitations: z.string().max(500),
    activityLevel: z.enum(ACTIVITY_LEVELS),
  })
  .partial();

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = ProfilePatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const patch = parsed.data;

  const { weightKg, ...profilePatch } = patch;
  const profileColumns: TablesUpdate<"profiles"> = {};
  if (profilePatch.displayName !== undefined) profileColumns.display_name = profilePatch.displayName;
  if (profilePatch.dateOfBirth !== undefined) profileColumns.date_of_birth = profilePatch.dateOfBirth;
  if (profilePatch.sex !== undefined) profileColumns.sex = profilePatch.sex;
  if (profilePatch.heightCm !== undefined) profileColumns.height_cm = profilePatch.heightCm;
  if (profilePatch.unitSystem !== undefined) profileColumns.unit_system = profilePatch.unitSystem;
  if (profilePatch.hideEnergy !== undefined) profileColumns.hide_energy = profilePatch.hideEnergy;
  if (profilePatch.goal !== undefined) profileColumns.goal = profilePatch.goal;
  if (profilePatch.experienceLevel !== undefined) profileColumns.experience_level = profilePatch.experienceLevel;
  if (profilePatch.daysPerWeek !== undefined) profileColumns.days_per_week = profilePatch.daysPerWeek;
  if (profilePatch.sessionMinutes !== undefined) profileColumns.session_minutes = profilePatch.sessionMinutes;
  if (profilePatch.equipment !== undefined) profileColumns.equipment = profilePatch.equipment;
  if (profilePatch.limitations !== undefined) profileColumns.limitations = profilePatch.limitations;
  if (profilePatch.activityLevel !== undefined) profileColumns.activity_level = profilePatch.activityLevel;

  if (Object.keys(profileColumns).length > 0) {
    const { error } = await supabase.from("profiles").update(profileColumns).eq("id", user.id);
    if (error) return NextResponse.json({ error: "Couldn't save your profile." }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  if (weightKg !== undefined) {
    const { error } = await supabase
      .from("body_metrics")
      .upsert({ user_id: user.id, recorded_on: today, weight_kg: weightKg }, { onConflict: "user_id,recorded_on" });
    if (error) return NextResponse.json({ error: "Couldn't save your weight." }, { status: 500 });
  }

  const touchedTargetField = TARGET_AFFECTING_FIELDS.some((f) => f in patch);
  if (!touchedTargetField) {
    return NextResponse.json({ ok: true });
  }

  const { data: profile, error: profileReadError } = await supabase
    .from("profiles")
    .select("sex, height_cm, activity_level, goal, date_of_birth")
    .eq("id", user.id)
    .single();
  if (profileReadError || !profile?.sex || !profile.height_cm || !profile.activity_level || !profile.goal || !profile.date_of_birth) {
    // Profile isn't complete enough to recompute yet (e.g. mid-onboarding) — skip silently.
    return NextResponse.json({ ok: true });
  }

  let currentWeightKg = weightKg;
  if (currentWeightKg === undefined) {
    const { data: latestMetric } = await supabase
      .from("body_metrics")
      .select("weight_kg")
      .eq("user_id", user.id)
      .order("recorded_on", { ascending: false })
      .limit(1)
      .maybeSingle();
    currentWeightKg = latestMetric?.weight_kg ?? undefined;
  }
  if (currentWeightKg === undefined || currentWeightKg === null) {
    return NextResponse.json({ ok: true });
  }

  const targets = computeNutritionTargets({
    sex: profile.sex,
    ageYears: ageFromDob(profile.date_of_birth),
    heightCm: profile.height_cm,
    weightKg: currentWeightKg,
    activityLevel: profile.activity_level,
    goal: profile.goal,
  });

  const { error: targetsError } = await supabase.from("nutrition_targets").insert({
    user_id: user.id,
    effective_from: today,
    kcal: targets.kcal,
    protein_g: targets.proteinG,
    carbs_g: targets.carbsG,
    fat_g: targets.fatG,
    method: targets.method,
    rationale: targets.rationale,
  });
  if (targetsError) {
    return NextResponse.json({ error: "Profile saved, but couldn't recompute your targets." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, targets });
}
