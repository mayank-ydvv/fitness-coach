import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { applyProgressionForSession } from "@/lib/progression/apply";
import { applyAutoHabits } from "@/lib/habits/apply";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const { data: session } = await supabase.from("workout_sessions").select("id, ended_at").eq("id", sessionId).eq("user_id", user.id).maybeSingle();
  if (!session) return NextResponse.json({ error: "Session not found." }, { status: 404 });

  if (!session.ended_at) {
    const { error: endError } = await supabase.from("workout_sessions").update({ ended_at: new Date().toISOString() }).eq("id", sessionId);
    if (endError) return NextResponse.json({ error: "Couldn't close the session." }, { status: 500 });
  }

  await applyAutoHabits(supabase, { userId: user.id, trigger: "workout_completed" });

  const { data: setLogs } = await supabase.from("set_logs").select("load_kg, reps").eq("session_id", sessionId);
  const totalVolume = (setLogs ?? []).reduce((sum, s) => sum + s.load_kg * s.reps, 0);

  try {
    // progression_runs and the cross-week planned_sets rewrite have no
    // client-writable RLS policy by design (see lib/supabase/admin.ts) —
    // this must run on the admin client or every write silently no-ops.
    const { decisions, deloadReason } = await applyProgressionForSession(createAdminClient(), { userId: user.id, sessionId });
    return NextResponse.json({
      totalVolumeKg: totalVolume,
      setsCompleted: setLogs?.length ?? 0,
      decisions,
      deloadReason,
    });
  } catch (err) {
    // The session itself is already closed above — a progression failure
    // shouldn't block the user from seeing their summary.
    console.error("[session_finish] progression failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ totalVolumeKg: totalVolume, setsCompleted: setLogs?.length ?? 0, decisions: [], deloadReason: null });
  }
}
