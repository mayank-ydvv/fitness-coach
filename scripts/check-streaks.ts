import { computeStreaks } from "../lib/habits/streaks";

type Case = { name: string; today: string; done: string[]; restDay: boolean; expect: { current: number; longest: number } };

const CASES: Case[] = [
  {
    name: "3-day current streak, done through today",
    today: "2024-01-10",
    done: ["2024-01-08", "2024-01-09", "2024-01-10"],
    restDay: false,
    expect: { current: 3, longest: 3 },
  },
  {
    name: "streak continues if today not yet logged but yesterday was",
    today: "2024-01-10",
    done: ["2024-01-08", "2024-01-09"],
    restDay: false,
    expect: { current: 2, longest: 2 },
  },
  {
    name: "a real gap breaks the streak without rest days enabled",
    today: "2024-01-10",
    done: ["2024-01-05", "2024-01-09", "2024-01-10"],
    restDay: false,
    expect: { current: 2, longest: 2 },
  },
  {
    name: "no logs at all -> zero/zero",
    today: "2024-01-10",
    done: [],
    restDay: false,
    expect: { current: 0, longest: 0 },
  },
  {
    name: "single rest day within the week doesn't break the streak (rest day doesn't itself add to the count, it just doesn't reset it — Duolingo-style 'preserves', not 'counts')",
    today: "2024-01-10", // a Wednesday
    // Mon 1/8 done, Tue 1/9 MISSED (rest day), Wed 1/10 done
    done: ["2024-01-08", "2024-01-10"],
    restDay: true,
    expect: { current: 2, longest: 2 },
  },
  {
    name: "a second miss in the same week (rest day already used) breaks it",
    today: "2024-01-11", // Thursday
    // Mon done, Tue missed (rest day used), Wed missed too, Thu done
    done: ["2024-01-08", "2024-01-11"],
    restDay: true,
    expect: { current: 1, longest: 1 },
  },
];

let failed = 0;
for (const c of CASES) {
  const result = computeStreaks(c.done.map((d) => ({ logDate: d, status: "done" as const })), c.today, c.restDay);
  const pass = result.current === c.expect.current && result.longest === c.expect.longest;
  console.log(`${pass ? "✅ PASS" : "❌ FAIL"}  ${c.name}${pass ? "" : `  (got ${JSON.stringify(result)}, expected ${JSON.stringify(c.expect)})`}`);
  if (!pass) failed++;
}
console.log(`\n${CASES.length - failed}/${CASES.length} passed.`);
if (failed) process.exit(1);
