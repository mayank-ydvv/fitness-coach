import { StableGate } from "./gates";

export type Phase = "top" | "descending" | "bottom" | "ascending";

export type RepRecord = {
  minAngle: number;
  maxAngle: number;
  eccentricMs: number;
  concentricMs: number;
  frames: number;
  gapFrames: number;
};

const MIN_PHASE_MS = 350; // "each phase must last >=0.35s to reject twitches" (spec §7)
const VELOCITY_THRESHOLD_DEG_PER_SEC = 25;

/**
 * TOP -> DESCENDING -> BOTTOM -> ASCENDING -> TOP, counting on return to
 * TOP (spec §7). Direction is derived from smoothed angle velocity; each
 * direction must hold for >=350ms via StableGate before a phase transition
 * commits — this is what rejects a single-frame twitch (a fast reversal
 * never clears the hold time, so the machine never leaves TOP for it).
 *
 * BOTTOM is reported as a labelled instant (the turning point) rather than
 * a separately-timed phase: by the time the "going up" direction has been
 * confirmed stable, the required dwell has already elapsed as part of
 * confirming that direction, so a second independent timer would be
 * redundant, not a stricter check.
 */
export class RepMachine {
  private phase: Phase = "top";
  private downGate = new StableGate(MIN_PHASE_MS);
  private upGate = new StableGate(MIN_PHASE_MS);
  private wasGoingUp = false;
  private wasGoingDown = false;

  private lastAngle: number | null = null;
  private lastTsMs: number | null = null;

  private minAngleThisRep = Infinity;
  private maxAngleThisRep = -Infinity;
  private eccentricStartMs = 0;
  private concentricStartMs = 0;
  private framesThisRep = 0;
  private gapFramesThisRep = 0;

  reps: RepRecord[] = [];

  get currentPhase(): Phase {
    return this.phase;
  }

  /** `angle` is null on a dropped frame (see confidence.ts) — counted as a
   * gap, never guessed. Returns the just-completed rep, if this frame
   * finished one. */
  step(angle: number | null, tsMs: number): RepRecord | null {
    if (angle === null) {
      this.gapFramesThisRep++;
      this.lastAngle = null;
      this.lastTsMs = null;
      return null;
    }
    this.framesThisRep++;
    this.minAngleThisRep = Math.min(this.minAngleThisRep, angle);
    this.maxAngleThisRep = Math.max(this.maxAngleThisRep, angle);

    if (this.lastAngle === null || this.lastTsMs === null) {
      this.lastAngle = angle;
      this.lastTsMs = tsMs;
      return null;
    }

    const dtSec = (tsMs - this.lastTsMs) / 1000;
    const velocity = dtSec > 0 ? (angle - this.lastAngle) / dtSec : 0;
    this.lastAngle = angle;
    this.lastTsMs = tsMs;

    const goingDown = this.downGate.update(velocity < -VELOCITY_THRESHOLD_DEG_PER_SEC, tsMs);
    const goingUp = this.upGate.update(velocity > VELOCITY_THRESHOLD_DEG_PER_SEC, tsMs);

    let completed: RepRecord | null = null;

    if (this.phase === "top" && goingDown) {
      this.phase = "descending";
      this.eccentricStartMs = tsMs;
      this.minAngleThisRep = angle;
      this.maxAngleThisRep = angle;
      this.framesThisRep = 1;
      this.gapFramesThisRep = 0;
    } else if (this.phase === "descending" && this.wasGoingDown && !goingDown) {
      // Reached bottom: downward motion has stopped, whether because
      // ascent started immediately or because of a held pause. Either
      // way, eccentric timing ends exactly here — a pause at the bottom
      // must not inflate it.
      this.phase = "bottom";
      this._eccentricMsForRep = tsMs - this.eccentricStartMs;
    } else if (this.phase === "bottom" && goingUp) {
      // Concentric timing starts at the first real upward motion, not at
      // bottom-arrival — so a pause doesn't inflate this either.
      this.phase = "ascending";
      this.concentricStartMs = tsMs;
    } else if (this.phase === "ascending" && this.wasGoingUp && !goingUp) {
      // Deceleration at the top: velocity dropped back below threshold.
      this.phase = "top";
      completed = {
        minAngle: this.minAngleThisRep,
        maxAngle: this.maxAngleThisRep,
        eccentricMs: this._eccentricMsForRep,
        concentricMs: tsMs - this.concentricStartMs,
        frames: this.framesThisRep,
        gapFrames: this.gapFramesThisRep,
      };
      this.reps.push(completed);
    }

    this.wasGoingUp = goingUp;
    this.wasGoingDown = goingDown;
    return completed;
  }

  private _eccentricMsForRep = 0;

  reset() {
    this.phase = "top";
    this.downGate.reset();
    this.upGate.reset();
    this.wasGoingUp = false;
    this.lastAngle = null;
    this.lastTsMs = null;
    this.minAngleThisRep = Infinity;
    this.maxAngleThisRep = -Infinity;
    this.reps = [];
  }
}
