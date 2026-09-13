"use client";

import { useEffect, useRef, useState } from "react";
import { FormWorkerClient } from "@/lib/form/workerClient";
import { drawSkeleton } from "@/lib/form/draw";
import type { FrameOutput, FormSession } from "@/lib/form/session";

/**
 * Camera acquisition (via useCamera, composed by the caller), rAF loop,
 * worker plumbing, phase state, throttled React updates — React only
 * re-renders when repCount/phase/activeCue/calibrated actually change,
 * never per frame (the canvas draw happens outside React entirely).
 *
 * NOT verified against a live camera/worker in this environment.
 */
export function useFormSession(params: {
  exerciseSlug: string;
  cameraView: "side" | "front";
  requiredIndices: number[];
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  active: boolean;
}) {
  const [phase, setPhase] = useState<FrameOutput["phase"]>("top");
  const [repCount, setRepCount] = useState(0);
  const [activeCue, setActiveCue] = useState<string | null>(null);
  const [calibrated, setCalibrated] = useState(false);
  const [viewOk, setViewOk] = useState<boolean | "ambiguous">(false);
  const [ready, setReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [summary, setSummary] = useState<ReturnType<FormSession["finalize"]> | null>(null);

  const clientRef = useRef<FormWorkerClient | null>(null);
  const rafRef = useRef<number | null>(null);
  const framesTotalRef = useRef(0);
  const framesDroppedRef = useRef(0);
  const lastVideoTimeRef = useRef(-1);

  useEffect(() => {
    if (!params.active) return;

    const client = new FormWorkerClient();
    clientRef.current = client;

    client.setHandlers({
      onReady: () => setReady(true),
      onError: (message) => setErrorMessage(message),
      onFinalized: (finalSummary) => setSummary(finalSummary),
      onResult: (output) => {
        framesTotalRef.current++;
        if (output.dropped) framesDroppedRef.current++;

        setPhase((prev) => (prev === output.phase ? prev : output.phase));
        setRepCount((prev) => (prev === output.repCount ? prev : output.repCount));
        setActiveCue((prev) => (prev === output.activeCue ? prev : output.activeCue));
        setCalibrated((prev) => (prev === output.calibrated ? prev : output.calibrated));
        setViewOk((prev) => (prev === output.viewOk ? prev : output.viewOk));

        const canvas = params.canvasRef.current;
        if (canvas && output.landmarks) {
          const ctx = canvas.getContext("2d");
          if (ctx) drawSkeleton(ctx, output.landmarks, canvas.width, canvas.height, output.faultSeverityByJoint);
        } else if (canvas) {
          canvas.getContext("2d")?.clearRect(0, 0, canvas.width, canvas.height);
        }
      },
    });

    client.init({ exerciseSlug: params.exerciseSlug, cameraView: params.cameraView, requiredIndices: params.requiredIndices });

    function loop() {
      const video = params.videoRef.current;
      // Only submit when the video actually produced a new frame — ported
      // from gesture-fps's discipline, avoids redundant inference on a
      // rAF tick that fires faster than the camera delivers frames.
      if (video && video.readyState >= 2 && video.currentTime !== lastVideoTimeRef.current) {
        lastVideoTimeRef.current = video.currentTime;
        client.submitFrame(video, performance.now());
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      client.terminate();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.active, params.exerciseSlug, params.cameraView]);

  function stop() {
    clientRef.current?.stop();
  }

  return {
    ready,
    phase,
    repCount,
    activeCue,
    calibrated,
    viewOk,
    errorMessage,
    summary,
    framesTotal: framesTotalRef.current,
    framesDropped: framesDroppedRef.current,
    stop,
  };
}
