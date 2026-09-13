import type { Fault } from "./rules/types";

const SEVERITY_RANK: Record<Fault["severity"], number> = { major: 2, minor: 1 };
const CUE_HOLD_MS = 400; // hysteresis so the on-screen cue doesn't flicker between two faults

/** Exactly one cue on screen at a time — the highest-severity active
 * fault — with hysteresis via StableGate<string> semantics (implemented
 * directly here since StableGate is boolean-only) so a cue doesn't flip
 * every frame when two faults are close in severity. */
export class CueSelector {
  private candidateCue: string | null = null;
  private candidateSince: number | null = null;
  private stableCue: string | null = null;

  select(activeFaults: Fault[], nowMs: number): string | null {
    const top = [...activeFaults].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])[0];
    const candidate = top?.cue ?? null;

    if (candidate === this.stableCue) {
      this.candidateCue = null;
      this.candidateSince = null;
      return this.stableCue;
    }
    if (candidate !== this.candidateCue) {
      this.candidateCue = candidate;
      this.candidateSince = nowMs;
    } else if (this.candidateSince !== null && nowMs - this.candidateSince >= CUE_HOLD_MS) {
      this.stableCue = candidate;
      this.candidateCue = null;
      this.candidateSince = null;
    }
    return this.stableCue;
  }

  reset() {
    this.candidateCue = null;
    this.candidateSince = null;
    this.stableCue = null;
  }
}
