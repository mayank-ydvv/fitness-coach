import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const LogHabitSchema = z.object({
  habitId: z.uuid(),
  logDate: z.iso.date(),
  status: z.enum(["done", "skipped"]),
});

/** Idempotent upsert on (habit_id, log_date). The reject_stale_habit_log
 * trigger (0006) enforces last-write-wins on `updated_at` at the DB level —
 * this route just always sends the current timestamp, so a client replay
 * (e.g. from the future M6 offline outbox) is safe by construction. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = LogHabitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const { habitId, logDate, status } = parsed.data;

  const { data, error } = await supabase
    .from("habit_logs")
    .upsert(
      { habit_id: habitId, user_id: user.id, log_date: logDate, status, source: "user", updated_at: new Date().toISOString() },
      { onConflict: "habit_id,log_date" },
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Couldn't save that." }, { status: 500 });
  return NextResponse.json({ log: data });
}
