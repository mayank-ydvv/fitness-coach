import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

/**
 * `group` + `group-focus-within` makes the label itself respond when its
 * input gets focus — one of the "inputs feel physical" states the brief
 * calls for (border/background live on TextInput/NumberInput themselves).
 * Error copy uses `--color-action-danger` (Ember), not `--color-load-red`
 * — the load-* scale is reserved for RPE/intensity/form-fault severity,
 * not form validation; using it here would be exactly the
 * cross-contamination DESIGN.md's palette section warns against.
 */
export function Field({
  label,
  hint,
  error,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("group flex flex-col gap-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="text-sm font-medium text-ink-muted transition-colors duration-[var(--duration-feedback)] group-focus-within:text-ink-primary"
      >
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-sm text-action-danger">{error}</p>
      ) : hint ? (
        <p className="text-sm text-ink-muted">{hint}</p>
      ) : null}
    </div>
  );
}
