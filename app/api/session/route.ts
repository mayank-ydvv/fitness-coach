import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const StartSessionSchema = z.object({
  id: z.uuid(), // client-generated, per M0's UUID rule
  plannedWorkoutId: z.uuid().optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = StartSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("workout_sessions")
    .insert({ id: parsed.data.id, user_id: user.id, planned_workout_id: parsed.data.plannedWorkoutId })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Couldn't start a session." }, { status: 500 });
  return NextResponse.json({ session: data });
}
