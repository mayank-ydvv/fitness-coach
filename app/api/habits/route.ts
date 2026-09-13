import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { HABIT_CADENCES } from "@/lib/types";

const CreateHabitSchema = z.object({
  name: z.string().min(1).max(60),
  emoji: z.string().max(8).optional(),
  cadence: z.enum(HABIT_CADENCES).default("daily"),
  targetPerWeek: z.number().int().min(1).max(7).default(7),
  autoSource: z.enum(["workout_completed", "meals_logged"]).optional(),
  colorToken: z.string().default("load-green"),
  restDayEnabled: z.boolean().default(true),
});

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data, error } = await supabase
    .from("habits")
    .select("*")
    .eq("user_id", user.id)
    .is("archived_at", null)
    .order("sort_index", { ascending: true });

  if (error) return NextResponse.json({ error: "Couldn't load habits." }, { status: 500 });
  return NextResponse.json({ habits: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = CreateHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  const { data, error } = await supabase
    .from("habits")
    .insert({
      user_id: user.id,
      name: input.name,
      emoji: input.emoji,
      cadence: input.cadence,
      target_per_week: input.targetPerWeek,
      auto_source: input.autoSource,
      color_token: input.colorToken,
      rest_day_enabled: input.restDayEnabled,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Couldn't create that habit." }, { status: 500 });
  return NextResponse.json({ habit: data });
}
