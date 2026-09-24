import { defineConfig, devices } from "@playwright/test";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["html", { open: "never" }],
    ["list"],
  ],
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    locale: "pt-BR",
    timezoneId: "America/Sao_Paulo",
  },
  expect: {
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.01,
      animations: "disabled",
    },
  },
  projects: [
    // E2E tests
    {
      name: "e2e-desktop",
      testDir: "./e2e",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "e2e-tablet",
      testDir: "./e2e",
      use: { ...devices["iPad (gen 7)"] },
    },
    {
      name: "e2e-mobile",
      testDir: "./e2e",
      use: { ...devices["iPhone 13"] },
    },
    // Visual regression tests
    {
      name: "visual",
      testDir: "./visual",
      use: {
        ...devices["Desktop Chrome"],
        screenshot: "only-on-failure",
      },
    },
  ],
  webServer: process.env.CI
    ? undefined
    : {
        command: "npm run dev",
        port: 3000,
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
