export function SetupBriefing({ view }: { view: "side" | "front" }) {
  return (
    <div className="flex flex-col gap-2 rounded-control border border-hairline bg-surface-sunken p-4 text-sm">
      <p className="text-ink-primary">
        Prop your phone {view === "side" ? "to your side" : "facing you"}, 2–3 m away, with your whole body in frame.
      </p>
      <p className="text-ink-muted">
        This checks what a single camera can see — joint angles and timing. It can&apos;t see your spine position,
        bracing, or breathing. If something hurts, stop and see a professional.
      </p>
    </div>
  );
}
