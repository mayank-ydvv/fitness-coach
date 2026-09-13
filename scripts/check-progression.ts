import { decideProgression } from "../lib/progression/engine";
import { shouldTriggerEarlyDeload } from "../lib/progression/deload";
import type { ProgressionInput, WorkingSet } from "../lib/progression/types";

const ws = (reps: number, loadKg: number, rpe: number | null): WorkingSet => ({ reps, loadKg, rpe, isWarmup: false });

type Case = { name: string; input: ProgressionInput; check: (d: ReturnType<typeof decideProgression>) => string | null };

const base: Omit<ProgressionInput, "workingSets" | "recentMissCount"> = {
  exerciseId: "ex1",
  targetRepsLow: 8,
  targetRepsHigh: 10,
  targetRpe: 8,
  currentLoadKg: 60,
  loadIncrementKg: 2.5,
};

const CASES: Case[] = [
  {
    name: "all sets hit top of range at/below target RPE -> increase",
    input: { ...base, workingSets: [ws(10, 60, 7.5), ws(10, 60, 8)], recentMissCount: 0 },
    check: (d) => (d.outcome === "increase" && d.nextLoadKg === 62.5 ? null : `got ${JSON.stringify(d)}`),
  },
  {
    name: "one set below target_reps_low -> miss, first miss holds and repeats",
    input: { ...base, workingSets: [ws(6, 60, 8), ws(9, 60, 8)], recentMissCount: 0 },
    check: (d) => (d.outcome === "hold_repeat" && d.missed && d.nextLoadKg === 60 && d.nextMissCount === 1 ? null : `got ${JSON.stringify(d)}`),
  },
  {
    name: "second consecutive miss -> 10% backoff, miss counter resets",
    input: { ...base, workingSets: [ws(6, 60, 8), ws(9, 60, 8)], recentMissCount: 1 },
    check: (d) => (d.outcome === "backoff" && d.nextLoadKg === 54 && d.nextMissCount === 0 ? null : `got ${JSON.stringify(d)}`),
  },
  {
    name: "avgRpe >= target+1.5 counts as a miss even with reps in range",
    input: { ...base, workingSets: [ws(9, 60, 10), ws(9, 60, 9.5)], recentMissCount: 0 },
    check: (d) => (d.missed && d.outcome === "hold_repeat" ? null : `got ${JSON.stringify(d)}`),
  },
  {
    name: "reps in range, RPE null treated as target_rpe -> not a miss, hold+beat-reps",
    input: { ...base, workingSets: [ws(9, 60, null), ws(9, 60, null)], recentMissCount: 0 },
    check: (d) => (d.outcome === "hold_beat_reps" && !d.missed ? null : `got ${JSON.stringify(d)}`),
  },
  {
    name: "hit reps but RPE above target -> not an increase (RPE gate binds)",
    input: { ...base, workingSets: [ws(10, 60, 9), ws(10, 60, 9)], recentMissCount: 0 },
    check: (d) => (d.outcome !== "increase" ? null : `expected not-increase, got ${JSON.stringify(d)}`),
  },
  {
    name: "warmup sets are excluded from the decision entirely",
    input: {
      ...base,
      workingSets: [
        { reps: 15, loadKg: 20, rpe: 3, isWarmup: true }, // would look like a miss if counted
        ws(10, 60, 7),
        ws(10, 60, 7),
      ],
      recentMissCount: 0,
    },
    check: (d) => (d.outcome === "increase" ? null : `warmup leaked into decision: ${JSON.stringify(d)}`),
  },
  {
    name: "no working sets logged -> holds, doesn't crash",
    input: { ...base, workingSets: [{ reps: 3, loadKg: 10, rpe: 2, isWarmup: true }], recentMissCount: 0 },
    check: (d) => (d.outcome === "hold_repeat" && !d.missed && Number.isFinite(d.nextLoadKg) ? null : `got ${JSON.stringify(d)}`),
  },
  {
    name: "early deload triggers at exactly 3 missed exercises in a week",
    input: { ...base, workingSets: [ws(10, 60, 7)], recentMissCount: 0 },
    check: () => {
      const decisions = [
        decideProgression({ ...base, workingSets: [ws(5, 60, 9)], recentMissCount: 1 }),
        decideProgression({ ...base, workingSets: [ws(5, 60, 9)], recentMissCount: 1 }),
        decideProgression({ ...base, workingSets: [ws(5, 60, 9)], recentMissCount: 1 }),
        decideProgression({ ...base, workingSets: [ws(10, 60, 7)], recentMissCount: 0 }),
      ];
      const { trigger, reason } = shouldTriggerEarlyDeload(decisions);
      return trigger && reason?.includes("3 lifts") ? null : `expected trigger with '3 lifts' reason, got ${JSON.stringify({ trigger, reason })}`;
    },
  },
  {
    name: "early deload does not trigger at only 2 missed exercises",
    input: { ...base, workingSets: [ws(10, 60, 7)], recentMissCount: 0 },
    check: () => {
      const decisions = [
        decideProgression({ ...base, workingSets: [ws(5, 60, 9)], recentMissCount: 1 }),
        decideProgression({ ...base, workingSets: [ws(5, 60, 9)], recentMissCount: 1 }),
        decideProgression({ ...base, workingSets: [ws(10, 60, 7)], recentMissCount: 0 }),
      ];
      const { trigger } = shouldTriggerEarlyDeload(decisions);
      return trigger === false ? null : "expected no trigger at 2 misses";
    },
  },
];

let failed = 0;
for (const c of CASES) {
  const result = decideProgression(c.input);
  const failure = c.check(result);
  console.log(`${failure === null ? "✅ PASS" : "❌ FAIL"}  ${c.name}${failure ? `  (${failure})` : ""}`);
  if (failure) failed++;
}
console.log(`\n${CASES.length - failed}/${CASES.length} passed.`);
if (failed) process.exit(1);
