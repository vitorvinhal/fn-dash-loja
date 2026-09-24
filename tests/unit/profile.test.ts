import { describe, it, expect } from "vitest";
import type { Profile } from "@/lib/supabase";

describe("Profile type", () => {
  it("should have required fields", () => {
    const profile: Profile = {
      id: "test-id",
      email: "test@example.com",
      role: "family",
      username: "testuser",
      avatar: "",
      notifications: { estoque: true, vendas: true, relatorios: false },
      settings: {
        font_size: "14",
        reduce_motion: false,
        high_contrast: false,
        preferred_payment_method: "pix",
        default_tax_rate: 0,
        currency_format: "BRL",
        date_format: "DD/MM/YYYY",
        layout: "modern",
        color_mode: "dark",
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(profile.id).toBeTruthy();
    expect(profile.email).toContain("@");
    expect(["admin", "family"]).toContain(profile.role);
  });

  it("should allow null username", () => {
    const profile: Profile = {
      id: "test-id",
      email: "test@example.com",
      role: "family",
      username: null,
      avatar: null,
      notifications: null,
      settings: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    expect(profile.username).toBeNull();
    expect(profile.avatar).toBeNull();
  });

  it("should accept valid notification structure", () => {
    const notifications = {
      estoque: true,
      vendas: false,
      relatorios: true,
    };

    expect(typeof notifications.estoque).toBe("boolean");
    expect(typeof notifications.vendas).toBe("boolean");
    expect(typeof notifications.relatorios).toBe("boolean");
  });
});

describe("Profile validation helpers", () => {
  function isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function isValidRole(role: string): role is "admin" | "family" {
    return role === "admin" || role === "family";
  }

  it("should validate email format", () => {
    expect(isValidEmail("user@example.com")).toBe(true);
    expect(isValidEmail("invalid")).toBe(false);
    expect(isValidEmail("@nope.com")).toBe(false);
    expect(isValidEmail("no@")).toBe(false);
  });

  it("should validate role values", () => {
    expect(isValidRole("admin")).toBe(true);
    expect(isValidRole("family")).toBe(true);
    expect(isValidRole("superadmin")).toBe(false);
    expect(isValidRole("")).toBe(false);
  });
});
