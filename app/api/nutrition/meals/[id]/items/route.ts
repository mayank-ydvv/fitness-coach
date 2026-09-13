import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/database.types";

const AddItemSchema = z.object({
  name: z.string().min(1),
  portionDescription: z.string().optional(),
  grams: z.number().optional(),
  kcal: z.number(),
  kcalLow: z.number().optional(),
  kcalHigh: z.number().optional(),
  proteinG: z.number().default(0),
  carbsG: z.number().default(0),
  fatG: z.number().default(0),
  fiberG: z.number().default(0),
  confidence: z.number().min(0).max(1).optional(),
});

const PatchItemSchema = z
  .object({
    itemId: z.uuid(),
    name: z.string().min(1),
    grams: z.number(),
    kcal: z.number(),
    kcalLow: z.number().nullable(),
    kcalHigh: z.number().nullable(),
    proteinG: z.number(),
    carbsG: z.number(),
    fatG: z.number(),
    fiberG: z.number(),
  })
  .partial()
  .required({ itemId: true });

// Add a manually-entered item ("Add item") to an existing meal.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: mealId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = AddItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  // Confirm the meal is actually this user's before writing an item onto
  // it — meal_items has no user_id of its own (RLS already enforces this
  // too, but a clear 404 beats a generic RLS-denied error here).
  const { data: meal } = await supabase.from("meals").select("id").eq("id", mealId).eq("user_id", user.id).maybeSingle();
  if (!meal) return NextResponse.json({ error: "Meal not found." }, { status: 404 });

  const { data, error } = await supabase
    .from("meal_items")
    .insert({
      meal_id: mealId,
      name: input.name,
      portion_description: input.portionDescription,
      grams: input.grams,
      kcal: input.kcal,
      kcal_low: input.kcalLow,
      kcal_high: input.kcalHigh,
      protein_g: input.proteinG,
      carbs_g: input.carbsG,
      fat_g: input.fatG,
      fiber_g: input.fiberG,
      confidence: input.confidence,
      user_edited: true,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Couldn't add that item." }, { status: 500 });
  return NextResponse.json({ item: data });
}

// Edit an item (portion stepper / gram input / manual correction) — always
// marks user_edited: true.
export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = PatchItemSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const { itemId, ...rest } = parsed.data;

  const columns: TablesUpdate<"meal_items"> = { user_edited: true };
  if (rest.name !== undefined) columns.name = rest.name;
  if (rest.grams !== undefined) columns.grams = rest.grams;
  if (rest.kcal !== undefined) columns.kcal = rest.kcal;
  if (rest.kcalLow !== undefined) columns.kcal_low = rest.kcalLow;
  if (rest.kcalHigh !== undefined) columns.kcal_high = rest.kcalHigh;
  if (rest.proteinG !== undefined) columns.protein_g = rest.proteinG;
  if (rest.carbsG !== undefined) columns.carbs_g = rest.carbsG;
  if (rest.fatG !== undefined) columns.fat_g = rest.fatG;
  if (rest.fiberG !== undefined) columns.fiber_g = rest.fiberG;

  // RLS's own join-through policy is the real authorization boundary here.
  const { data, error } = await supabase.from("meal_items").update(columns).eq("id", itemId).select().single();
  if (error) return NextResponse.json({ error: "Couldn't update that item." }, { status: 500 });
  return NextResponse.json({ item: data });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) return NextResponse.json({ error: "itemId query param is required." }, { status: 400 });

  const { error } = await supabase.from("meal_items").delete().eq("id", itemId);
  if (error) return NextResponse.json({ error: "Couldn't delete that item." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
