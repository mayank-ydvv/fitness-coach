import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { analyzeMealPhoto } from "@/lib/ai/mealVision";
import { assertUnderDailyCap, recordAiJob, DailyCapError } from "@/lib/ai/jobs";
import { applyAutoHabits } from "@/lib/habits/apply";
import { MODEL } from "@/lib/ai/client";

// A Gemini vision call plus retries can exceed Vercel Hobby's 10s default —
// this must be set explicitly or the route dies mid-call and the meal sits
// in 'processing' forever.
export const maxDuration = 60;

const AnalyzeSchema = z.object({ mealId: z.uuid() });

export async function POST(request: Request) {
  const started = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = AnalyzeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const { mealId } = parsed.data;

  const { data: meal } = await supabase.from("meals").select("id, image_path, note").eq("id", mealId).eq("user_id", user.id).maybeSingle();
  if (!meal) return NextResponse.json({ error: "Meal not found." }, { status: 404 });
  if (!meal.image_path) return NextResponse.json({ error: "That meal has no photo to analyze." }, { status: 400 });

  try {
    await assertUnderDailyCap(supabase, "meal_vision");
  } catch (err) {
    if (err instanceof DailyCapError) {
      // Not an error the user needs to see as a failure — offer manual
      // entry instead, per spec §5's "Rate limited" edge case.
      await supabase.from("meals").update({ status: "failed" }).eq("id", mealId);
      return NextResponse.json({ error: "rate_limited", message: `You've hit today's limit of ${err.limit} photo analyses. Enter this one manually instead.` }, { status: 429 });
    }
    return NextResponse.json({ error: "Couldn't check your daily limit." }, { status: 500 });
  }

  const admin = createAdminClient();
  const { data: imageBlob, error: downloadError } = await admin.storage.from("meals").download(meal.image_path);
  if (downloadError || !imageBlob) {
    await admin.from("meals").update({ status: "failed" }).eq("id", mealId);
    return NextResponse.json({ error: "Couldn't read that photo." }, { status: 502 });
  }

  const mediaType = meal.image_path.endsWith(".jpg") || meal.image_path.endsWith(".jpeg") ? "image/jpeg" : "image/webp";
  const imageBase64 = Buffer.from(await imageBlob.arrayBuffer()).toString("base64");

  try {
    const analysis = await analyzeMealPhoto({ imageBase64, mediaType, userNote: meal.note ?? undefined });

    if (!analysis.is_food) {
      await admin.from("meals").update({ status: "failed" }).eq("id", mealId);
      await recordAiJob({ userId: user.id, kind: "meal_vision", model: MODEL, status: "succeeded", latencyMs: Date.now() - started });
      return NextResponse.json({ isFood: false, message: "That doesn't look like food. Try again, or add it manually." });
    }

    if (analysis.items.length > 0) {
      const { error: itemsError } = await admin.from("meal_items").insert(
        analysis.items.map((item, index) => ({
          meal_id: mealId,
          name: item.name,
          portion_description: item.portion_description,
          grams: item.grams,
          kcal: item.kcal,
          kcal_low: item.kcal_low,
          kcal_high: item.kcal_high,
          protein_g: item.protein_g,
          carbs_g: item.carbs_g,
          fat_g: item.fat_g,
          fiber_g: item.fiber_g,
          confidence: item.confidence,
          order_index: index,
        })),
      );
      if (itemsError) {
        await admin.from("meals").update({ status: "failed" }).eq("id", mealId);
        return NextResponse.json({ error: "Couldn't save what we found in that photo." }, { status: 500 });
      }
    }

    await admin
      .from("meals")
      .update({ status: "ready", meal_type: analysis.meal_type_guess })
      .eq("id", mealId);

    await applyAutoHabits(admin, { userId: user.id, trigger: "meals_logged" });
    await recordAiJob({ userId: user.id, kind: "meal_vision", model: MODEL, status: "succeeded", latencyMs: Date.now() - started });

    return NextResponse.json({
      isFood: true,
      portionAmbiguous: analysis.portion_ambiguous,
      itemCount: analysis.items.length,
    });
  } catch (err) {
    await admin.from("meals").update({ status: "failed" }).eq("id", mealId);
    await recordAiJob({
      userId: user.id,
      kind: "meal_vision",
      model: MODEL,
      status: "failed",
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Couldn't analyze that photo. Enter it manually instead." }, { status: 502 });
  }
}
