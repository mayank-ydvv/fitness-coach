import { LandmarkSmoother } from "./smoothing";
import { CalibrationGate } from "./calibration";
import { RepMachine, type Phase } from "./repMachine";
import { CueSelector } from "./cue";
import { detectView, wrongViewMessage, type CameraView } from "./viewCheck";
import { visibleEnough, mirrorLandmarks, type NormalizedLandmark } from "./landmarks";
import { scoreRep, overallScore } from "./scoring";
import type { Fault, FormRuleSet } from "./rules/types";

/**
 * The single stateful module for rep-counted exercises (plank's isometric
 * hold bypasses this entirely — see rules/plank.ts's PlankHoldEvaluator).
 * Everything else in lib/form/ is pure/stateless; this is where mirror,
 * smooth, calibration, rep counting, and cue selection all live together,
 * which is what makes the whole pipeline swappable between main-thread and
 * a Web Worker as a pure transport change (M5 plan: "build main-thread
 * first... then move the module behind the worker").
 */
export type FrameOutput = {
  tsMs: number;
  landmarks: NormalizedLandmark[] | null;
  phase: Phase;
  repCount: number;
  activeCue: string | null;
  faultSeverityByJoint: Record<number, Fault["severity"]>;
  dropped: boolean;
  calibrated: boolean;
  viewOk: boolean | "ambiguous";
};

export class FormSession {
  private smoother = new LandmarkSmoother(0.35);
  private calibration = new CalibrationGate();
  private repMachine = new RepMachine();
  private cueSelector = new CueSelector();

  private framesThisRep: NormalizedLandmark[][] = [];
  private faultsByRep: Fault[][] = [];
  private totalFrames = 0;
  private gapFrames = 0;

  constructor(
    private ruleSet: FormRuleSet,
    private requiredView: "side" | "front",
    private requiredIndices: number[],
    private primaryAngleFn: (landmarks: NormalizedLandmark[]) => number,
  ) {}

  step(raw: NormalizedLandmark[] | null, tsMs: number): FrameOutput {
    this.totalFrames++;

    if (!raw) {
      this.gapFrames++;
      this.smoother.reset(); // a real gap resets, per gesture-fps's discipline — no snapping on reappearance
      return this.emptyOutput(tsMs, true);
    }

    // Mirrored once, immediately after detect — everything downstream
    // (rules, draw.ts) lives in this mirrored space.
    const mirrored = mirrorLandmarks(raw);
    const smoothed = this.smoother.update(mirrored);
    if (!smoothed) return this.emptyOutput(tsMs, false);

    const view: CameraView = detectView(smoothed);
    const viewOk: boolean | "ambiguous" = view === this.requiredView ? true : view === "ambiguous" ? "ambiguous" : false;

    const calibrated = this.calibration.update(smoothed, this.requiredIndices, tsMs);
    if (!calibrated) {
      const msg = viewOk !== true ? wrongViewMessage(this.requiredView, view) : null;
      return { tsMs, landmarks: smoothed, phase: "top", repCount: this.repMachine.reps.length, activeCue: msg, faultSeverityByJoint: {}, dropped: false, calibrated: false, viewOk };
    }

    const visible = visibleEnough(smoothed, this.requiredIndices, 0.6);
    const angle = visible ? this.primaryAngleFn(smoothed) : null;

    this.framesThisRep.push(smoothed);

    const completedRep = this.repMachine.step(angle, tsMs);

    let activeFaults: Fault[] = [];
    if (completedRep) {
      const repIndex = this.repMachine.reps.length - 1;
      const faults = this.ruleSet.evaluate({ rep: completedRep, repIndex, frames: this.framesThisRep, thresholds: this.ruleSet.defaultThresholds });
      this.faultsByRep.push(faults);
      activeFaults = faults;
      this.framesThisRep = [];
    }

    const activeCue = this.cueSelector.select(activeFaults, tsMs);
    const faultSeverityByJoint: Record<number, Fault["severity"]> = {}; // populated by draw.ts callers as needed per-fault-code -> joint mapping

    return {
      tsMs,
      landmarks: smoothed,
      phase: this.repMachine.currentPhase,
      repCount: this.repMachine.reps.length,
      activeCue,
      faultSeverityByJoint,
      dropped: false,
      calibrated: true,
      viewOk,
    };
  }

  /** Public on purpose — the worker's own detectForVideo try/catch needs
   * the same "no landmarks this frame" shape when inference itself throws,
   * without reaching into a private method. */
  emptyOutput(tsMs: number, dropped: boolean): FrameOutput {
    return {
      tsMs,
      landmarks: null,
      phase: this.repMachine.currentPhase,
      repCount: this.repMachine.reps.length,
      activeCue: null,
      faultSeverityByJoint: {},
      dropped,
      calibrated: false,
      viewOk: false,
    };
  }

  /** Called once the set is stopped. Runs whole-set checks (e.g.
   * squatSide's depth_consistency) and computes final scores. */
  finalize() {
    const setLevelRuleSet = this.ruleSet as FormRuleSet & { evaluateSet?: (reps: { minAngle: number }[], thresholds: FormRuleSet["defaultThresholds"]) => Fault[] };
    if (setLevelRuleSet.evaluateSet && this.repMachine.reps.length > 0) {
      const setFaults = setLevelRuleSet.evaluateSet(this.repMachine.reps, this.ruleSet.defaultThresholds);
      if (setFaults.length > 0) {
        const lastIdx = this.faultsByRep.length - 1;
        if (lastIdx >= 0) this.faultsByRep[lastIdx] = [...this.faultsByRep[lastIdx], ...setFaults];
      }
    }

    const repScores = this.faultsByRep.map((faults) => scoreRep(faults));
    return {
      reps: this.repMachine.reps,
      faultsByRep: this.faultsByRep,
      repScores,
      overallScore: overallScore(repScores),
      totalFrames: this.totalFrames,
      gapFrames: this.gapFrames,
    };
  }
}
