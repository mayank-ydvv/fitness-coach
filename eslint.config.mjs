import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
    },
  },
  {
    // Units and "today" must flow through their single boundary module, never
    // be reached for directly — see lib/units/convert.ts and lib/time/localDay.ts.
    files: ["components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["**/lib/units/convert", "**/lib/units/convert.ts"],
              message:
                "Don't import convert.ts from a component. Read/write measurements through useMeasure()/lib/prefs/server.ts so unit system and hide-calories stay consistent.",
            },
            {
              group: ["**/lib/nutrition/targets", "**/lib/nutrition/guardrails"],
              message:
                "Nutrition target math belongs server-side (onboarding/profile routes). Components should read the computed nutrition_targets row, not recompute it.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: [".next/**", "out/**", "build/**", "next-env.d.ts", "public/mediapipe/**"],
  },
];

export default eslintConfig;
