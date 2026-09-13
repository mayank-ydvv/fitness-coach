import { visibleEnough, type NormalizedLandmark } from "./landmarks";

const REQUIRED_HOLD_MS = 2000;

/** All rule-required landmarks must be visible for 2 continuous seconds
 * before a set can start (spec §7 step 2). Any single bad frame resets the
 * timer — this is deliberately strict since a bad calibration produces a
 * wrong score, not just a wrong cue. */
export class CalibrationGate {
  private goodSince: number | null = null;
  private calibrated = false;

  update(landmarks: NormalizedLandmark[] | null, requiredIndices: number[], nowMs: number): boolean {
    const good = landmarks !== null && visibleEnough(landmarks, requiredIndices, 0.7);
    if (!good) {
      this.goodSince = null;
      this.calibrated = false;
      return false;
    }
    if (this.goodSince === null) this.goodSince = nowMs;
    if (!this.calibrated && nowMs - this.goodSince >= REQUIRED_HOLD_MS) {
      this.calibrated = true;
    }
    return this.calibrated;
  }

  reset() {
    this.goodSince = null;
    this.calibrated = false;
  }
}
