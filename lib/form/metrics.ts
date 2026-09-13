import type { RepRecord } from "./repMachine";
import type { Fault } from "./rules/types";

/**
 * The numbers-only payload sent to the model for the coaching write-up
 * (spec §7 step 7 / §10.3) — no landmarks, no image data, ever. This is
 * the entire justification for "never send video frames to a language
 * model": by the time anything leaves the device, it's already just this.
 */
export type RepMetric = {
  repIndex: number;
  minAngle: number;
  maxAngle: number;
  eccentricMs: number;
  concentricMs: number;
  score: number;
  faults: { code: string; severity: Fault["severity"] }[];
};

export type FormMetricsPayload = {
  exercise: string;
  cameraView: "side" | "front";
  repCount: number;
  overallScore: number;
  repMetrics: RepMetric[];
  faults: { code: string; severity: Fault["severity"]; count: number }[];
};

export function buildMetricsPayload(params: {
  exerciseName: string;
  cameraView: "side" | "front";
  reps: RepRecord[];
  faultsByRep: Fault[][];
  repScores: number[];
  overallScore: number;
}): FormMetricsPayload {
  const repMetrics: RepMetric[] = params.reps.map((rep, i) => ({
    repIndex: i,
    minAngle: Math.round(rep.minAngle * 10) / 10,
    maxAngle: Math.round(rep.maxAngle * 10) / 10,
    eccentricMs: rep.eccentricMs,
    concentricMs: rep.concentricMs,
    score: params.repScores[i] ?? 0,
    faults: (params.faultsByRep[i] ?? []).map((f) => ({ code: f.code, severity: f.severity })),
  }));

  const faultCounts = new Map<string, { severity: Fault["severity"]; count: number }>();
  for (const faults of params.faultsByRep) {
    for (const f of faults) {
      const existing = faultCounts.get(f.code);
      faultCounts.set(f.code, { severity: f.severity, count: (existing?.count ?? 0) + 1 });
    }
  }

  return {
    exercise: params.exerciseName,
    cameraView: params.cameraView,
    repCount: params.reps.length,
    overallScore: params.overallScore,
    repMetrics,
    faults: Array.from(faultCounts.entries()).map(([code, v]) => ({ code, severity: v.severity, count: v.count })),
  };
}
