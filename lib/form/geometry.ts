import type { NormalizedLandmark } from "./landmarks";

type Point = { x: number; y: number };

/** θ = acos((BA · BC) / (|BA||BC|)) in degrees, for joints a-b-c (spec §7). */
export function angleAt(a: Point, b: Point, c: Point): number {
  const ba = { x: a.x - b.x, y: a.y - b.y };
  const bc = { x: c.x - b.x, y: c.y - b.y };
  const dot = ba.x * bc.x + ba.y * bc.y;
  const magBa = Math.hypot(ba.x, ba.y);
  const magBc = Math.hypot(bc.x, bc.y);
  if (magBa === 0 || magBc === 0) return 0;
  const cos = Math.min(1, Math.max(-1, dot / (magBa * magBc)));
  return (Math.acos(cos) * 180) / Math.PI;
}

/** Angle of vector `from -> to` from vertical (the image y-axis), in
 * degrees, signed by x-direction. 0 = perfectly vertical. Used for
 * torso_lean/lumbar_extension. NOTE (M5 plan risk on camera roll): this
 * uses the image y-axis as "vertical", which drifts if the phone itself is
 * tilted — deriving vertical from the ankle->hip axis at TOP is the
 * documented fix for that, applied by the caller (rules/*.ts), not here. */
export function angleFromVertical(from: Point, to: Point): number {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const angle = (Math.atan2(dx, -dy) * 180) / Math.PI; // -dy: image y grows downward
  return angle;
}

/** Normalised-x horizontal distance between two points — used for
 * knee_valgus (knee drifting medial to ankle) and bar_path drift. */
export function horizontalDistance(a: Point, b: Point): number {
  return Math.abs(a.x - b.x);
}

/** Vertical (y) displacement, positive = moved down the image. Used for
 * hips_shoot_up's "hip Δy vs shoulder Δy" comparison. */
export function verticalDelta(from: Point, to: Point): number {
  return to.y - from.y;
}

export function toPoint(landmark: NormalizedLandmark | undefined): Point {
  if (!landmark) return { x: 0, y: 0 };
  return { x: landmark.x, y: landmark.y };
}
