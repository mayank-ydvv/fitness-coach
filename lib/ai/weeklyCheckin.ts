import "server-only";
import { Type, type Schema } from "@google/genai";
import { z } from "zod";
import { geminiClient, MODEL, parseJson } from "./client";

const SYSTEM_PROMPT = `You write a short weekly check-in from a week's training, nutrition, and
habit data. Plain, second person, present tense. State facts, then one
instruction for next week. No exclamation points, no "great job", no
manufactured enthusiasm — if the week was quiet, say so plainly.

Never rank foods as good or bad. Never comment on body weight change as
good or bad in itself. If nutrition intake was well below target for most
of the week, mention it once, plainly, without alarm.

Return ONLY valid JSON matching the schema — 2-4 sentences.`;

const WeeklyCheckinResponseSchema = z.object({ summary: z.string() });
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: { summary: { type: Type.STRING } },
  required: ["summary"],
};

export type WeeklyCheckinInput = {
  sessionsCompleted: number;
  totalVolumeKg: number;
  setsWithMissedTargets: number;
  mealsLoggedDays: number; // out of 7
  averageProteinG: number | null;
  proteinTargetG: number | null;
  habitsHitRate: { name: string; hitDays: number; targetDays: number }[];
};

export async function generateWeeklyCheckin(input: WeeklyCheckinInput): Promise<string> {
  const client = geminiClient();
  const response = await client.models.generateContent({
    model: MODEL,
    contents: `Input: ${JSON.stringify(input)}`,
    config: {
      systemInstruction: SYSTEM_PROMPT,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  });
  const { summary } = parseJson(WeeklyCheckinResponseSchema, response.text, "weekly checkin");
  return summary.trim();
}
