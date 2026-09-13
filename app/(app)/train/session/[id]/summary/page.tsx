import { createClient } from "@/lib/supabase/server";
import { SessionSummary } from "@/components/train/session/SessionSummary";
import type { ProgressionDecision } from "@/lib/progression/types";

export default async function SessionSummaryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: sessionId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: session } = await supabase.from("workout_sessions").select("started_at, ended_at").eq("id", sessionId).eq("user_id", user.id).single();
  const { data: setLogs } = await supabase.from("set_logs").select("load_kg, reps, e1rm, e1rm_trusted, exercise_id, is_warmup").eq("session_id", sessionId);
  const { data: run } = await supabase.from("progression_runs").select("output").eq("session_id", sessionId).maybeSingle();

  const totalVolumeKg = (setLogs ?? []).reduce((s, l) => s + l.load_kg * l.reps, 0);
  const durationMinutes = session?.ended_at
    ? Math.max(1, Math.round((new Date(session.ended_at).getTime() - new Date(session.started_at).getTime()) / 60_000))
    : 0;

  // A quick PR check for the summary screen: any working set whose trusted
  // e1RM is the best this exercise has ever logged (excluding this session).
  let prCount = 0;
  for (const log of setLogs ?? []) {
    if (log.is_warmup || !log.e1rm_trusted || log.e1rm === null) continue;
    const { data: better } = await supabase
      .from("set_logs")
      .select("id")
      .eq("exercise_id", log.exercise_id)
      .eq("e1rm_trusted", true)
      .gte("e1rm", log.e1rm)
      .neq("session_id", sessionId)
      .limit(1)
      .maybeSingle();
    if (!better) prCount++;
  }

  const output = run?.output as { decisions?: ProgressionDecision[]; deloadReason?: string | null } | null;

  return (
    <SessionSummary
      totalVolumeKg={totalVolumeKg}
      setsCompleted={(setLogs ?? []).filter((l) => !l.is_warmup).length}
      durationMinutes={durationMinutes}
      prCount={prCount}
      decisions={output?.decisions ?? []}
      deloadReason={output?.deloadReason ?? null}
    />
  );
}
