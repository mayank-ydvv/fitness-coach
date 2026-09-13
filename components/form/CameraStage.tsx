"use client";

import { useEffect, useRef } from "react";
import { useCamera } from "@/hooks/useCamera";

/**
 * <video> + <canvas>, mirrored CSS, pixel buffer sized to
 * video.videoWidth/Height (never CSS box size), matched object-fit — the
 * classic bug (per gesture-fps) is these two drifting apart.
 */
export function CameraStage({
  videoRef,
  canvasRef,
  children,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  children?: React.ReactNode;
}) {
  const { status } = useCamera(videoRef);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    function resize() {
      const v = videoRef.current;
      const c = canvasRef.current;
      if (!v || !c) return;
      if (v.videoWidth && c.width !== v.videoWidth) {
        c.width = v.videoWidth;
        c.height = v.videoHeight;
      }
    }
    video.addEventListener("loadedmetadata", resize);
    resizeObserverRef.current = new ResizeObserver(resize);
    resizeObserverRef.current.observe(video);
    return () => {
      video.removeEventListener("loadedmetadata", resize);
      resizeObserverRef.current?.disconnect();
    };
  }, [videoRef, canvasRef]);

  return (
    <div className="relative aspect-[3/4] overflow-hidden rounded-card bg-surface-sunken">
      {status === "denied" || status === "unavailable" ? (
        <div className="flex size-full items-center justify-center p-4 text-center text-sm text-ink-muted">
          {status === "denied"
            ? "Couldn't access the camera. Check your browser's camera permission for this site."
            : "Camera access isn't available in this browser."}
        </div>
      ) : (
        <>
          {/* Video gets the CSS mirror for a natural selfie view. The
              canvas does NOT — landmarks are already numerically mirrored
              once in the worker (mirrorLandmarks, right after detect), so
              drawing raw x*width on an unmirrored canvas already lines up
              with the CSS-mirrored video. Mirroring both would double-flip. */}
          <video ref={videoRef} playsInline muted className="size-full scale-x-[-1] object-cover" />
          <canvas ref={canvasRef} className="absolute inset-0 size-full object-cover" />
        </>
      )}
      {children}
    </div>
  );
}
