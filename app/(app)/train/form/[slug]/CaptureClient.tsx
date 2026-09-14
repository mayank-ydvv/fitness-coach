"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useFormSession } from "@/hooks/useFormSession";
import { CameraStage } from "@/components/form/CameraStage";
import { SetupBriefing } from "@/components/form/SetupBriefing";
import { CalibrationGate } from "@/components/form/CalibrationGate";
import { CueBanner } from "@/components/form/CueBanner";
import { RepCounter } from "@/components/form/RepCounter";
import { ConfidenceBar } from "@/components/form/ConfidenceBar";
import { LEFT_ANKLE, LEFT_HIP, LEFT_KNEE, LEFT_SHOULDER, RIGHT_ANKLE, RIGHT_HIP, RIGHT_KNEE, RIGHT_SHOULDER } from "@/lib/form/landmarks";

/**
 * This is the ONLY module that imports @mediapipe/tasks-vision (indirectly,
 * via useFormSession -> lib/form/workerClient.ts -> the worker bundle) —
 * behind next/dynamic({ssr:false}) in the parent page, so the WASM never
 * touches the main bundle. NOT verified against a live camera in this
 * environment.
 */
export function CaptureClient({
  exerciseId,
  exerciseSlug,
  exerciseName,
  cameraView,
}: {
  exerciseId: string;
  exerciseSlug: string;
  exerciseName: string;
  cameraView: "side" | "front";
}) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const requiredIndices = [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_SHOULDER];

  const session = useFormSession({
    exerciseSlug,
    cameraView,
    requiredIndices,
    videoRef,
    canvasRef,
    active: started,
  });

  async function handleStop() {
    session.stop();
    // Give the worker's "finalized" message a moment to arrive.
    await new Promise((r) => setTimeout(r, 300));
    if (!session.summary) return;

    setSubmitting(true);
    const res = await fetch("/api/form/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        exerciseId,
        cameraView,
        repCount: session.summary.reps.length,
        overallScore: session.summary.overallScore,
        repMetrics: session.summary.reps.map((rep, i) => ({
          repIndex: i,
          minAngle: rep.minAngle,
          maxAngle: rep.maxAngle,
          eccentricMs: rep.eccentricMs,
          concentricMs: rep.concentricMs,
          score: session.summary!.repScores[i] ?? 0,
          faults: (session.summary!.faultsByRep[i] ?? []).map((f) => ({ code: f.code, severity: f.severity })),
        })),
        faults: Object.entries(
          session.summary.faultsByRep.flat().reduce<Record<string, { severity: string; count: number }>>((acc, f) => {
            acc[f.code] = { severity: f.severity, count: (acc[f.code]?.count ?? 0) + 1 };
            return acc;
          }, {}),
        ).map(([code, v]) => ({ code, severity: v.severity, count: v.count })),
        exerciseName,
        framesDropped: session.summary.gapFrames,
        framesTotal: session.summary.totalFrames,
      }),
    });
    setSubmitting(false);
    if (res.ok) {
      const { analysis } = await res.json();
      router.push(`/train/form/${exerciseSlug}/result/${analysis.id}`);
    }
  }

  if (!started) {
    return (
      <div className="flex flex-col gap-4">
        <SetupBriefing view={cameraView} />
        <Button size="lg" onClick={() => setStarted(true)} className="w-full">
          Start
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <CameraStage videoRef={videoRef} canvasRef={canvasRef}>
        <CalibrationGate viewOk={session.viewOk} calibrated={session.calibrated} />
        {session.calibrated ? <RepCounter count={session.repCount} phase={session.phase} /> : null}
        {session.calibrated ? <CueBanner cue={session.activeCue} /> : null}
      </CameraStage>

      <ConfidenceBar framesTotal={session.framesTotal} framesDropped={session.framesDropped} onRerecord={() => setStarted(false)} />

      {session.errorMessage ? <p className="text-sm text-action-danger">{session.errorMessage}</p> : null}

      <Button size="lg" disabled={submitting} onClick={handleStop} className="w-full">
        {submitting ? "Analyzing…" : "Stop and review"}
      </Button>
    </div>
  );
}
