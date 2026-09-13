import { angleAt } from "../lib/form/geometry";
import { squatPoseForKneeAngle, generateSquatTrace, resetSeed, fullBodyFromJoints } from "../lib/form/__fixtures__/synth";
import { FormSession } from "../lib/form/session";
import { squatSide, kneeAngleAt } from "../lib/form/rules/squatSide";
import { LEFT_ANKLE, LEFT_HIP, LEFT_KNEE, LEFT_SHOULDER, RIGHT_ANKLE, RIGHT_HIP, RIGHT_KNEE, RIGHT_SHOULDER } from "../lib/form/landmarks";
import { droppedFrameRatio, shouldOfferRerecord } from "../lib/form/confidence";
import type { NormalizedLandmark } from "../lib/form/landmarks";

const REQUIRED_INDICES = [LEFT_HIP, LEFT_KNEE, LEFT_ANKLE, LEFT_SHOULDER, RIGHT_HIP, RIGHT_KNEE, RIGHT_ANKLE, RIGHT_SHOULDER];

type Result = { name: string; pass: boolean; detail: string };
const results: Result[] = [];
function check(name: string, pass: boolean, detail = "") {
  results.push({ name, pass, detail });
}

// --- 0. Round-trip sanity: the synthetic pose generator must reproduce
// the exact angle it was asked for, through the REAL geometry.angleAt() —
// this catches sign/order bugs in geometry.ts itself before anything else
// is trusted. ---
{
  let maxErr = 0;
  for (const targetAngle of [170, 150, 120, 95, 85, 60]) {
    const joints = squatPoseForKneeAngle(targetAngle, 10) as unknown as { hip: { x: number; y: number }; knee: { x: number; y: number }; ankle: { x: number; y: number } };
    const got = angleAt(joints.hip, joints.knee, joints.ankle);
    maxErr = Math.max(maxErr, Math.abs(got - targetAngle));
  }
  check("round-trip: squatPoseForKneeAngle -> angleAt reproduces the requested angle", maxErr < 0.01, `max error ${maxErr}`);
}

function runTrace(frames: { landmarks: NormalizedLandmark[] | null; tsMs: number }[]) {
  const session = new FormSession(squatSide, "side", REQUIRED_INDICES, kneeAngleAt);
  for (const f of frames) session.step(f.landmarks, f.tsMs);
  return session.finalize();
}

// --- 1. 10 clean squats @ 30fps: 10 reps, no faults ---
{
  resetSeed();
  const frames = generateSquatTrace({ fps: 30, reps: 10, eccentricMs: 900, concentricMs: 900, bottomAngle: 85, topAngle: 170 });
  const summary = runTrace(frames);
  const allFaults = summary.faultsByRep.flat();
  check("10 clean squats @30fps -> 10 reps, no faults", summary.reps.length === 10 && allFaults.length === 0, `got ${summary.reps.length} reps, ${allFaults.length} faults`);
}

// --- 2. Same but 15fps: proves the phase gate isn't frame-count-based ---
{
  resetSeed();
  const frames = generateSquatTrace({ fps: 15, reps: 10, eccentricMs: 900, concentricMs: 900, bottomAngle: 85, topAngle: 170 });
  const summary = runTrace(frames);
  check("10 squats @15fps -> 10 reps (phase gate is time-based, not frame-count-based)", summary.reps.length === 10, `got ${summary.reps.length} reps`);
}

// --- 3. Noisy: no phantom faults from jitter ---
{
  resetSeed();
  const frames = generateSquatTrace({ fps: 30, reps: 10, eccentricMs: 900, concentricMs: 900, bottomAngle: 85, topAngle: 170, noiseSigma: 0.004 });
  // Noise perturbs per-rep completion timing (some reps take a bit longer
  // to clear the direction-stability gates than others), so the fixed
  // trace length computed from nominal timing can end a few hundred ms
  // short of the LAST rep's own closing settle. Pad with clean top-angle
  // frames — this is a test-construction margin, not a product behavior;
  // a live session simply keeps running until the lifter stops.
  let tailTs = frames[frames.length - 1].tsMs + 1000 / 30;
  for (let i = 0; i < 60; i++) {
    const joints = squatPoseForKneeAngle(170, 10) as unknown as Parameters<typeof fullBodyFromJoints>[0];
    frames.push({ landmarks: fullBodyFromJoints(joints), tsMs: tailTs });
    tailTs += 1000 / 30;
  }
  const summary = runTrace(frames);
  const allFaults = summary.faultsByRep.flat();
  check("10 noisy squats -> 10 reps, no phantom faults from jitter", summary.reps.length === 10 && allFaults.length === 0, `got ${summary.reps.length} reps, faults: ${JSON.stringify(allFaults.map((f) => f.code))}`);
}

// --- 4. 2 mid-descent twitches on 5 reps -> still 5 reps, twitches rejected ---
{
  resetSeed();
  const frames = generateSquatTrace({ fps: 30, reps: 5, eccentricMs: 900, concentricMs: 900, bottomAngle: 85, topAngle: 170, twitchAtRepFraction: [0.3, undefined as unknown as number, 0.5, undefined as unknown as number, undefined as unknown as number].filter((x) => x !== undefined) as number[] });
  const summary = runTrace(frames);
  check("5 squats with mid-descent twitches -> still 5 reps (twitches rejected)", summary.reps.length === 5, `got ${summary.reps.length} reps`);
}

// --- 5. Half-rep abort: fast partial descent+return, never sustains 350ms -> 0 reps ---
{
  const frames: { landmarks: NormalizedLandmark[] | null; tsMs: number }[] = [];
  let ts = 0;
  const settleFrames = Math.round(30 * 2.5);
  for (let i = 0; i < settleFrames; i++) {
    const joints = squatPoseForKneeAngle(170, 10) as unknown as Parameters<typeof fullBodyFromJoints>[0];
    frames.push({ landmarks: fullBodyFromJoints(joints), tsMs: ts });
    ts += 1000 / 30;
  }
  // Fast abort: 170 -> 120 -> 170 in 200ms total (well under the 350ms hold).
  const abortSteps = 6;
  for (let i = 0; i <= abortSteps; i++) {
    const u = i / abortSteps;
    const angle = u <= 0.5 ? 170 - (170 - 120) * (u / 0.5) : 120 + (170 - 120) * ((u - 0.5) / 0.5);
    const joints = squatPoseForKneeAngle(angle, 10) as unknown as Parameters<typeof fullBodyFromJoints>[0];
    frames.push({ landmarks: fullBodyFromJoints(joints), tsMs: ts });
    ts += 200 / abortSteps;
  }
  for (let i = 0; i < 30; i++) {
    const joints = squatPoseForKneeAngle(170, 10) as unknown as Parameters<typeof fullBodyFromJoints>[0];
    frames.push({ landmarks: fullBodyFromJoints(joints), tsMs: ts });
    ts += 1000 / 30;
  }
  const summary = runTrace(frames);
  check("half-rep abort (fast partial descent, never holds 350ms) -> 0 reps", summary.reps.length === 0, `got ${summary.reps.length} reps`);
}

// --- 6. Shallow partials: 10 reps, all flagged depth:major ---
{
  resetSeed();
  const frames = generateSquatTrace({ fps: 30, reps: 10, eccentricMs: 900, concentricMs: 900, bottomAngle: 130, topAngle: 170 });
  const summary = runTrace(frames);
  const allMajorDepth = summary.faultsByRep.every((faults) => faults.some((f) => f.code === "depth" && f.severity === "major"));
  check("shallow partials (bottom=130deg) -> 10 reps, every rep flagged depth:major", summary.reps.length === 10 && allMajorDepth, `got ${summary.reps.length} reps, depth faults: ${summary.faultsByRep.map((f) => f.find((x) => x.code === "depth")?.severity ?? "none").join(",")}`);
}

// --- 7. Paused 3s at bottom: correct eccentric/concentric split ---
{
  resetSeed();
  const frames = generateSquatTrace({ fps: 30, reps: 3, eccentricMs: 900, concentricMs: 900, bottomAngle: 85, topAngle: 170, pauseAtBottomMs: 3000 });
  const summary = runTrace(frames);
  const eccentricOk = summary.reps.every((r) => Math.abs(r.eccentricMs - 900) < 150);
  const concentricOk = summary.reps.every((r) => Math.abs(r.concentricMs - 900) < 150);
  check(
    "3 squats paused 3s at bottom -> neither eccentric nor concentric duration is inflated by the pause",
    summary.reps.length === 3 && eccentricOk && concentricOk,
    `reps=${summary.reps.length}, eccentricMs=${summary.reps.map((r) => Math.round(r.eccentricMs))}, concentricMs=${summary.reps.map((r) => Math.round(r.concentricMs))}`,
  );
}

// --- 8. Bounced: fast eccentric -> tempo minor on every rep ---
{
  resetSeed();
  const frames = generateSquatTrace({ fps: 30, reps: 5, eccentricMs: 400, concentricMs: 900, bottomAngle: 85, topAngle: 170 });
  const summary = runTrace(frames);
  const allTempoMinor = summary.faultsByRep.every((faults) => faults.some((f) => f.code === "tempo" && f.severity === "minor"));
  check("bounced (eccentric 400ms) -> tempo:minor on every rep", summary.reps.length === 5 && allTempoMinor, `got ${summary.reps.length} reps, tempo faults: ${summary.faultsByRep.map((f) => f.some((x) => x.code === "tempo")).join(",")}`);
}

// --- 9. Dropout mid-rep: a gap, not a phantom rep ---
{
  resetSeed();
  const dropoutFrames = new Set<number>();
  // Drop frames 90-100 (roughly mid-first-rep at 30fps after the 2.5s/75-frame settle).
  for (let i = 90; i < 100; i++) dropoutFrames.add(i);
  const frames = generateSquatTrace({ fps: 30, reps: 3, eccentricMs: 900, concentricMs: 900, bottomAngle: 85, topAngle: 170, dropoutFrames });
  const summary = runTrace(frames);
  check("dropout mid-rep -> gap counted, no phantom rep from the gap itself", summary.gapFrames >= 10 && summary.reps.length <= 3, `gapFrames=${summary.gapFrames}, reps=${summary.reps.length}`);
}

// --- 10. Standing still 30s: 0 reps ---
{
  const frames: { landmarks: NormalizedLandmark[] | null; tsMs: number }[] = [];
  let ts = 0;
  for (let i = 0; i < 30 * 30; i++) {
    const joints = squatPoseForKneeAngle(170, 10) as unknown as Parameters<typeof fullBodyFromJoints>[0];
    frames.push({ landmarks: fullBodyFromJoints(joints), tsMs: ts });
    ts += 1000 / 30;
  }
  const summary = runTrace(frames);
  check("standing still 30s -> 0 reps", summary.reps.length === 0, `got ${summary.reps.length} reps`);
}

// --- 11. Fatigue drift: min-knee spread >15deg fires depth_consistency ---
{
  // Build a trace by hand with 4 reps whose bottom angle drifts wider than
  // any single rep's own depth threshold would explain.
  const frames: { landmarks: NormalizedLandmark[] | null; tsMs: number }[] = [];
  let ts = 0;
  const settleFrames = Math.round(30 * 2.5);
  for (let i = 0; i < settleFrames; i++) {
    const joints = squatPoseForKneeAngle(170, 10) as unknown as Parameters<typeof fullBodyFromJoints>[0];
    frames.push({ landmarks: fullBodyFromJoints(joints), tsMs: ts });
    ts += 1000 / 30;
  }
  const bottomAngles = [85, 88, 95, 105]; // spread = 20deg > 15deg threshold
  for (const bottom of bottomAngles) {
    const eccFrames = 27; // ~900ms @30fps
    for (let f = 0; f <= eccFrames; f++) {
      const u = f / eccFrames;
      const angle = 170 - (170 - bottom) * 0.5 * (1 - Math.cos(Math.PI * u));
      const joints = squatPoseForKneeAngle(angle, 10) as unknown as Parameters<typeof fullBodyFromJoints>[0];
      frames.push({ landmarks: fullBodyFromJoints(joints), tsMs: ts });
      ts += 1000 / 30;
    }
    for (let f = 0; f <= eccFrames; f++) {
      const u = f / eccFrames;
      const angle = bottom + (170 - bottom) * 0.5 * (1 - Math.cos(Math.PI * u));
      const joints = squatPoseForKneeAngle(angle, 10) as unknown as Parameters<typeof fullBodyFromJoints>[0];
      frames.push({ landmarks: fullBodyFromJoints(joints), tsMs: ts });
      ts += 1000 / 30;
    }
    for (let i = 0; i < 45; i++) {
      // 1.5s settle at top — matches generateSquatTrace's own margin so
      // the "no longer going up" transition reliably closes out even the
      // last rep of this hand-built trace.
      const joints = squatPoseForKneeAngle(170, 10) as unknown as Parameters<typeof fullBodyFromJoints>[0];
      frames.push({ landmarks: fullBodyFromJoints(joints), tsMs: ts });
      ts += 1000 / 30;
    }
  }
  const summary = runTrace(frames);
  const lastRepFaults = summary.faultsByRep[summary.faultsByRep.length - 1] ?? [];
  const fired = lastRepFaults.some((f) => f.code === "depth_consistency");
  check("fatigue drift (bottom angle spread 20deg) -> depth_consistency fires", summary.reps.length === 4 && fired, `reps=${summary.reps.length}, lastRepFaults=${JSON.stringify(lastRepFaults.map((f) => f.code))}`);
}

// --- confidence.ts sanity ---
{
  check("droppedFrameRatio(100,25) === 0.25", droppedFrameRatio(100, 25) === 0.25);
  check("shouldOfferRerecord(100,25) === true (>20%)", shouldOfferRerecord(100, 25) === true);
  check("shouldOfferRerecord(100,15) === false (<=20%)", shouldOfferRerecord(100, 15) === false);
}

for (const r of results) {
  console.log(`${r.pass ? "✅ PASS" : "❌ FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
const passCount = results.filter((r) => r.pass).length;
console.log(`\n${passCount}/${results.length} passed.`);
if (passCount !== results.length) process.exit(1);
