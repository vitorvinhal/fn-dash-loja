import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test.beforeEach(async ({ page }) => {
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
  });

  test("should display KPI cards", async ({ page }) => {
    await expect(page.getByText(/receita total/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/lucro real/i)).toBeVisible();
    await expect(page.getByText(/produtos/i)).toBeVisible();
    await expect(page.getByText(/estoque baixo/i)).toBeVisible();
  });

  test("should display charts section", async ({ page }) => {
    await expect(page.getByText(/vendas por categoria/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/receita por canal/i)).toBeVisible();
  });

  test("should have working sidebar navigation", async ({ page }) => {
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /marketplace/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /vendas/i })).toBeVisible();
  });

  test("should navigate to marketplace", async ({ page }) => {
    await page.getByRole("link", { name: /marketplace/i }).first().click();
    await expect(page).toHaveURL(/\/marketplace/, { timeout: 10_000 });
  });

  test("should navigate to settings", async ({ page }) => {
    await page.getByRole("link", { name: /configurações/i }).first().click();
    await expect(page).toHaveURL(/\/configuracoes/, { timeout: 10_000 });
  });
});
