import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

/** inputMode="decimal" brings up the numeric keyboard on mobile without the
 * browser-native spinner arrows of type="number" (which are hard to hit at
 * 44px and inconsistent across browsers). Same physical focus/invalid
 * response as TextInput — see that file's comment. */
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
        "transition-[border-color,background-color] duration-[var(--duration-feedback)]",
        "placeholder:font-ui placeholder:font-normal placeholder:text-ink-muted",
        "focus-visible:border-action focus-visible:bg-surface-raised",
        "aria-[invalid=true]:border-action-danger",
        className,
      )}
      {...props}
    />
  );
}
