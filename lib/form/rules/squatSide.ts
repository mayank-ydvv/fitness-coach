import { angleAt, angleFromVertical, toPoint } from "../geometry";
import { LEFT_ANKLE, LEFT_HIP, LEFT_KNEE, LEFT_SHOULDER, RIGHT_ANKLE, RIGHT_HIP, RIGHT_KNEE, RIGHT_SHOULDER, pickVisibleSide } from "../landmarks";
import type { Fault, FormRuleSet, RuleEvaluationInput } from "./types";

/** Back squat / goblet squat, side view. Primary angle: knee (hip-knee-ankle). */
export const DEFAULT_THRESHOLDS = {
  depth: { full: 95, partial: 120 },
  torso_lean: { max: 55 },
  tempo: { minEccentricMs: 600 },
  depth_consistency: { maxSpread: 15 },
};

export function kneeAngleAt(landmarks: Parameters<typeof pickVisibleSide>[0]): number {
  const side = pickVisibleSide(landmarks);
  const [hip, knee, ankle] = side === "left" ? [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE] : [RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE];
  return angleAt(toPoint(landmarks[hip]), toPoint(landmarks[knee]), toPoint(landmarks[ankle]));
}

function evaluate({ rep, repIndex, frames, thresholds }: RuleEvaluationInput): Fault[] {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds } as typeof DEFAULT_THRESHOLDS;
  const faults: Fault[] = [];

  // depth
  if (rep.minAngle > t.depth.partial) {
    faults.push({ code: "depth", severity: "major", cue: "Sit deeper.", atRep: repIndex });
  } else if (rep.minAngle > t.depth.full) {
    faults.push({ code: "depth", severity: "minor", cue: "Sit deeper.", atRep: repIndex });
  }

  // torso_lean, measured AT the bottom frame (closest to minAngle)
  if (frames.length > 0) {
    let bottomFrame = frames[0];
    let bottomDiff = Infinity;
    for (const f of frames) {
      const diff = Math.abs(kneeAngleAt(f) - rep.minAngle);
      if (diff < bottomDiff) {
        bottomDiff = diff;
        bottomFrame = f;
      }
    }
    const side = pickVisibleSide(bottomFrame);
    const [hip, shoulder] = side === "left" ? [LEFT_HIP, LEFT_SHOULDER] : [RIGHT_HIP, RIGHT_SHOULDER];
    const lean = Math.abs(angleFromVertical(toPoint(bottomFrame[hip]), toPoint(bottomFrame[shoulder])));
    if (lean > t.torso_lean.max) {
      faults.push({ code: "torso_lean", severity: "major", cue: "Chest up.", atRep: repIndex });
    }
  }

  // tempo
  if (rep.eccentricMs < t.tempo.minEccentricMs) {
    faults.push({ code: "tempo", severity: "minor", cue: "Slower on the way down.", atRep: repIndex });
  }

  return faults;
}

/** depth_consistency is a whole-set check (spread of per-rep min knee angle),
 * not a per-rep one — called once after the set, not from `evaluate`. */
function evaluateSet(reps: { minAngle: number }[], thresholds: Record<string, Record<string, number>>): Fault[] {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds } as typeof DEFAULT_THRESHOLDS;
  if (reps.length < 2) return [];
  const angles = reps.map((r) => r.minAngle);
  const spread = Math.max(...angles) - Math.min(...angles);
  if (spread > t.depth_consistency.maxSpread) {
    return [{ code: "depth_consistency", severity: "minor", cue: "Depth is drifting rep to rep — fatigue, or slow down and reset your position.", atRep: reps.length - 1 }];
  }
  return [];
}

export const squatSide: FormRuleSet & { evaluateSet: typeof evaluateSet } = {
  primaryAngle: "knee",
  cameraView: "side",
  evaluate,
  evaluateSet,
  defaultThresholds: DEFAULT_THRESHOLDS,
};
