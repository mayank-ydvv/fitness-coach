import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateFormSummary } from "@/lib/ai/formSummary";
import { assertUnderDailyCap, recordAiJob, DailyCapError } from "@/lib/ai/jobs";
import { MODEL } from "@/lib/ai/client";

export const maxDuration = 30;

const RepMetricSchema = z.object({
  repIndex: z.number(),
  minAngle: z.number(),
  maxAngle: z.number(),
  eccentricMs: z.number(),
  concentricMs: z.number(),
  score: z.number(),
  faults: z.array(z.object({ code: z.string(), severity: z.enum(["minor", "major"]) })),
});

const SummarizeSchema = z.object({
  exerciseId: z.uuid(),
  sessionId: z.uuid().optional(),
  cameraView: z.enum(["side", "front"]),
  repCount: z.number().int().min(0),
  overallScore: z.number().min(0).max(100),
  repMetrics: z.array(RepMetricSchema),
  faults: z.array(z.object({ code: z.string(), severity: z.enum(["minor", "major"]), count: z.number() })),
  exerciseName: z.string(),
  framesDropped: z.number().min(0),
  framesTotal: z.number().min(0),
});

/** Numeric metrics in, write-up out — never images or video (spec §10.3,
 * §7's non-negotiable architecture). */
export async function POST(request: Request) {
  const started = Date.now();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = SummarizeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }
  const input = parsed.data;

  try {
    await assertUnderDailyCap(supabase, "form_summary");
  } catch (err) {
    if (err instanceof DailyCapError) {
      return NextResponse.json({ error: "rate_limited", message: `You've hit today's limit of ${err.limit} form summaries.` }, { status: 429 });
    }
    return NextResponse.json({ error: "Couldn't check your daily limit." }, { status: 500 });
  }

  const dropRatio = input.framesTotal > 0 ? input.framesDropped / input.framesTotal : 0;
  if (dropRatio > 0.2) {
    // Honesty requirement: offer a re-record rather than a score built on
    // too little data — never generate a write-up for it.
    return NextResponse.json({ error: "too_many_dropped_frames", message: "More than 20% of frames were dropped — try recording again with better lighting or framing." }, { status: 422 });
  }

  try {
    const summary = await generateFormSummary({
      exercise: input.exerciseName,
      cameraView: input.cameraView,
      repCount: input.repCount,
      overallScore: input.overallScore,
      repMetrics: input.repMetrics,
      faults: input.faults,
    });

    const { data: analysis, error: insertError } = await supabase
      .from("form_analyses")
      .insert({
        user_id: user.id,
        session_id: input.sessionId,
        exercise_id: input.exerciseId,
        camera_view: input.cameraView,
        rep_count: input.repCount,
        overall_score: Math.round(input.overallScore),
        rep_metrics: input.repMetrics,
        faults: input.faults,
        coach_summary: summary,
      })
      .select()
      .single();

    if (insertError) return NextResponse.json({ error: "Couldn't save that analysis." }, { status: 500 });

    await recordAiJob({ userId: user.id, kind: "form_summary", model: MODEL, status: "succeeded", latencyMs: Date.now() - started });

    return NextResponse.json({ analysis, summary });
  } catch (err) {
    await recordAiJob({
      userId: user.id,
      kind: "form_summary",
      model: MODEL,
      status: "failed",
      latencyMs: Date.now() - started,
      error: err instanceof Error ? err.message : String(err),
    });
    return NextResponse.json({ error: "Couldn't generate a summary right now." }, { status: 502 });
  }
}
