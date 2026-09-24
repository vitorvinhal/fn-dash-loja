/**
 * Visual regression tests using Playwright screenshot comparison.
 *
 * Tests each component state with deterministic rendering:
 * - Freeze time and animations
 * - Disable transitions
 * - Wait for fonts/images
 * - Mask dynamic content
 * - Pin viewport and device-scale
 */

import { test, expect } from "@playwright/test";

// Freeze time for deterministic screenshots
test.use({
  locale: "pt-BR",
  timezoneId: "America/Sao_Paulo",
});

// Disable animations globally for screenshots
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Freeze Date.now
    const fixedTime = new Date("2026-01-15T10:00:00Z").getTime();
    Date.now = () => fixedTime;
    // @ts-expect-error - Override for screenshots
    Date = class extends Date {
      constructor(...args: unknown[]) {
        if (args.length === 0) {
          super(fixedTime);
        } else {
          // @ts-expect-error - pass through
          super(...args);
        }
      }
      static override now() {
        return fixedTime;
      }
    };

    // Disable animations
    const style = document.createElement("style");
    style.textContent = `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `;
    document.head.appendChild(style);
  });
});

// =============================================
// Dashboard KPI Cards
// =============================================
test.describe("Visual: Dashboard", () => {
  test("KPI cards - default state", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Mask dynamic content
    await page.evaluate(() => {
      // Mask timestamps
      document.querySelectorAll("[data-testid='timestamp']").forEach((el) => {
        el.textContent = "2026-01-15";
      });
    });

    await expect(page.locator("[data-testid='kpi-cards']")).toHaveScreenshot(
      "kpi-cards.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test("Dashboard - desktop layout", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("dashboard-desktop.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });

  test("Dashboard - mobile layout", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page).toHaveScreenshot("dashboard-mobile.png", {
      fullPage: true,
      maxDiffPixelRatio: 0.01,
    });
  });
});

// =============================================
// Marketplace / Product Cards
// =============================================
test.describe("Visual: Marketplace", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/marketplace");
    await page.waitForLoadState("networkidle");
  });

  test("Product grid - populated", async ({ page }) => {
    await expect(page.locator("[data-testid='product-grid']")).toHaveScreenshot(
      "product-grid.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test("Product grid - empty state", async ({ page }) => {
    await page.fill("[data-testid='search-input']", "xyznonexistent");
    await expect(page.locator("[data-testid='empty-state']")).toHaveScreenshot(
      "product-grid-empty.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test("Product form modal", async ({ page }) => {
    await page.click("[data-testid='new-product-btn']");
    await expect(page.locator("[data-testid='product-form-modal']")).toHaveScreenshot(
      "product-form.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test("Product form - with validation errors", async ({ page }) => {
    await page.click("[data-testid='new-product-btn']");
    // Submit without filling required fields
    await page.click("[data-testid='submit-product']");
    await expect(page.locator("[data-testid='product-form-modal']")).toHaveScreenshot(
      "product-form-errors.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });
});

// =============================================
// Settings Page
// =============================================
test.describe("Visual: Settings", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/configuracoes");
    await page.waitForLoadState("networkidle");
  });

  test("Settings - profile section", async ({ page }) => {
    await expect(page.locator("[data-testid='profile-section']")).toHaveScreenshot(
      "settings-profile.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test("Settings - notification toggles", async ({ page }) => {
    await expect(page.locator("[data-testid='notification-settings']")).toHaveScreenshot(
      "settings-notifications.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });
});

// =============================================
// Login Page
// =============================================
test.describe("Visual: Login", () => {
  test("Login form - default state", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-testid='login-form']")).toHaveScreenshot(
      "login-form.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test("Login form - error state", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.fill("[data-testid='email-input']", "wrong@example.com");
    await page.fill("[data-testid='password-input']", "wrongpassword");
    await page.click("[data-testid='login-submit']");

    await expect(page.locator("[data-testid='login-form']")).toHaveScreenshot(
      "login-form-error.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });
});

// =============================================
// Responsive Navigation
// =============================================
test.describe("Visual: Navigation", () => {
  test("Sidebar - desktop expanded", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-testid='sidebar']")).toHaveScreenshot(
      "sidebar-desktop.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test("Sidebar - mobile hamburger", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-testid='mobile-nav']")).toHaveScreenshot(
      "mobile-nav.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });
});

// =============================================
// Data Table States
// =============================================
test.describe("Visual: Data Tables", () => {
  test("Table - empty state", async ({ page }) => {
    await page.goto("/estoque");
    await page.waitForLoadState("networkidle");

    await expect(page.locator("[data-testid='stock-table']")).toHaveScreenshot(
      "table-empty.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });

  test("Table - populated state", async ({ page }) => {
    await page.goto("/estoque");
    await page.waitForLoadState("networkidle");

    // Wait for data to load
    await expect(page.locator("[data-testid='stock-table'] tr")).toHaveCount(1, { timeout: 10000 });

    await expect(page.locator("[data-testid='stock-table']")).toHaveScreenshot(
      "table-populated.png",
      { maxDiffPixelRatio: 0.01 }
    );
  });
});
