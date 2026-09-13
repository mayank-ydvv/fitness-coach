import type { NormalizedLandmark } from "../landmarks";
import type { RepRecord } from "../repMachine";

export type FaultSeverity = "minor" | "major";
export type Fault = { code: string; severity: FaultSeverity; cue: string; atRep: number };

/** `exercises.form_rules` (0004/0012 migrations) stores thresholds ONLY as
 * plain numbers — evaluators (this file's implementations) own the logic
 * and are unit-tested; a threshold tweak is a migration, a logic change is
 * a deploy (M5 plan decision). */
export type FormRuleThresholds = Record<string, Record<string, number>>;

export type RuleEvaluationInput = {
  rep: RepRecord;
  repIndex: number;
  /** The full landmark stream for this rep, one entry per frame, in the
   * mirrored space. Some rules (hips_shoot_up, bar_path) need the frame-
   * by-frame path, not just the min/max summary. */
  frames: NormalizedLandmark[][];
  thresholds: FormRuleThresholds;
};

export type RuleEvaluator = (input: RuleEvaluationInput) => Fault[];

export type FormRuleSet = {
  primaryAngle: string;
  cameraView: "side" | "front";
  evaluate: RuleEvaluator;
  defaultThresholds: FormRuleThresholds;
};
