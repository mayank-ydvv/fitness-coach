/** The single, once-per-program general-guidance-not-medical-advice block
 * (spec §6/§11). */
export function MedicalDisclaimer() {
  return (
    <p className="text-xs text-ink-muted">
      This is general fitness guidance, not medical advice. If something hurts, stop and see a professional.
    </p>
  );
}
