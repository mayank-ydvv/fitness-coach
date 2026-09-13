/**
 * Self-hosted wasm/model paths (M5 plan decision — availability/supply-
 * chain, not offline support). `/mediapipe/wasm` and `/models/` are static
 * assets synced by `scripts/sync-mediapipe-wasm.mjs` (wasm) and downloaded
 * once (the .task model) — see CLAUDE.md. Pin the npm package with no
 * caret so the JS (bundled normally) and the wasm (served statically) can
 * never drift apart (MediaPipe issue #5195 is exactly that mismatch).
 */
export const WASM_BASE_PATH = "/mediapipe/wasm";
export const POSE_MODEL_PATH = "/models/pose_landmarker_lite.task";

/**
 * `canvas: new OffscreenCanvas(1, 1)` is not optional in a worker: the
 * bundle resolves its GL canvas as
 * `options.canvas ?? (supportsOffscreenCanvas() ? undefined : document.createElement('canvas'))`,
 * and `supportsOffscreenCanvas()` is false on Safari < 17 — inside a
 * worker that hits `document is not defined` and crashes model creation
 * outright (M5 plan risk #3). Passing this explicitly short-circuits it on
 * every browser, not just the ones where it would otherwise fail.
 */
export function poseLandmarkerOptions(delegate: "GPU" | "CPU") {
  return {
    baseOptions: {
      modelAssetPath: POSE_MODEL_PATH,
      delegate,
    },
    runningMode: "VIDEO" as const,
    numPoses: 1,
    minPoseDetectionConfidence: 0.5,
    minPosePresenceConfidence: 0.5,
    minTrackingConfidence: 0.5,
    canvas: typeof OffscreenCanvas !== "undefined" ? new OffscreenCanvas(1, 1) : undefined,
  };
}
