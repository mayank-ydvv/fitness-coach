import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * WCAG 2.1 AA gate (spec §12/§15). Covers the routes reachable WITHOUT a
 * real signed-in session — this environment has no way to mint one (no
 * service-role key, no email inbox to click a magic link from), so the
 * six authenticated routes the spec names (Today/Train/Eat/Habits/
 * Progress/Settings) aren't covered by this file. `/demo` is the
 * practical substitute: it's the one route that's both public and fully
 * populated, reusing the exact same presentational components those six
 * routes render. Extend this file with `page.goto('/today')` etc. once a
 * test fixture user + programmatic sign-in exists.
 */
const PUBLIC_ROUTES = ["/", "/login", "/demo"];

for (const route of PUBLIC_ROUTES) {
  test(`${route} has no serious or critical axe violations`, async ({ page }) => {
    // The landing page's hero has a staged entrance animation
    // (components/marketing/Hero.tsx) — without this, axe can scan mid-fade
    // (an element still at opacity:0) and report a false-positive contrast
    // violation. Hero already honors prefers-reduced-motion via
    // useReducedMotion(), so emulating it here exercises the real settled
    // state, the same one a reduced-motion user always sees.
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(route);
    const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();

    const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
    if (serious.length > 0) {
      console.log(JSON.stringify(serious, null, 2));
    }
    expect(serious).toEqual([]);
  });
}

test("360px viewport has no horizontal scroll on the landing page", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1); // +1 for sub-pixel rounding
});

test("360px viewport has no horizontal scroll on the demo page", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/demo");
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 1);
});
