"use client";

import type { FormSession, FrameOutput } from "./session";

/**
 * Main-thread handle for the form-analysis worker. Spawns the worker,
 * transfers an ImageBitmap per frame, and holds single-in-flight
 * backpressure (skip this rAF entirely if a result is still outstanding —
 * that's what degrades a slow phone to 15fps instead of growing an
 * unbounded queue, per the M5 plan).
 *
 * NOT verified against a live camera/worker in this environment.
 */
export class FormWorkerClient {
  private worker: Worker;
  private inFlight = false;
  private onResult: ((output: FrameOutput) => void) | null = null;
  private onError: ((message: string) => void) | null = null;
  private onReady: (() => void) | null = null;
  private onFinalized: ((summary: ReturnType<FormSession["finalize"]>) => void) | null = null;

  constructor() {
    this.worker = new Worker(new URL("./worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.type === "result") {
        this.inFlight = false;
        this.onResult?.(msg.output);
      } else if (msg.type === "error") {
        this.inFlight = false;
        this.onError?.(msg.message);
      } else if (msg.type === "ready") {
        this.onReady?.();
      } else if (msg.type === "finalized") {
        this.onFinalized?.(msg.summary);
      }
    };
  }

  init(params: { exerciseSlug: string; cameraView: "side" | "front"; requiredIndices: number[] }) {
    this.worker.postMessage({ type: "init", ...params });
  }

  /** Call once per rAF tick with the current <video>. No-ops (and does
   * not even create the ImageBitmap) if a previous frame's result hasn't
   * come back yet. */
  async submitFrame(video: HTMLVideoElement, tsMs: number) {
    if (this.inFlight) return;
    this.inFlight = true;
    try {
      const bitmap = await createImageBitmap(video);
      this.worker.postMessage({ type: "frame", bitmap, tsMs }, [bitmap]);
    } catch {
      this.inFlight = false;
    }
  }

  stop() {
    this.worker.postMessage({ type: "stop" });
  }

  terminate() {
    this.worker.terminate();
  }

  setHandlers(handlers: {
    onResult?: (output: FrameOutput) => void;
    onError?: (message: string) => void;
    onReady?: () => void;
    onFinalized?: (summary: ReturnType<FormSession["finalize"]>) => void;
  }) {
    this.onResult = handlers.onResult ?? null;
    this.onError = handlers.onError ?? null;
    this.onReady = handlers.onReady ?? null;
    this.onFinalized = handlers.onFinalized ?? null;
  }
}
