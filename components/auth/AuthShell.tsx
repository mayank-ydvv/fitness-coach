import type { ReactNode } from "react";
import { AuthVisual } from "./AuthVisual";

/**
 * Shared by /login and /auth/confirm (and would be by a forgot-password
 * or reset screen, if this app ever had passwords to reset — see
 * DESIGN.md's Phase 5 note on why those don't exist here). Split
 * layout: form on the left, AuthVisual on the right; the visual
 * collapses to a short strip above the form on mobile rather than
 * disappearing, so it's never just decoration that vanishes on the
 * common case.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-dvh md:grid-cols-2">
      <div className="order-1 md:order-1 md:h-dvh">
        <AuthVisual />
      </div>
      <div className="order-2 flex items-center justify-center bg-surface-base px-5 py-12 md:order-2">
        <div className="w-full max-w-sm">{children}</div>
      </div>
    </div>
  );
}
