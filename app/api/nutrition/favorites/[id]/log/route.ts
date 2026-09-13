import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { applyAutoHabits } from "@/lib/habits/apply";

const LogFavoriteSchema = z.object({
  mealId: z.uuid(), // client-generated, per M0's UUID rule
});

/** One-tap re-log: creates a new `ready` meal from a saved favorite's item
 * snapshot. No AI call, no upload — this is the whole point (spec §5:
 * "Repeat logging should take one tap; this is the single biggest
 * retention lever in the feature.") */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: favoriteId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = LogFavoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }

  const { data: favorite, error: favError } = await supabase
    .from("meal_favorites")
    .select("*")
    .eq("id", favoriteId)
    .eq("user_id", user.id)
    .single();
  if (favError || !favorite) return NextResponse.json({ error: "Favorite not found." }, { status: 404 });

  const { error: mealError } = await supabase.from("meals").insert({
    id: parsed.data.mealId,
    user_id: user.id,
    source: "repeat",
    status: "ready",
  });
  if (mealError) return NextResponse.json({ error: "Couldn't log that meal." }, { status: 500 });

  type FavoriteItem = {
    name: string;
    portionDescription?: string;
    grams: number | null;
    kcal: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    fiberG: number;
  };
  const items = (favorite.items as FavoriteItem[]).map((item) => ({
    meal_id: parsed.data.mealId,
    name: item.name,
    portion_description: item.portionDescription,
    grams: item.grams,
    kcal: item.kcal,
    protein_g: item.proteinG,
    carbs_g: item.carbsG,
    fat_g: item.fatG,
    fiber_g: item.fiberG,
  }));

  const { error: itemsError } = await supabase.from("meal_items").insert(items);
  if (itemsError) return NextResponse.json({ error: "Couldn't log the items for that meal." }, { status: 500 });

  await applyAutoHabits(supabase, { userId: user.id, trigger: "meals_logged" });

  return NextResponse.json({ ok: true, mealId: parsed.data.mealId });
}
