import { horizontalDistance, toPoint } from "../geometry";
import { LEFT_ANKLE, LEFT_KNEE, RIGHT_ANKLE, RIGHT_KNEE } from "../landmarks";
import { squatSide, DEFAULT_THRESHOLDS as SIDE_DEFAULTS } from "./squatSide";
import type { Fault, FormRuleSet, RuleEvaluationInput } from "./types";

/** Back squat, front view — adds knee_valgus on top of squatSide's
 * depth/torso_lean/tempo (torso_lean is less meaningful from the front,
 * but harmless to keep; the spec frames this view as strictly additive). */
export const DEFAULT_THRESHOLDS = {
  ...SIDE_DEFAULTS,
  knee_valgus: { maxDrift: 0.05 },
};

function evaluate(input: RuleEvaluationInput): Fault[] {
  const t = { ...DEFAULT_THRESHOLDS, ...input.thresholds } as typeof DEFAULT_THRESHOLDS;
  const faults = squatSide.evaluate(input).filter((f) => f.code !== "torso_lean"); // not meaningful front-on

  let worstDrift = 0;
  for (const frame of input.frames) {
    const leftDrift = signedMedialDrift(toPoint(frame[LEFT_KNEE]).x, toPoint(frame[LEFT_ANKLE]).x, "left");
    const rightDrift = signedMedialDrift(toPoint(frame[RIGHT_KNEE]).x, toPoint(frame[RIGHT_ANKLE]).x, "right");
    worstDrift = Math.max(worstDrift, leftDrift, rightDrift);
  }
  if (worstDrift > t.knee_valgus.maxDrift) {
    faults.push({ code: "knee_valgus", severity: "major", cue: "Push your knees out.", atRep: input.repIndex });
  }

  return faults;
}

/** Positive = the knee has drifted toward the body's midline (x=0.5)
 * relative to the ankle — i.e. valgus. `side` picks which direction
 * "toward the midline" is. */
function signedMedialDrift(kneeX: number, ankleX: number, side: "left" | "right"): number {
  const drift = horizontalDistance({ x: kneeX, y: 0 }, { x: ankleX, y: 0 });
  const towardMidline = side === "left" ? kneeX > ankleX : kneeX < ankleX;
  return towardMidline ? drift : 0;
}

export const squatFront: FormRuleSet = {
  primaryAngle: "knee",
  cameraView: "front",
  evaluate,
  defaultThresholds: DEFAULT_THRESHOLDS,
};
