import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { HABIT_CADENCES } from "@/lib/types";

const PatchHabitSchema = z
  .object({
    name: z.string().min(1).max(60),
    emoji: z.string().max(8).nullable(),
    cadence: z.enum(HABIT_CADENCES),
    targetPerWeek: z.number().int().min(1).max(7),
    reminderTime: z.string().nullable(),
    colorToken: z.string(),
    restDayEnabled: z.boolean(),
    archived: z.boolean(), // true archives (soft-delete), false un-archives
  })
  .partial();

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = PatchHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const { archived, ...rest } = parsed.data;

  const { data, error } = await supabase
    .from("habits")
    .update({
      ...(rest.name !== undefined ? { name: rest.name } : {}),
      ...(rest.emoji !== undefined ? { emoji: rest.emoji } : {}),
      ...(rest.cadence !== undefined ? { cadence: rest.cadence } : {}),
      ...(rest.targetPerWeek !== undefined ? { target_per_week: rest.targetPerWeek } : {}),
      ...(rest.reminderTime !== undefined ? { reminder_time: rest.reminderTime } : {}),
      ...(rest.colorToken !== undefined ? { color_token: rest.colorToken } : {}),
      ...(rest.restDayEnabled !== undefined ? { rest_day_enabled: rest.restDayEnabled } : {}),
      ...(archived !== undefined ? { archived_at: archived ? new Date().toISOString() : null } : {}),
    })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Couldn't update that habit." }, { status: 500 });
  return NextResponse.json({ habit: data });
}
