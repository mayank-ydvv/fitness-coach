// Runs lib/nutrition/targets.test-cases.ts. No CLI test runner exists yet
// (M5 adds node:test for the form-analysis modules) — this uses Node's
// native TS support directly: `node --experimental-strip-types scripts/check-targets.ts`.
import { runTargetsTestCases } from "../lib/nutrition/targets.test-cases";

const results = runTargetsTestCases();
for (const r of results) {
  console.log(`${r.pass ? "✅ PASS" : "❌ FAIL"}  ${r.name}${r.detail ? `  (${r.detail})` : ""}`);
}
const passCount = results.filter((r) => r.pass).length;
console.log(`\n${passCount}/${results.length} passed.`);
if (passCount !== results.length) process.exit(1);
