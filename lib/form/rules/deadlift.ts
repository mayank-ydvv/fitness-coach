import { angleAt, toPoint, verticalDelta } from "../geometry";
import { LEFT_HIP, LEFT_KNEE, LEFT_SHOULDER, LEFT_WRIST, RIGHT_HIP, RIGHT_KNEE, RIGHT_SHOULDER, RIGHT_WRIST, pickVisibleSide } from "../landmarks";
import type { Fault, FormRuleSet, RuleEvaluationInput } from "./types";

/** Deadlift, side view. Primary angle: hip (shoulder-hip-knee). */
export const DEFAULT_THRESHOLDS = {
  hips_shoot_up: { ratio: 1.4, windowFraction: 0.3 },
  bar_path: { maxDrift: 0.06 },
  lockout: { minTopAngle: 170 },
};

export function hipAngleAt(landmarks: Parameters<typeof pickVisibleSide>[0]): number {
  const side = pickVisibleSide(landmarks);
  const [shoulder, hip, knee] = side === "left" ? [LEFT_SHOULDER, LEFT_HIP, LEFT_KNEE] : [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_KNEE];
  return angleAt(toPoint(landmarks[shoulder]), toPoint(landmarks[hip]), toPoint(landmarks[knee]));
}

function evaluate({ repIndex, frames, thresholds }: RuleEvaluationInput): Fault[] {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds } as typeof DEFAULT_THRESHOLDS;
  const faults: Fault[] = [];
  if (frames.length < 3) return faults;

  const angles = frames.map((f) => hipAngleAt(f));
  const bottomIdx = angles.indexOf(Math.min(...angles));

  // hips_shoot_up: first 30% of the concentric (bottom -> top) window.
  const concentricFrames = frames.slice(bottomIdx);
  const windowLen = Math.max(1, Math.round(concentricFrames.length * t.hips_shoot_up.windowFraction));
  const windowEndIdx = Math.min(concentricFrames.length - 1, windowLen);
  if (windowEndIdx > 0) {
    const side = pickVisibleSide(concentricFrames[0]);
    const [shoulder, hip] = side === "left" ? [LEFT_SHOULDER, LEFT_HIP] : [RIGHT_SHOULDER, RIGHT_HIP];
    const hipDy = Math.abs(verticalDelta(toPoint(concentricFrames[0][hip]), toPoint(concentricFrames[windowEndIdx][hip])));
    const shoulderDy = Math.abs(verticalDelta(toPoint(concentricFrames[0][shoulder]), toPoint(concentricFrames[windowEndIdx][shoulder])));
    if (shoulderDy > 0 && hipDy > shoulderDy * t.hips_shoot_up.ratio) {
      faults.push({ code: "hips_shoot_up", severity: "major", cue: "Push the floor, drive your chest up with the hips.", atRep: repIndex });
    }
  }

  // bar_path: wrist x drift across the whole rep.
  const wristXs = frames.map((f) => {
    const side = pickVisibleSide(f);
    return toPoint(f[side === "left" ? LEFT_WRIST : RIGHT_WRIST]).x;
  });
  const drift = Math.max(...wristXs) - Math.min(...wristXs);
  if (drift > t.bar_path.maxDrift) {
    faults.push({ code: "bar_path", severity: "minor", cue: "Keep the bar close — drag it up your shins and thighs.", atRep: repIndex });
  }

  // lockout: hip angle at the top (last frame).
  const topAngle = angles[angles.length - 1];
  if (topAngle < t.lockout.minTopAngle) {
    faults.push({ code: "lockout", severity: "minor", cue: "Finish tall — squeeze your glutes at the top.", atRep: repIndex });
  }

  return faults;
}

export const deadlift: FormRuleSet = {
  primaryAngle: "hip",
  cameraView: "side",
  evaluate,
  defaultThresholds: DEFAULT_THRESHOLDS,
};
