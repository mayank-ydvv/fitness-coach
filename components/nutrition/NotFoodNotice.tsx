export function NotFoodNotice() {
  return (
    <p className="text-sm text-ink-muted">
      That doesn&apos;t look like food. Try again, or{" "}
      <span className="text-ink-primary underline underline-offset-2">add it manually</span>.
    </p>
  );
}
