import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { MEAL_STATUSES, MEAL_TYPES } from "@/lib/types";

const PatchMealSchema = z
  .object({
    mealType: z.enum(MEAL_TYPES),
    eatenAt: z.iso.datetime(),
    status: z.enum(MEAL_STATUSES),
    note: z.string().max(500),
  })
  .partial();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // params is a Promise in Next 15
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = PatchMealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const { mealType, eatenAt, status, note } = parsed.data;

  const { data, error } = await supabase
    .from("meals")
    .update({
      ...(mealType !== undefined ? { meal_type: mealType } : {}),
      ...(eatenAt !== undefined ? { eaten_at: eatenAt } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(note !== undefined ? { note } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Couldn't update that meal." }, { status: 500 });
  return NextResponse.json({ meal: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { error } = await supabase.from("meals").delete().eq("id", id).eq("user_id", user.id);
  if (error) return NextResponse.json({ error: "Couldn't delete that meal." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
