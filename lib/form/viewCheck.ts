import { LEFT_SHOULDER, RIGHT_SHOULDER, type NormalizedLandmark } from "./landmarks";

export type CameraView = "side" | "front" | "ambiguous";

/**
 * Shoulder-width in normalised x: <0.08 implies side view, >0.15 implies
 * front view (spec §7). Anything between is ambiguous — a wrong view
 * produces a plain-language instruction, never a wrong score.
 */
export function detectView(landmarks: NormalizedLandmark[]): CameraView {
  const shoulderWidth = Math.abs(landmarks[LEFT_SHOULDER].x - landmarks[RIGHT_SHOULDER].x);
  if (shoulderWidth < 0.08) return "side";
  if (shoulderWidth > 0.15) return "front";
  return "ambiguous";
}

export function wrongViewMessage(required: "side" | "front", detected: CameraView): string | null {
  if (detected === required) return null;
  if (detected === "ambiguous") return "Can't tell your camera angle yet — adjust until you're clearly in frame.";
  if (required === "side") return "Turn the camera to your side — I can't see your hip angle from here.";
  return "Turn to face the camera — I need the front view for this check.";
}
