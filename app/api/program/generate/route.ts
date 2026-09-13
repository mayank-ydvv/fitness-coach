import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateProgram } from "@/lib/program/generate";
import { DailyCapError } from "@/lib/ai/jobs";
import { EQUIPMENT, EXPERIENCE_LEVELS, GOALS } from "@/lib/types";

// A Gemini call plus one retry can take a while — must be set explicitly
// (see M2's analyze route for the same reasoning).
export const maxDuration = 60;

const GenerateSchema = z.object({
  goal: z.enum(GOALS),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  daysPerWeek: z.number().int().min(1).max(7),
  sessionMinutes: z.number().int().min(15).max(180),
  equipment: z.array(z.enum(EQUIPMENT)).min(1),
  limitations: z.string().max(500).default(""),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in." }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = GenerateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input.", issues: z.flattenError(parsed.error) }, { status: 400 });
  }

  try {
    const result = await generateProgram(supabase, { userId: user.id, ...parsed.data });
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof DailyCapError) {
      return NextResponse.json({ error: "rate_limited", message: `You've hit today's limit of ${err.limit} program generations.` }, { status: 429 });
    }
    return NextResponse.json({ error: "Couldn't build your program. Try again." }, { status: 500 });
  }
}
