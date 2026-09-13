"use client";

import { useEffect, useRef, useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";

export function CameraSheet({
  open,
  onOpenChange,
  onCapture,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCapture: (blob: Blob) => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [captured, setCaptured] = useState<{ blob: Blob; url: string } | null>(null);

  useEffect(() => {
    if (!open) {
      stopStream();
      setCaptured(null);
      return;
    }
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 1280 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        setError("Couldn't access the camera. Use \"Upload a photo\" instead.");
      }
    })();
    return stopStream;
  }, [open]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function shutter() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) setCaptured({ blob, url: URL.createObjectURL(blob) });
    }, "image/jpeg", 0.92);
  }

  function confirm() {
    if (!captured) return;
    onCapture(captured.blob);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title="Photograph your meal" className="sm:max-w-lg">
      <div className="flex flex-col gap-3">
        {/* Visible, not buried in help — this measurably improves portion estimates (spec §5). */}
        <p className="rounded-control bg-surface-sunken p-3 text-sm text-ink-muted">
          Shoot from above, and put something for scale in frame — a fork, your hand, the plate edge.
        </p>

        <div className="relative aspect-square overflow-hidden rounded-control bg-surface-sunken">
          {captured ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview
            <img src={captured.url} alt="Captured meal" className="size-full object-cover" />
          ) : error ? (
            <div className="flex size-full items-center justify-center p-4 text-center text-sm text-ink-muted">{error}</div>
          ) : (
            <video ref={videoRef} playsInline muted className="size-full object-cover" />
          )}
        </div>

        {captured ? (
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setCaptured(null)}>
              Retake
            </Button>
            <Button className="flex-1" onClick={confirm}>
              Use photo
            </Button>
          </div>
        ) : (
          <Button size="lg" disabled={!!error} onClick={shutter} className="w-full">
            Shutter
          </Button>
        )}

        <label className="flex min-h-11 cursor-pointer items-center justify-center rounded-control border border-hairline text-sm font-medium text-ink-muted hover:text-ink-primary">
          Upload a photo instead
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                onCapture(file);
                onOpenChange(false);
              }
            }}
          />
        </label>
      </div>
    </Sheet>
  );
}
