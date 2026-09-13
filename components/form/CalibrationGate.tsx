export function CalibrationGate({ viewOk, calibrated }: { viewOk: boolean | "ambiguous"; calibrated: boolean }) {
  if (calibrated) return null;

  return (
    <div className="absolute inset-x-4 top-4 rounded-control bg-surface-base/90 p-3 text-center text-sm text-ink-primary">
      {viewOk === true ? "Hold still — calibrating…" : viewOk === "ambiguous" ? "Can't tell your camera angle yet — adjust until you're clearly in frame." : "Wrong angle — see the message above."}
    </div>
  );
}
