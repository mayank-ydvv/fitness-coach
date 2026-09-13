import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

/** inputMode="decimal" brings up the numeric keyboard on mobile without the
 * browser-native spinner arrows of type="number" (which are hard to hit at
 * 44px and inconsistent across browsers). */
export function NumberInput({
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <input
      type="text"
      inputMode="decimal"
      className={cn(
        "metric h-11 rounded-control border border-hairline bg-surface-sunken px-3 text-lg text-ink-primary",
        "placeholder:font-ui placeholder:font-normal placeholder:text-ink-muted focus-visible:border-focus",
        className,
      )}
      {...props}
    />
  );
}
