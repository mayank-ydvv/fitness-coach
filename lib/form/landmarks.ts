/**
 * MediaPipe Pose Landmarker indices used by the rule sets. Named constants
 * so a rule file reads "HIP" not "23" — see spec §7 for the canonical list.
 */
export const LEFT_SHOULDER = 11;
export const RIGHT_SHOULDER = 12;
export const LEFT_ELBOW = 13;
export const RIGHT_ELBOW = 14;
export const LEFT_WRIST = 15;
export const RIGHT_WRIST = 16;
export const LEFT_HIP = 23;
export const RIGHT_HIP = 24;
export const LEFT_KNEE = 25;
export const RIGHT_KNEE = 26;
export const LEFT_ANKLE = 27;
export const RIGHT_ANKLE = 28;

export type NormalizedLandmark = { x: number; y: number; z: number; visibility: number };

/** Mirror once, immediately after detect (gesture-fps's discipline) —
 * everything downstream, including draw.ts, lives in this one mirrored
 * space. x -> 1-x; y/z/visibility unchanged. */
export function mirrorLandmarks(landmarks: NormalizedLandmark[]): NormalizedLandmark[] {
  return landmarks.map((p) => ({ x: 1 - p.x, y: p.y, z: p.z, visibility: p.visibility }));
}

/**
 * True if every required landmark index is present and its visibility
 * clears the threshold. The single chokepoint for the "is `visibility` a
 * real number" risk (M5 plan risk #1, MediaPipe issue #4479) — if it turns
 * out to always be 0/undefined on a real device, this is the only
 * function that needs to change (fall back to in-frame-bounds + inter-
 * frame displacement stability, per the plan).
 */
export function visibleEnough(landmarks: NormalizedLandmark[] | undefined, requiredIndices: number[], threshold = 0.6): boolean {
  if (!landmarks) return false;
  return requiredIndices.every((i) => {
    const lm = landmarks[i];
    return lm !== undefined && lm.visibility >= threshold;
  });
}

/** Side selection for exercises where the near/far leg can flip
 * (superimposed legs in a side-view squat/deadlift — M5 plan risk #2).
 * Picks whichever side (left/right) has higher mean visibility across the
 * hip/knee/ankle triad; callers should latch this choice for the whole set
 * rather than re-deciding every frame. */
export function pickVisibleSide(landmarks: NormalizedLandmark[]): "left" | "right" {
  const leftMean = mean([landmarks[LEFT_HIP]?.visibility, landmarks[LEFT_KNEE]?.visibility, landmarks[LEFT_ANKLE]?.visibility]);
  const rightMean = mean([landmarks[RIGHT_HIP]?.visibility, landmarks[RIGHT_KNEE]?.visibility, landmarks[RIGHT_ANKLE]?.visibility]);
  return rightMean >= leftMean ? "right" : "left";
}

function mean(values: (number | undefined)[]): number {
  const nums = values.filter((v): v is number => v !== undefined);
  if (nums.length === 0) return 0;
  return nums.reduce((s, v) => s + v, 0) / nums.length;
}
