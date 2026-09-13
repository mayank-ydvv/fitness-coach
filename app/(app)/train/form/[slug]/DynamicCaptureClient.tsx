"use client";

import dynamic from "next/dynamic";

// `ssr:false` on next/dynamic isn't allowed inside a Server Component in
// Next 15 — this one-line client wrapper is the boundary that satisfies
// that rule while keeping the parent page (and therefore the exercise
// lookup/notFound()) server-rendered. This is still the only path by which
// @mediapipe/tasks-vision reaches the bundle: lazy + client-only.
const CaptureClient = dynamic(() => import("./CaptureClient").then((m) => m.CaptureClient), {
  ssr: false,
  loading: () => <p className="text-sm text-ink-muted">Loading pose tracking…</p>,
});

export function DynamicCaptureClient(props: { exerciseId: string; exerciseSlug: string; exerciseName: string; cameraView: "side" | "front" }) {
  return <CaptureClient {...props} />;
}
