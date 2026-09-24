/**
 * Global setup for Playwright E2E tests.
 * Authenticates once and reuses the session.
 */

import { test as setup, expect } from "@playwright/test";

const authFile = "tests/e2e/.auth/user.json";

setup("authenticate", async ({ page }) => {
  const email = process.env.TEST_EMAIL;
  const password = process.env.TEST_PASSWORD;

  if (!email || !password) {
    console.warn("TEST_EMAIL/TEST_PASSWORD not set, skipping auth setup");
    return;
  }

  // Navigate to login
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Fill and submit login form
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/senha/i).fill(password);
  await page.getByRole("button", { name: /entrar|login/i }).click();

  // Wait for redirect to dashboard
  await page.waitForURL("/", { timeout: 15000 });
  await expect(page).toHaveURL("/");

  // Save auth state
  await page.context().storageState({ path: authFile });
});
