/**
 * Web Worker entry point. Owns the PoseLandmarker instance AND the entire
 * FormSession pipeline (mirror, smooth, calibration, rep counting, rule
 * evaluation, cue selection) — the worker boundary is a transport change
 * around lib/form/session.ts, not a second copy of its logic.
 *
 * `self.onmessage` only, per the M5 plan. NOT verified against a live
 * camera in this environment (no webcam/worker runtime available here) —
 * built to the documented API surface and the M5 plan's architecture, but
 * flagged as needing a real-device smoke test before shipping.
 */
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { WASM_BASE_PATH, poseLandmarkerOptions } from "./modelConfig";
import { FormSession, type FrameOutput } from "./session";
import { getRuleSet } from "./rules/index";
import { kneeAngleAt } from "./rules/squatSide";
import { elbowAngleAt } from "./rules/pushup";
import { hipAngleAt } from "./rules/deadlift";
import type { NormalizedLandmark } from "./landmarks";

type InitMessage = {
  type: "init";
  exerciseSlug: string;
  cameraView: "side" | "front";
  requiredIndices: number[];
};
type FrameMessage = { type: "frame"; bitmap: ImageBitmap; tsMs: number };
type StopMessage = { type: "stop" };
type InMessage = InitMessage | FrameMessage | StopMessage;

type ReadyMessage = { type: "ready" };
type ResultMessage = { type: "result"; output: FrameOutput };
type ErrorMessage = { type: "error"; message: string };
type FinalizedMessage = { type: "finalized"; summary: ReturnType<FormSession["finalize"]> };
type OutMessage = ReadyMessage | ResultMessage | ErrorMessage | FinalizedMessage;

// The primary-angle function per rule set isn't itself serialisable across
// the worker boundary, so it's resolved here by slug rather than passed in.
const ANGLE_FN_BY_SLUG: Record<string, (landmarks: NormalizedLandmark[]) => number> = {
  "barbell-back-squat": kneeAngleAt,
  "dumbbell-goblet-squat": kneeAngleAt,
  "bodyweight-squat": kneeAngleAt,
  "push-up": elbowAngleAt,
  "barbell-deadlift": hipAngleAt,
  "barbell-overhead-press": elbowAngleAt,
  "dumbbell-shoulder-press": elbowAngleAt,
};

let landmarker: PoseLandmarker | null = null;
let session: FormSession | null = null;
let lastVideoTsMs = -1;
let inFlight = false;

async function initModel() {
  const fileset = await FilesetResolver.forVisionTasks(WASM_BASE_PATH);
  try {
    landmarker = await PoseLandmarker.createFromOptions(fileset, poseLandmarkerOptions("GPU"));
  } catch (gpuErr) {
    console.warn("[form/worker] GPU delegate unavailable, falling back to CPU:", gpuErr);
    landmarker = await PoseLandmarker.createFromOptions(fileset, poseLandmarkerOptions("CPU"));
  }
}

self.onmessage = async (event: MessageEvent<InMessage>) => {
  const msg = event.data;

  if (msg.type === "init") {
    try {
      if (!landmarker) await initModel();
      const ruleSet = getRuleSet(msg.exerciseSlug, msg.cameraView);
      const angleFn = ANGLE_FN_BY_SLUG[msg.exerciseSlug];
      if (!ruleSet || !angleFn) {
        post({ type: "error", message: `No form rules for "${msg.exerciseSlug}" (${msg.cameraView}).` });
        return;
      }
      session = new FormSession(ruleSet, msg.cameraView, msg.requiredIndices, angleFn);
      post({ type: "ready" });
    } catch (err) {
      post({ type: "error", message: err instanceof Error ? err.message : String(err) });
    }
    return;
  }

  if (msg.type === "frame") {
    const { bitmap, tsMs } = msg;
    if (!landmarker || !session || inFlight) {
      bitmap.close();
      return;
    }
    inFlight = true;
    try {
      // Strictly-increasing timestamp — detectForVideo throws on an
      // equal/decreasing one (ported from gesture-fps's discipline).
      const ts = tsMs > lastVideoTsMs ? tsMs : lastVideoTsMs + 1;
      lastVideoTsMs = ts;

      let result;
      try {
        result = landmarker.detectForVideo(bitmap, ts);
      } catch (err) {
        console.warn("[form/worker] detectForVideo failed on this frame:", err);
        post({ type: "result", output: session.emptyOutput(ts, false) });
        return;
      }

      const raw = (result.landmarks[0] as unknown as NormalizedLandmark[] | undefined) ?? null;
      const output = session.step(raw, ts);
      post({ type: "result", output });
    } finally {
      bitmap.close();
      inFlight = false;
    }
    return;
  }

  if (msg.type === "stop") {
    if (session) {
      const summary = session.finalize();
      post({ type: "finalized", summary });
    }
    return;
  }
};

function post(message: OutMessage) {
  (self as unknown as Worker).postMessage(message);
}
