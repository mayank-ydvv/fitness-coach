import "server-only";
import { ApiError, GoogleGenAI } from "@google/genai";
import type { ZodType } from "zod";

// gemini-2.5-flash was retired for new API keys — gemini-3.6-flash is
// Google's own suggested replacement (confirmed working in this same
// environment/account via the sibling `findr` project's lib/gemini.ts).
// Swap freely — nothing else here depends on anything model-specific.
export const MODEL = "gemini-3.6-flash";

let _client: GoogleGenAI | null = null;
// Built lazily on first real use — constructing this at module scope logs a
// warning at every `next build` page-data-collection pass, since routes get
// imported there without a real GEMINI_API_KEY in the build env.
export function geminiClient(): GoogleGenAI {
  if (!_client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Add it to .env.local.");
    _client = new GoogleGenAI({ apiKey });
  }
  return _client;
}

/** Shared JSON-parse-and-validate helper for every AI call in the app. */
export function parseJson<T>(schema: ZodType<T>, text: string | undefined, label: string): T {
  if (!text) throw new Error(`${label}: model returned no text.`);
  let json: unknown;
  try {
    json = JSON.parse(stripCodeFence(text));
  } catch {
    throw new Error(`${label}: model output wasn't valid JSON.`);
  }
  const result = schema.safeParse(json);
  if (!result.success) {
    throw new Error(`${label}: ${result.error.message}`);
  }
  return result.data;
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

/** Retry a model call once on a transient failure (network/5xx/429/timeout). */
export async function withRetries<T>(opts: {
  attempt: () => Promise<T>;
  isTransient?: (err: unknown) => boolean;
}): Promise<T> {
  const isTransient = opts.isTransient ?? defaultIsTransient;
  try {
    return await opts.attempt();
  } catch (err) {
    if (!isTransient(err)) throw err;
    return await opts.attempt();
  }
}

function defaultIsTransient(err: unknown): boolean {
  if (err instanceof ApiError) {
    return err.status === 429 || err.status >= 500;
  }
  return err instanceof Error && /timeout|network|ECONNRESET|fetch failed/i.test(err.message);
}
