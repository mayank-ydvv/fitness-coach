import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const SaveFavoriteSchema = z.object({
  name: z.string().min(1).max(120),
  sourceMealId: z.uuid().optional(),
  items: z.array(
    z.object({
      name: z.string(),
      portionDescription: z.string().optional(),
      grams: z.number().nullable(),
      kcal: z.number(),
      proteinG: z.number(),
      carbsG: z.number(),
      fatG: z.number(),
      fiberG: z.number(),
    }),
  ),
});

// "Save as a meal I eat often" — spec §5, the single biggest retention
// lever: this is what powers the one-tap re-log.
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = SaveFavoriteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  const { data, error } = await supabase
    .from("meal_favorites")
    .insert({ user_id: user.id, name: input.name, source_meal_id: input.sourceMealId, items: input.items })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Couldn't save that favorite." }, { status: 500 });
  return NextResponse.json({ favorite: data });
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data, error } = await supabase
    .from("meal_favorites")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Couldn't load favorites." }, { status: 500 });
  return NextResponse.json({ favorites: data });
}
