/**
 * Ported from gesture-fps's `inputState.js`. A boolean must hold steady for
 * `holdMs` before the gate's output flips — kills single-frame flicker
 * from noisy classification.
 */
export class StableGate {
  private candidateSince: number | null = null;
  private stableValue = false;

  constructor(private holdMs: number) {}

  update(raw: boolean, nowMs: number): boolean {
    if (raw === this.stableValue) {
      this.candidateSince = null;
      return this.stableValue;
    }
    if (this.candidateSince === null) {
      this.candidateSince = nowMs;
    } else if (nowMs - this.candidateSince >= this.holdMs) {
      this.stableValue = raw;
      this.candidateSince = null;
    }
    return this.stableValue;
  }

  reset() {
    this.candidateSince = null;
    this.stableValue = false;
  }
}

/** Layers a rising-edge trigger on top of StableGate — true only on the
 * frame the stable value flips from false to true. */
export class EdgeGate {
  private gate: StableGate;
  private lastStable = false;

  constructor(holdMs: number) {
    this.gate = new StableGate(holdMs);
  }

  update(raw: boolean, nowMs: number): boolean {
    const stable = this.gate.update(raw, nowMs);
    const risingEdge = stable && !this.lastStable;
    this.lastStable = stable;
    return risingEdge;
  }

  reset() {
    this.gate.reset();
    this.lastStable = false;
  }
}
