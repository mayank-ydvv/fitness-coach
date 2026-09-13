import type { NormalizedLandmark } from "./landmarks";
import type { Fault } from "./rules/types";

// MediaPipe's canonical pose connections for a simple skeleton (subset —
// only the joints this app's rules ever use; a full 33-point skeleton
// would draw the face mesh points too, which is noise here).
const CONNECTIONS: [number, number][] = [
  [11, 13], [13, 15], // left arm
  [12, 14], [14, 16], // right arm
  [11, 12], // shoulders
  [23, 24], // hips
  [11, 23], [12, 24], // torso sides
  [23, 25], [25, 27], // left leg
  [24, 26], [26, 28], // right leg
];

const TONE_STROKE: Record<Fault["severity"], string> = {
  major: "#C8443C", // --color-load-red
  minor: "#E0B33C", // --color-load-yellow
};
const DEFAULT_STROKE = "#3D7FD4"; // --color-load-blue

/**
 * Draw calls against a plain CanvasRenderingContext2D — takes the ctx,
 * owns no state. Runs on the main thread (see M5 plan: the overlay stays
 * main-thread even though inference runs in the worker, since the canvas
 * has to be pixel-registered to a CSS-laid-out <video> box).
 */
export function drawSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: NormalizedLandmark[],
  width: number,
  height: number,
  faultSeverityByJoint: Record<number, Fault["severity"]> = {},
) {
  ctx.clearRect(0, 0, width, height);

  ctx.lineWidth = 3;
  for (const [a, b] of CONNECTIONS) {
    const pa = landmarks[a];
    const pb = landmarks[b];
    if (!pa || !pb) continue;
    ctx.strokeStyle = DEFAULT_STROKE;
    ctx.beginPath();
    ctx.moveTo(pa.x * width, pa.y * height);
    ctx.lineTo(pb.x * width, pb.y * height);
    ctx.stroke();
  }

  for (const [i, lm] of landmarks.entries()) {
    if (lm.visibility < 0.5) continue;
    const severity = faultSeverityByJoint[i];
    ctx.fillStyle = severity ? TONE_STROKE[severity] : DEFAULT_STROKE;
    ctx.beginPath();
    ctx.arc(lm.x * width, lm.y * height, 5, 0, 2 * Math.PI);
    ctx.fill();
  }
}
