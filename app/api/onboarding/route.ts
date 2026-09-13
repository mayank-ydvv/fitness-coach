import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { OnboardingSchema, ageFromDob } from "@/lib/schemas/onboarding";
import { computeNutritionTargets } from "@/lib/nutrition/targets";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  const timezone =
    typeof body?.timezone === "string" && body.timezone.length > 0 ? body.timezone : "UTC";

  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      display_name: input.displayName,
      date_of_birth: input.dateOfBirth,
      sex: input.sex,
      height_cm: input.heightCm,
      goal: input.goal,
      experience_level: input.experienceLevel,
      days_per_week: input.daysPerWeek,
      session_minutes: input.sessionMinutes,
      equipment: input.equipment,
      limitations: input.limitations ?? null,
      activity_level: input.activityLevel,
      timezone,
      onboarded_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: "Couldn't save your profile. Try again." }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);
  const { error: bodyMetricError } = await supabase
    .from("body_metrics")
    .upsert(
      { user_id: user.id, recorded_on: today, weight_kg: input.weightKg },
      { onConflict: "user_id,recorded_on" },
    );
  if (bodyMetricError) {
    return NextResponse.json({ error: "Couldn't save your weight. Try again." }, { status: 500 });
  }

  const ageYears = ageFromDob(input.dateOfBirth);
  const targets = computeNutritionTargets({
    sex: input.sex,
    ageYears,
    heightCm: input.heightCm,
    weightKg: input.weightKg,
    activityLevel: input.activityLevel,
    goal: input.goal,
  });

  // Seed the 3 suggested habits (spec §8) — all editable/deletable later
  // from the Habits page. No separate review-step UI (a simplification
  // from the spec's "editable before saving" flow, given the time budget);
  // they land as real, editable rows from the start instead.
  await supabase.from("habits").insert([
    { user_id: user.id, name: "Train", emoji: "💪", auto_source: "workout_completed", color_token: "load-blue", sort_index: 0 },
    { user_id: user.id, name: "Log every meal", emoji: "🍽️", auto_source: "meals_logged", color_token: "load-green", sort_index: 1 },
    { user_id: user.id, name: "Sleep 7+ hours", emoji: "😴", color_token: "load-yellow", sort_index: 2 },
  ]);

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
    return NextResponse.json({ error: "Couldn't compute your targets. Try again." }, { status: 500 });
  }

  return NextResponse.json({ targets });
}
