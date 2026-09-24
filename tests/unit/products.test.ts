import { describe, it, expect } from "vitest";
import {
  calcUnitProfit,
  calcMargin,
  generateSKU,
  CATEGORIES,
  CHANNELS,
  PAYMENT_METHODS,
  EXPENSE_CATEGORIES,
} from "@/data/products";

describe("calcUnitProfit", () => {
  it("should calculate profit without commission or shipping", () => {
    expect(calcUnitProfit(100, 60)).toBe(40);
  });

  it("should calculate profit with commission", () => {
    expect(calcUnitProfit(100, 60, 10)).toBe(36);
  });

  it("should calculate profit with shipping", () => {
    expect(calcUnitProfit(100, 60, 0, 10)).toBe(30);
  });

  it("should calculate profit with commission and shipping", () => {
    expect(calcUnitProfit(100, 60, 10, 10)).toBe(26);
  });

  it("should return negative profit when cost exceeds price", () => {
    expect(calcUnitProfit(50, 60)).toBe(-10);
  });

  it("should handle zero price", () => {
    expect(calcUnitProfit(0, 60)).toBe(-60);
  });
});

describe("calcMargin", () => {
  it("should calculate simple margin", () => {
    expect(calcMargin(100, 60)).toBe(40);
  });

  it("should return 0 for zero price", () => {
    expect(calcMargin(0, 60)).toBe(0);
  });

  it("should calculate margin with qty, commission and shipping", () => {
    const margin = calcMargin(100, 20, 2, 10, 5);
    // revenue=100, cost=40, commission=10, shipping=10
    // (100-40-10-10)/100 * 100 = 40%
    expect(margin).toBe(40);
  });

  it("should return 100% margin when cost is zero", () => {
    expect(calcMargin(100, 0)).toBe(100);
  });
});

describe("generateSKU", () => {
  it("should generate SKU with category prefix", () => {
    const sku = generateSKU("Camisas");
    expect(sku).toMatch(/^CAM-\d{3}$/);
  });

  it("should generate unique SKUs", () => {
    const skus = new Set(Array.from({ length: 50 }, () => generateSKU("Vestidos")));
    expect(skus.size).toBeGreaterThan(1);
  });

  it("should use first 3 characters of category", () => {
    const sku = generateSKU("Maquiagem");
    expect(sku).toMatch(/^MAQ-/);
  });
});

describe("constants", () => {
  it("should have valid categories", () => {
    expect(CATEGORIES.length).toBeGreaterThan(0);
    CATEGORIES.forEach((cat) => {
      expect(typeof cat).toBe("string");
      expect(cat.length).toBeGreaterThan(0);
    });
  });

  it("should have valid channels", () => {
    expect(CHANNELS.length).toBeGreaterThan(0);
    CHANNELS.forEach((ch) => {
      expect(typeof ch).toBe("string");
    });
  });

  it("should have valid payment methods", () => {
    expect(PAYMENT_METHODS.length).toBeGreaterThan(0);
    PAYMENT_METHODS.forEach((pm) => {
      expect(pm.value).toBeTruthy();
      expect(pm.label).toBeTruthy();
    });
  });

  it("should have valid expense categories", () => {
    expect(EXPENSE_CATEGORIES.length).toBeGreaterThan(0);
  });
});
