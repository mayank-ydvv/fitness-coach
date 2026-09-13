import type { NormalizedLandmark } from "../landmarks";
import {
  LEFT_ANKLE,
  LEFT_ELBOW,
  LEFT_HIP,
  LEFT_KNEE,
  LEFT_SHOULDER,
  LEFT_WRIST,
  RIGHT_ANKLE,
  RIGHT_ELBOW,
  RIGHT_HIP,
  RIGHT_KNEE,
  RIGHT_SHOULDER,
  RIGHT_WRIST,
} from "../landmarks";

/**
 * Synthetic squat pose generator. Places a 2D sagittal (side-view) stick
 * figure with a fixed shin, and solves for the hip position so that
 * angleAt(hip, knee, ankle) — the REAL geometry.ts function, not a
 * shortcut — reproduces the requested knee angle exactly. Feeding this
 * back through angleAt() is itself the first test (below): it catches
 * sign/order bugs in the geometry module, not just in the rep machine.
 */
const SHIN = 0.22;
const THIGH = 0.24;
const TORSO = 0.3;
const ANKLE = { x: 0.5, y: 0.9 };

export function squatPoseForKneeAngle(kneeAngleDeg: number, torsoLeanDeg: number): Record<number, { x: number; y: number }> {
  const knee = { x: ANKLE.x, y: ANKLE.y - SHIN };
  const theta0 = Math.atan2(ANKLE.y - knee.y, ANKLE.x - knee.x); // straight up = 90deg (pi/2)
  const thetaHip = theta0 - (kneeAngleDeg * Math.PI) / 180;
  const hip = { x: knee.x + THIGH * Math.cos(thetaHip), y: knee.y + THIGH * Math.sin(thetaHip) };
  const leanRad = (torsoLeanDeg * Math.PI) / 180;
  const shoulder = { x: hip.x + TORSO * Math.sin(leanRad), y: hip.y - TORSO * Math.cos(leanRad) };
  return { ankle: ANKLE, knee, hip, shoulder } as unknown as Record<number, { x: number; y: number }>;
}

export function fullBodyFromJoints(joints: { ankle: { x: number; y: number }; knee: { x: number; y: number }; hip: { x: number; y: number }; shoulder: { x: number; y: number } }, visibility = 1): NormalizedLandmark[] {
  const landmarks: NormalizedLandmark[] = Array.from({ length: 33 }, () => ({ x: 0, y: 0, z: 0, visibility: 0 }));
  const set = (i: number, p: { x: number; y: number }) => (landmarks[i] = { x: p.x, y: p.y, z: 0, visibility });
  // Side view: mirror left/right onto the same points — a reasonable
  // synthetic approximation of a side-view frame where near/far legs
  // roughly overlap (the real ambiguity this can't model is exactly why
  // golden traces from a real camera matter — see the M5 plan section on
  // what synthetic fixtures cannot catch).
  set(LEFT_ANKLE, joints.ankle);
  set(RIGHT_ANKLE, joints.ankle);
  set(LEFT_KNEE, joints.knee);
  set(RIGHT_KNEE, joints.knee);
  set(LEFT_HIP, joints.hip);
  set(RIGHT_HIP, joints.hip);
  set(LEFT_SHOULDER, joints.shoulder);
  set(RIGHT_SHOULDER, joints.shoulder);
  // Elbow/wrist aren't exercised by squat rules — park them near the
  // shoulder so visibleEnough() checks on those indices (if any) don't
  // spuriously fail.
  set(LEFT_ELBOW, joints.shoulder);
  set(RIGHT_ELBOW, joints.shoulder);
  set(LEFT_WRIST, joints.shoulder);
  set(RIGHT_WRIST, joints.shoulder);
  return landmarks;
}

export type SquatTraceOptions = {
  fps: number;
  reps: number;
  topAngle?: number;
  bottomAngle?: number;
  eccentricMs?: number;
  concentricMs?: number;
  pauseAtBottomMs?: number;
  torsoLean?: number;
  noiseSigma?: number;
  /** Frame indices (0-based, across the whole trace) to mark as dropped
   * (null landmarks) rather than corrupted. */
  dropoutFrames?: Set<number>;
  /** A brief reversal mid-descent that shouldn't register as a phase
   * change (tests the twitch-rejection hold time) — as a fraction [0,1] of
   * one rep's duration, e.g. 0.3 means "30% through the rep". */
  twitchAtRepFraction?: number[];
};

export type SyntheticFrame = { landmarks: NormalizedLandmark[] | null; tsMs: number };

let seed = 42;
function rand(): number {
  // Deterministic PRNG so a "noisy" fixture is reproducible across runs.
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
}
function gaussianNoise(sigma: number): number {
  if (sigma === 0) return 0;
  const u1 = Math.max(rand(), 1e-9);
  const u2 = rand();
  return sigma * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

/** Raised-cosine angle profile between top and bottom, per the M5 plan's
 * generator design. */
function easeAngle(top: number, bottom: number, u: number): number {
  return top - (top - bottom) * 0.5 * (1 - Math.cos(Math.PI * u));
}

export function generateSquatTrace(opts: SquatTraceOptions): SyntheticFrame[] {
  const {
    fps,
    reps,
    topAngle = 170,
    bottomAngle = 85,
    eccentricMs = 900,
    concentricMs = 900,
    pauseAtBottomMs = 0,
    torsoLean = 10,
    noiseSigma = 0,
    dropoutFrames = new Set<number>(),
    twitchAtRepFraction = [],
  } = opts;

  const frameIntervalMs = 1000 / fps;
  const frames: SyntheticFrame[] = [];
  let tsMs = 0;
  let globalFrameIndex = 0;

  // A settle period at TOP before the first rep starts — long enough
  // (>2s) for CalibrationGate's own 2-second hold requirement to clear
  // before any rep-counting frames are fed to the machine.
  for (let i = 0; i < Math.round(fps * 2.5); i++) {
    frames.push(makeFrame(topAngle, torsoLean, tsMs, globalFrameIndex, dropoutFrames, noiseSigma));
    tsMs += frameIntervalMs;
    globalFrameIndex++;
  }

  for (let rep = 0; rep < reps; rep++) {
    const eccentricFrames = Math.max(1, Math.round(eccentricMs / frameIntervalMs));
    const pauseFrames = Math.round(pauseAtBottomMs / frameIntervalMs);
    const concentricFrames = Math.max(1, Math.round(concentricMs / frameIntervalMs));

    const twitchFraction = twitchAtRepFraction[rep];

    for (let f = 0; f < eccentricFrames; f++) {
      let u = f / eccentricFrames;
      if (twitchFraction !== undefined && Math.abs(u - twitchFraction) < 0.05) {
        // A brief bounce back toward TOP for a couple of frames, then resume.
        u = Math.max(0, u - 0.15);
      }
      const angle = easeAngle(topAngle, bottomAngle, u);
      frames.push(makeFrame(angle, torsoLean, tsMs, globalFrameIndex, dropoutFrames, noiseSigma));
      tsMs += frameIntervalMs;
      globalFrameIndex++;
    }

    for (let f = 0; f < pauseFrames; f++) {
      frames.push(makeFrame(bottomAngle, torsoLean, tsMs, globalFrameIndex, dropoutFrames, noiseSigma));
      tsMs += frameIntervalMs;
      globalFrameIndex++;
    }

    for (let f = 0; f < concentricFrames; f++) {
      const u = f / concentricFrames;
      const angle = easeAngle(bottomAngle, topAngle, u);
      frames.push(makeFrame(angle, torsoLean, tsMs, globalFrameIndex, dropoutFrames, noiseSigma));
      tsMs += frameIntervalMs;
      globalFrameIndex++;
    }

    // Settle at top between reps — comfortably above MIN_PHASE_MS (350ms)
    // so the "no longer going up" transition reliably commits before the
    // trace (or the next rep) continues, with margin for the fact that
    // deceleration into this window isn't instantaneous.
    for (let i = 0; i < Math.round(fps * 1.5); i++) {
      frames.push(makeFrame(topAngle, torsoLean, tsMs, globalFrameIndex, dropoutFrames, noiseSigma));
      tsMs += frameIntervalMs;
      globalFrameIndex++;
    }
  }

  return frames;
}

function makeFrame(kneeAngle: number, torsoLean: number, tsMs: number, frameIndex: number, dropoutFrames: Set<number>, noiseSigma: number): SyntheticFrame {
  if (dropoutFrames.has(frameIndex)) return { landmarks: null, tsMs };
  const joints = squatPoseForKneeAngle(kneeAngle, torsoLean) as unknown as { ankle: { x: number; y: number }; knee: { x: number; y: number }; hip: { x: number; y: number }; shoulder: { x: number; y: number } };
  if (noiseSigma > 0) {
    for (const key of ["ankle", "knee", "hip", "shoulder"] as const) {
      joints[key] = { x: joints[key].x + gaussianNoise(noiseSigma), y: joints[key].y + gaussianNoise(noiseSigma) };
    }
  }
  return { landmarks: fullBodyFromJoints(joints), tsMs };
}

export function resetSeed(value = 42) {
  seed = value;
}
