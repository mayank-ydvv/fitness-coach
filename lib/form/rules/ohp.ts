import { angleFromVertical, toPoint } from "../geometry";
import { LEFT_HIP, LEFT_SHOULDER, LEFT_WRIST, RIGHT_HIP, RIGHT_SHOULDER, RIGHT_WRIST, pickVisibleSide } from "../landmarks";
import { elbowAngleAt } from "./pushup";
import type { Fault, FormRuleSet, RuleEvaluationInput } from "./types";

/** Overhead press, side view. Primary angle: elbow (shoulder-elbow-wrist). */
export const DEFAULT_THRESHOLDS = {
  lockout_alignment: { maxSpread: 0.05 },
  lumbar_extension: { maxLean: 15 },
};

function evaluate({ rep, repIndex, frames, thresholds }: RuleEvaluationInput): Fault[] {
  const t = { ...DEFAULT_THRESHOLDS, ...thresholds } as typeof DEFAULT_THRESHOLDS;
  const faults: Fault[] = [];
  if (frames.length === 0) return faults;

  // "At the top" = the frame closest to this rep's max elbow angle.
  let topFrame = frames[0];
  let topDiff = Infinity;
  for (const f of frames) {
    const diff = Math.abs(elbowAngleAt(f) - rep.maxAngle);
    if (diff < topDiff) {
      topDiff = diff;
      topFrame = f;
    }
  }

  const side = pickVisibleSide(topFrame);
  const [wrist, shoulder, hip] = side === "left" ? [LEFT_WRIST, LEFT_SHOULDER, LEFT_HIP] : [RIGHT_WRIST, RIGHT_SHOULDER, RIGHT_HIP];
  const wristX = toPoint(topFrame[wrist]).x;
  const shoulderX = toPoint(topFrame[shoulder]).x;
  const hipX = toPoint(topFrame[hip]).x;
  const spread = Math.max(wristX, shoulderX, hipX) - Math.min(wristX, shoulderX, hipX);
  if (spread > t.lockout_alignment.maxSpread) {
    faults.push({ code: "lockout_alignment", severity: "major", cue: "Stack the bar over your shoulder and hip at the top.", atRep: repIndex });
  }

  const lean = Math.abs(angleFromVertical(toPoint(topFrame[hip]), toPoint(topFrame[shoulder])));
  if (lean > t.lumbar_extension.maxLean) {
    faults.push({ code: "lumbar_extension", severity: "major", cue: "Ribs down, squeeze your glutes.", atRep: repIndex });
  }

  return faults;
}

export const ohp: FormRuleSet = {
  primaryAngle: "elbow",
  cameraView: "side",
  evaluate,
  defaultThresholds: DEFAULT_THRESHOLDS,
};
