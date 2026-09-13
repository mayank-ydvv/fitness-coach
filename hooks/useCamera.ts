"use client";

import { useEffect, useRef, useState } from "react";

export type CameraStatus = "idle" | "requesting" | "ready" | "denied" | "unavailable";

/** getUserMedia acquisition with named next-actions on failure, rather
 * than a generic camera error (spec §7 honesty requirements extend to
 * setup failures too). */
export function useCamera(videoRef: React.RefObject<HTMLVideoElement | null>) {
  const [status, setStatus] = useState<CameraStatus>("idle");
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let cancelled = false;
    setStatus("requesting");

    (async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        if (!cancelled) setStatus("unavailable");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        const isStandalone = window.matchMedia("(display-mode: standalone)").matches;
        console.warn("[useCamera] getUserMedia failed" + (isStandalone ? " (running as an installed PWA — this is a known iOS Safari limitation)" : ""), err);
        setStatus("denied");
      }
    })();

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { status };
}
