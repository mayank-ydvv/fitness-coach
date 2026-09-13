import { cn } from "@/lib/cn";
import type { InputHTMLAttributes } from "react";

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-11 rounded-control border border-hairline bg-surface-sunken px-3 text-base text-ink-primary",
        "placeholder:text-ink-muted focus-visible:border-focus",
        className,
      )}
      {...props}
    />
  );
}
