import { angleAt, toPoint } from "../geometry";
import { LEFT_ELBOW, LEFT_HIP, LEFT_KNEE, LEFT_SHOULDER, LEFT_WRIST, RIGHT_ELBOW, RIGHT_HIP, RIGHT_KNEE, RIGHT_SHOULDER, RIGHT_WRIST, pickVisibleSide } from "../landmarks";
import type { Fault, FormRuleSet, RuleEvaluationInput } from "./types";

/** Push-up, side view. Primary angle: elbow (shoulder-elbow-wrist). */
export const DEFAULT_THRESHOLDS = {
  depth: { full: 95, shallow: 110 },
  hip_sag: { sagMax: 160, pikeMin: 190 },
};

function evaluate({ rep, repIndex, frames, thresholds }: RuleEvaluationInput): Fault[] {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds } as typeof DEFAULT_THRESHOLDS;
  const faults: Fault[] = [];

  if (rep.minAngle > t.depth.shallow) {
    faults.push({ code: "depth", severity: "major", cue: "Lower your chest closer to the floor.", atRep: repIndex });
  } else if (rep.minAngle > t.depth.full) {
    faults.push({ code: "depth", severity: "minor", cue: "A little deeper next rep.", atRep: repIndex });
  }

  let worstSag = Infinity;
  let worstPike = -Infinity;
  for (const f of frames) {
    const side = pickVisibleSide(f);
    const [shoulder, hip, knee] = side === "left" ? [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE] : [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE];
    const hipAngle = angleAt(toPoint(f[shoulder]), toPoint(f[hip]), toPoint(f[knee]));
    worstSag = Math.min(worstSag, hipAngle);
    worstPike = Math.max(worstPike, hipAngle);
  }
  if (worstSag < t.hip_sag.sagMax) {
    faults.push({ code: "hip_sag", severity: "major", cue: "Squeeze your glutes.", atRep: repIndex });
  } else if (worstPike > t.hip_sag.pikeMin) {
    faults.push({ code: "hip_sag", severity: "minor", cue: "Drop your hips.", atRep: repIndex });
  }

  return faults;
}

// Referenced for the primary-angle computation elsewhere (session.ts) —
// re-exported so the angle definition lives in exactly one place per exercise.
export function elbowAngleAt(landmarks: Parameters<typeof pickVisibleSide>[0]): number {
  const side = pickVisibleSide(landmarks);
  const [shoulder, elbow, wrist] = side === "left" ? [LEFT_SHOULDER, LEFT_ELBOW, LEFT_WRIST] : [RIGHT_SHOULDER, RIGHT_ELBOW, RIGHT_WRIST];
  return angleAt(toPoint(landmarks[shoulder]), toPoint(landmarks[elbow]), toPoint(landmarks[wrist]));
}

export const pushup: FormRuleSet = {
  primaryAngle: "elbow",
  cameraView: "side",
  evaluate,
  defaultThresholds: DEFAULT_THRESHOLDS,
};
