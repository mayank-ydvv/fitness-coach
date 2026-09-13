import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  reporter: "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // Assumes `npm run dev` is already running on port 3100 (this repo's
  // fixed dev port — see package.json) rather than starting its own
  // server, since auth'd routes need a real signed-in browser session
  // that these tests don't set up themselves (see e2e/axe.spec.ts's
  // header comment on route coverage).
});
