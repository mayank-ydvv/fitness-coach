"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/cn";
import { TextInput } from "./TextInput";
import type { InputHTMLAttributes } from "react";

/** TextInput plus a visibility toggle — a real 44×44px button, not a tiny
 * icon crammed into the input's own padding. The toggle button's own
 * label changes with state ("Show password" / "Hide password") rather
 * than relying on the icon alone to communicate what it does. */
export function PasswordInput({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <TextInput type={visible ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-ink-muted hover:text-ink-primary"
      >
        {visible ? <EyeOff size={18} aria-hidden /> : <Eye size={18} aria-hidden />}
      </button>
    </div>
  );
}
