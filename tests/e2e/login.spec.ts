import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test("should redirect to login when not authenticated", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/login/);
  });

  test("should show login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByLabel(/e-mail/i)).toBeVisible();
    await expect(page.getByLabel(/senha/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /entrar/i })).toBeVisible();
  });

  test("should show error with wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/e-mail/i).fill("wrong@email.com");
    await page.getByLabel(/senha/i).fill("wrongpassword");
    await page.getByRole("button", { name: /entrar/i }).click();
    await expect(page.getByText(/erro|inválid|incorrect/i)).toBeVisible({ timeout: 10_000 });
  });

  test("should login successfully and redirect to dashboard", async ({ page }) => {
    const email = process.env.TEST_EMAIL || "vitorvinhal90@gmail.com";
    const password = process.env.TEST_PASSWORD || "";

    if (!password) {
      test.skip(true, "TEST_PASSWORD not set");
      return;
    }

    await page.goto("/login");
    await page.getByLabel(/e-mail/i).fill(email);
    await page.getByLabel(/senha/i).fill(password);
    await page.getByRole("button", { name: /entrar/i }).click();

    await expect(page).toHaveURL(/\//, { timeout: 15_000 });
    await expect(page.getByText(/visão geral/i)).toBeVisible({ timeout: 10_000 });
  });
});
