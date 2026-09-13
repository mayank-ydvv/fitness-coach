"use client";

/**
 * Minimal error-reporting hook. No external service is wired up (no
 * Sentry/etc — that's an infra decision outside this repo's scope), but
 * every call site funnels through here so wiring one in later is a
 * one-file change. The contract that matters: every user-facing error
 * names the next action (spec §12) — `nextAction` is required, not
 * optional, so a call site can't report an error without also deciding
 * what the user should do about it.
 */
export function reportError(error: unknown, context: { nextAction: string; where: string }) {
  console.error(`[${context.where}] ${context.nextAction}`, error);
}
