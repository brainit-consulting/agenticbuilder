import { defineConfig, devices } from "@playwright/test";

// Playwright config for browser-driven end-to-end tests. We launch our own
// dev server here (Playwright reuses an existing one if it's already up on
// the port, so `npm run dev` + `npm run test:e2e` in two terminals works
// fine too).
//
// Browsers are NOT downloaded automatically by the npm install. Run
// `npx playwright install --with-deps chromium` before the first local
// `npm run test:e2e`. CI installs them in the workflow step.
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3010",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },
    },
  ],

  // Boot `next dev` ourselves so a clean `npx playwright test` works. If
  // you already have `npm run dev` in another terminal, Playwright reuses it.
  webServer: {
    command: "npx next dev -p 3010",
    url: "http://localhost:3010",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
