import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { applyAutoHabits } from "@/lib/habits/apply";
import { dayRangeUtc } from "@/lib/time/localDay";
import { MEAL_STATUSES, MEAL_TYPES } from "@/lib/types";

const CreateMealSchema = z.object({
  id: z.uuid(), // client-generated — see M0 decision: every row UUID is client-generated
  source: z.enum(["photo", "manual", "search", "repeat"]),
  status: z.enum(MEAL_STATUSES).default("ready"),
  mealType: z.enum(MEAL_TYPES).optional(),
  eatenAt: z.iso.datetime().optional(),
  imagePath: z.string().optional(),
  note: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = CreateMealSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  const { data, error } = await supabase
    .from("meals")
    .insert({
      id: input.id,
      user_id: user.id,
      source: input.source,
      status: input.status,
      meal_type: input.mealType,
      eaten_at: input.eatenAt,
      image_path: input.imagePath,
      note: input.note,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Couldn't save that meal." }, { status: 500 });

  if (input.status === "ready" || input.status === "manual") {
    await applyAutoHabits(supabase, { userId: user.id, trigger: "meals_logged" });
  }

  return NextResponse.json({ meal: data });
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date"); // YYYY-MM-DD, in the caller's local timezone
  if (!date) return NextResponse.json({ error: "date query param is required." }, { status: 400 });

  // The caller's local timezone is needed to turn `date` into the right
  // UTC instant range (see dayRangeUtc) — a bare `${date}T00:00:00`
  // literal is parsed in the DB session's timezone (UTC), not the
  // user's, which is exactly what made a just-logged meal disappear on
  // this route's next poll for any non-UTC user (see localDay.ts).
  const { data: profile } = await supabase.from("profiles").select("timezone").eq("id", user.id).single();
  const timezone = profile?.timezone ?? "UTC";
  const { start, end } = dayRangeUtc(date, timezone);

  const { data, error } = await supabase
    .from("meals")
    .select("*, meal_items(*)")
    .eq("user_id", user.id)
    .gte("eaten_at", start)
    .lt("eaten_at", end)
    .order("eaten_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Couldn't load meals." }, { status: 500 });
  return NextResponse.json({ meals: data });
}
