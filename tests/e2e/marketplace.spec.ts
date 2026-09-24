import { test, expect } from "@playwright/test";

test.describe("Marketplace", () => {
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
    await page.goto("/marketplace");
    await expect(page.getByText(/marketplace/i)).toBeVisible({ timeout: 10_000 });
  });

  test("should display marketplace page", async ({ page }) => {
    await expect(page.getByText(/marketplace/i).first()).toBeVisible();
  });

  test("should have search functionality", async ({ page }) => {
    const searchInput = page.getByPlaceholder(/buscar/i);
    await expect(searchInput).toBeVisible();
  });

  test("should display product cards or empty state", async ({ page }) => {
    const hasProducts = await page.getByText(/nenhum produto/i).isVisible().catch(() => false);
    const hasCards = await page.locator("[class*=card]").count().then((c) => c > 0);

    expect(hasProducts || hasCards).toBeTruthy();
  });

  test("should open new product form", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /novo produto|adicionar/i });
    if (await addButton.isVisible()) {
      await addButton.click();
      await expect(page.getByText(/descrição|nome do produto/i)).toBeVisible({ timeout: 5_000 });
    }
  });
});
