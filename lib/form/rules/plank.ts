import { angleAt, toPoint } from "../geometry";
import { LEFT_ANKLE, LEFT_HIP, LEFT_SHOULDER, RIGHT_ANKLE, RIGHT_HIP, RIGHT_SHOULDER, pickVisibleSide } from "../landmarks";
import type { Fault, FormRuleSet, RuleEvaluationInput } from "./types";

/**
 * Plank, side view. No rep counting — a hold timer instead (spec §7), so
 * this bypasses lib/form/repMachine.ts entirely. `evaluate` exists only to
 * satisfy the FormRuleSet shape for the registry; the real entry point for
 * an isometric hold is `evaluateHold`, called continuously by session.ts's
 * hold-timer variant rather than once per completed rep.
 */
export const DEFAULT_THRESHOLDS = {
  alignment: { min: 165, max: 185, sustainedMs: 2000 },
};

export function alignmentAngleAt(landmarks: Parameters<typeof pickVisibleSide>[0]): number {
  const side = pickVisibleSide(landmarks);
  const [shoulder, hip, ankle] = side === "left" ? [LEFT_SHOULDER, LEFT_HIP, LEFT_ANKLE] : [RIGHT_SHOULDER, RIGHT_HIP, RIGHT_ANKLE];
  return angleAt(toPoint(landmarks[shoulder]), toPoint(landmarks[hip]), toPoint(landmarks[ankle]));
}

/** Stateful — call once per frame with (angle, tsMs). Returns a fault only
 * on the frame the 2-second sustained-misalignment threshold is crossed
 * (an edge, not a repeated fault every frame after). */
export class PlankHoldEvaluator {
  private badSince: number | null = null;
  private fired = false;

  step(angle: number, tsMs: number, thresholds: Record<string, Record<string, number>> = {}): Fault | null {
    const t = { ...DEFAULT_THRESHOLDS, ...thresholds } as typeof DEFAULT_THRESHOLDS;
    const bad = angle < t.alignment.min || angle > t.alignment.max;
    if (!bad) {
      this.badSince = null;
      this.fired = false;
      return null;
    }
    if (this.badSince === null) this.badSince = tsMs;
    if (!this.fired && tsMs - this.badSince >= t.alignment.sustainedMs) {
      this.fired = true;
      const sagging = angle < t.alignment.min;
      return { code: "alignment", severity: "major", cue: sagging ? "Lift your hips — straight line from shoulders to ankles." : "Drop your hips slightly.", atRep: 0 };
    }
    return null;
  }

  reset() {
    this.badSince = null;
    this.fired = false;
  }
}

function evaluate(_input: RuleEvaluationInput): Fault[] {
  return []; // unused — see class doc; plank never produces RepRecords to evaluate
}

export const plank: FormRuleSet = {
  primaryAngle: "hip",
  cameraView: "side",
  evaluate,
  defaultThresholds: DEFAULT_THRESHOLDS,
};
