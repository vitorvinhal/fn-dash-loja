import { test, expect } from "@playwright/test";

test.describe("Configurações - Perfil", () => {
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
    await page.goto("/configuracoes");
    await expect(page.getByText(/configurações/i)).toBeVisible({ timeout: 10_000 });
  });

  test("should display profile section", async ({ page }) => {
    await expect(page.getByText(/perfil/i)).toBeVisible();
    await expect(page.getByText(/foto de perfil/i)).toBeVisible();
    await expect(page.getByLabel(/nome de usuário/i)).toBeVisible();
  });

  test("should display notification settings", async ({ page }) => {
    await expect(page.getByText(/notificações/i)).toBeVisible();
    await expect(page.getByText(/estoque baixo/i)).toBeVisible();
    await expect(page.getByText(/novas vendas/i)).toBeVisible();
    await expect(page.getByText(/relatórios semanais/i)).toBeVisible();
  });

  test("should update username", async ({ page }) => {
    const input = page.getByLabel(/nome de usuário/i);
    await input.clear();
    await input.fill("TesteAdmin");
    await input.press("Tab");

    await expect(page.getByText(/salvo!/i)).toBeVisible({ timeout: 5_000 });
  });

  test("should toggle notification setting", async ({ page }) => {
    const toggle = page.getByText(/estoque baixo/i).locator("..").locator("button");
    await toggle.click();

    await expect(page.getByText(/salvo!/i)).toBeVisible({ timeout: 5_000 });
  });

  test("should display system info", async ({ page }) => {
    await expect(page.getByText(/sistema/i)).toBeVisible();
    await expect(page.getByText(/versão/i)).toBeVisible();
    await expect(page.getByText(/supabase/i)).toBeVisible();
  });
});
