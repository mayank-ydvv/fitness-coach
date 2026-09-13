import "server-only";
import { Type, type Schema } from "@google/genai";
import { z } from "zod";
import { geminiClient, MODEL, parseJson, withRetries } from "./client";

// Spec §10.1, implemented verbatim.
const SYSTEM_PROMPT = `You estimate nutrition from food photographs. You are careful and you
show your uncertainty honestly.

Return ONLY valid JSON matching the schema. No markdown, no commentary.

Method:
1. Identify each distinct food and drink item.
2. Estimate portion size in grams. Use visible scale references — cutlery,
   plate diameter (assume 27 cm dinner plate, 20 cm side plate unless
   evidence suggests otherwise), hands, cans, packaging.
3. Derive kcal and macros from the gram estimate using standard composition
   values for that food as typically prepared.
4. Give a plausible low/high kcal range for each item, reflecting real
   uncertainty in portion and preparation. Fried and sauced foods carry
   wider ranges. Do not narrow a range to look confident.
5. Set confidence per item: 0.9+ only for clearly visible, unambiguous,
   easily measured items. Drop below 0.5 when the food is obscured, mixed,
   or the cooking method is unclear.

Rules:
- If the image contains no food, set is_food to false and return no items.
- Never guess a brand unless packaging or a label is legible.
- Note hidden calories you cannot see — cooking oil, dressing, butter — in
  assumptions, and include a reasonable amount in the estimate.
- If the plate may be shared or is not clearly one serving, set
  portion_ambiguous to true.`;

const MealItemSchema = z.object({
  name: z.string(),
  portion_description: z.string(),
  grams: z.number(),
  kcal: z.number(),
  kcal_low: z.number(),
  kcal_high: z.number(),
  protein_g: z.number(),
  carbs_g: z.number(),
  fat_g: z.number(),
  fiber_g: z.number(),
  confidence: z.number().min(0).max(1),
});

export const MealAnalysisSchema = z.object({
  is_food: z.boolean(),
  portion_ambiguous: z.boolean(),
  meal_type_guess: z.enum(["breakfast", "lunch", "dinner", "snack"]),
  items: z.array(MealItemSchema),
  assumptions: z.array(z.string()),
});

export type MealAnalysis = z.infer<typeof MealAnalysisSchema>;

// Hand-written alongside the Zod schema above (kept in sync by hand, same
// pattern as the sibling `findr` project's lib/gemini.ts) — Gemini's
// responseSchema config needs its own Type-based shape, distinct from Zod.
const RESPONSE_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    is_food: { type: Type.BOOLEAN },
    portion_ambiguous: { type: Type.BOOLEAN },
    meal_type_guess: { type: Type.STRING, enum: ["breakfast", "lunch", "dinner", "snack"] },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          portion_description: { type: Type.STRING },
          grams: { type: Type.NUMBER },
          kcal: { type: Type.NUMBER },
          kcal_low: { type: Type.NUMBER },
          kcal_high: { type: Type.NUMBER },
          protein_g: { type: Type.NUMBER },
          carbs_g: { type: Type.NUMBER },
          fat_g: { type: Type.NUMBER },
          fiber_g: { type: Type.NUMBER },
          confidence: { type: Type.NUMBER },
        },
        required: ["name", "portion_description", "grams", "kcal", "kcal_low", "kcal_high", "protein_g", "carbs_g", "fat_g", "fiber_g", "confidence"],
      },
    },
    assumptions: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ["is_food", "portion_ambiguous", "meal_type_guess", "items", "assumptions"],
};

export async function analyzeMealPhoto(params: {
  imageBase64: string;
  mediaType: "image/webp" | "image/jpeg";
  userNote?: string;
}): Promise<MealAnalysis> {
  const client = geminiClient();

  async function callOnce(validationError?: string): Promise<MealAnalysis> {
    const userText = [
      params.userNote ? `User note: ${params.userNote}` : null,
      validationError
        ? `Your previous response failed validation: ${validationError}\nReturn corrected JSON matching the schema exactly.`
        : null,
      "Analyze the food in this photo.",
    ]
      .filter(Boolean)
      .join("\n\n");

    const response = await client.models.generateContent({
      model: MODEL,
      contents: [
        { inlineData: { data: params.imageBase64, mimeType: params.mediaType } },
        { text: userText },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    });

    return parseJson(MealAnalysisSchema, response.text, "meal vision");
  }

  return withRetries({
    attempt: async () => {
      try {
        return await callOnce();
      } catch (err) {
        // Retry once with the validation error appended, per the M0 AI
        // wrapper contract — distinct from the transient-failure retry in
        // withRetries, so this one always fires on a parse failure.
        if (err instanceof Error && /meal vision:/.test(err.message)) {
          return await callOnce(err.message);
        }
        throw err;
      }
    },
  });
}
