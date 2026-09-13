import type { NormalizedLandmark } from "./landmarks";

/**
 * EMA smoother, ported from gesture-fps's `inputState.js` LandmarkSmoother
 * (α=0.35). Resets to null on disappearance rather than snapping when the
 * subject reappears — a sudden jump on reappearance is worse than a one-
 * frame gap.
 */
export class LandmarkSmoother {
  private prev: NormalizedLandmark[] | null = null;
  constructor(private alpha = 0.35) {}

  update(raw: NormalizedLandmark[] | null): NormalizedLandmark[] | null {
    if (!raw) {
      this.prev = null;
      return null;
    }
    if (!this.prev) {
      this.prev = raw;
      return raw;
    }
    const a = this.alpha;
    const next = raw.map((p, i) => {
      const prevPoint = this.prev![i];
      if (!prevPoint) return p;
      return {
        x: prevPoint.x + (p.x - prevPoint.x) * a,
        y: prevPoint.y + (p.y - prevPoint.y) * a,
        z: prevPoint.z + (p.z - prevPoint.z) * a,
        visibility: prevPoint.visibility + (p.visibility - prevPoint.visibility) * a,
      };
    });
    this.prev = next;
    return next;
  }

  reset() {
    this.prev = null;
  }
}

/** Same idea, for a single derived scalar (e.g. a joint angle). */
export class ScalarSmoother {
  private prev: number | null = null;
  constructor(private alpha = 0.35) {}

  update(raw: number | null): number | null {
    if (raw === null) {
      this.prev = null;
      return null;
    }
    if (this.prev === null) {
      this.prev = raw;
      return raw;
    }
    this.prev = this.prev + (raw - this.prev) * this.alpha;
    return this.prev;
  }

  reset() {
    this.prev = null;
  }
}
