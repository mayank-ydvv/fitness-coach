"use client";

import { useState } from "react";
import { Camera } from "lucide-react";
import { CameraSheet } from "./CameraSheet";

export function CaptureButton({ onCapture }: { onCapture: (blob: Blob) => void }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Photograph a meal"
        className="fixed bottom-[calc(env(safe-area-inset-bottom)+84px)] right-5 z-20 flex size-14 items-center justify-center rounded-full bg-load-blue text-ink-primary shadow-lg lg:bottom-8"
      >
        <Camera size={24} aria-hidden />
      </button>
      <CameraSheet open={open} onOpenChange={setOpen} onCapture={onCapture} />
    </>
  );
}
