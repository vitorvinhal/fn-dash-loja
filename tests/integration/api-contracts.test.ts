/**
 * API contract tests: Validate responses match Zod schemas.
 *
 * Every endpoint's success AND error responses are validated
 * against the shared Zod schemas from src/lib/schemas.ts.
 *
 * These tests ensure:
 * 1. No extra fields leak into responses
 * 2. No required fields are missing
 * 3. Types match exactly (string, number, boolean, etc.)
 * 4. Error shapes are consistent
 * 5. Contract-breaking changes fail CI
 */

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import {
  ProductSchema,
  ProductListSchema,
  SaleSchema,
  SaleListSchema,
  ExpenseSchema,
  ExpenseListSchema,
  ErrorEnvelopeSchema,
  PaginationQuerySchema,
} from "../../src/lib/schemas";
import { Product, Sale, Expense } from "../factories";
import { getAuthToken, authHeader } from "../setup/auth-helpers";
import { cleanDatabase } from "../setup/test-db";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

let adminToken: string;

// =============================================
// Unknown field detector
// =============================================
function findUnknownFields(obj: unknown, schema: { shape: Record<string, unknown> }): string[] {
  if (typeof obj !== "object" || obj === null) return [];
  const knownKeys = new Set(Object.keys(schema.shape));
  return Object.keys(obj as Record<string, unknown>).filter((k) => !knownKeys.has(k));
}

// =============================================
// Product contract tests
// =============================================
describe("Product API Contracts", () => {
  beforeAll(async () => {
    adminToken = await getAuthToken("admin");
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("GET /api/products", () => {
    it("returns a valid ProductList envelope", async () => {
      await Product.create();

      const res = await fetch(`${BASE_URL}/api/products`, {
        headers: authHeader(adminToken),
      });
      const body = await res.json();

      expect(res.status).toBe(200);

      // Validate with list schema
      const result = ProductListSchema.safeParse(body);
      expect(result.success).toBe(true);

      // Validate each product in the array
      for (const item of body.data) {
        const itemResult = ProductSchema.safeParse(item);
        expect(itemResult.success).toBe(true);
      }
    });

    it("rejects response with unknown fields", async () => {
      await Product.create();

      const res = await fetch(`${BASE_URL}/api/products`, {
        headers: authHeader(adminToken),
      });
      const body = await res.json();

      for (const item of body.data) {
        const unknowns = findUnknownFields(item, ProductSchema);
        expect(unknowns).toEqual([]);
      }
    });

    it("returns valid pagination shape", async () => {
      await Product.createList(3);

      const res = await fetch(`${BASE_URL}/api/products?page=1&pageSize=2`, {
        headers: authHeader(adminToken),
      });
      const body = await res.json();

      expect(body.pagination).toBeDefined();
      expect(typeof body.pagination.page).toBe("number");
      expect(typeof body.pagination.pageSize).toBe("number");
      expect(typeof body.pagination.total).toBe("number");
      expect(typeof body.pagination.totalPages).toBe("number");
      expect(body.pagination.page).toBeGreaterThanOrEqual(1);
      expect(body.pagination.total).toBeGreaterThanOrEqual(3);
    });
  });

  describe("GET /api/products/:id", () => {
    it("returns a valid Product shape", async () => {
      const created = await Product.create({ description: "Contract Test" });

      const res = await fetch(`${BASE_URL}/api/products/${created.id}`, {
        headers: authHeader(adminToken),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      const result = ProductSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("returns valid error envelope on 404", async () => {
      const res = await fetch(`${BASE_URL}/api/products/nonexistent`, {
        headers: authHeader(adminToken),
      });
      const body = await res.json();

      expect(res.status).toBe(404);
      const result = ErrorEnvelopeSchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });

  describe("POST /api/products", () => {
    it("returns a valid Product on 201", async () => {
      const payload = Product.build({ description: "Contract Create" });

      const res = await fetch(`${BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(adminToken),
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      expect(res.status).toBe(201);
      const result = ProductSchema.safeParse(body);
      expect(result.success).toBe(true);
    });

    it("returns valid error on 422", async () => {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(adminToken),
        },
        body: JSON.stringify({ description: "" }),
      });
      const body = await res.json();

      expect(res.status).toBe(422);
      const result = ErrorEnvelopeSchema.safeParse(body);
      expect(result.success).toBe(true);
      expect(body.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns valid error on 401", async () => {
      const res = await fetch(`${BASE_URL}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Product.build()),
      });
      const body = await res.json();

      expect(res.status).toBe(401);
      const result = ErrorEnvelopeSchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });
});

// =============================================
// Sale contract tests
// =============================================
describe("Sale API Contracts", () => {
  beforeAll(async () => {
    adminToken = await getAuthToken("admin");
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("GET /api/sales", () => {
    it("returns a valid SaleList envelope", async () => {
      await Sale.create();

      const res = await fetch(`${BASE_URL}/api/sales`, {
        headers: authHeader(adminToken),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      const result = SaleListSchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });

  describe("POST /api/sales", () => {
    it("returns a valid Sale on 201", async () => {
      const payload = Sale.build();

      const res = await fetch(`${BASE_URL}/api/sales`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(adminToken),
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      expect(res.status).toBe(201);
      const result = SaleSchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });
});

// =============================================
// Expense contract tests
// =============================================
describe("Expense API Contracts", () => {
  beforeAll(async () => {
    adminToken = await getAuthToken("admin");
  });

  beforeEach(async () => {
    await cleanDatabase();
  });

  describe("GET /api/expenses", () => {
    it("returns a valid ExpenseList envelope", async () => {
      await Expense.create();

      const res = await fetch(`${BASE_URL}/api/expenses`, {
        headers: authHeader(adminToken),
      });
      const body = await res.json();

      expect(res.status).toBe(200);
      const result = ExpenseListSchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });

  describe("POST /api/expenses", () => {
    it("returns a valid Expense on 201", async () => {
      const payload = Expense.build();

      const res = await fetch(`${BASE_URL}/api/expenses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeader(adminToken),
        },
        body: JSON.stringify(payload),
      });
      const body = await res.json();

      expect(res.status).toBe(201);
      const result = ExpenseSchema.safeParse(body);
      expect(result.success).toBe(true);
    });
  });
});

// =============================================
// Error format consistency
// =============================================
describe("Error Format Consistency", () => {
  beforeAll(async () => {
    adminToken = await getAuthToken("admin");
  });

  it("401 follows error envelope", async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      headers: { Authorization: "Bearer invalid-token" },
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    const result = ErrorEnvelopeSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("404 follows error envelope", async () => {
    const res = await fetch(`${BASE_URL}/api/products/fake-id`, {
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    const result = ErrorEnvelopeSchema.safeParse(body);
    expect(result.success).toBe(true);
  });

  it("422 follows error envelope", async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(adminToken),
      },
      body: JSON.stringify({}),
    });
    const body = await res.json();

    expect(res.status).toBe(422);
    const result = ErrorEnvelopeSchema.safeParse(body);
    expect(result.success).toBe(true);
  });
});

// =============================================
// Pagination query validation
// =============================================
describe("Pagination Query Contract", () => {
  it("rejects negative page numbers", () => {
    const result = PaginationQuerySchema.safeParse({ page: "-1" });
    expect(result.success).toBe(false);
  });

  it("rejects pageSize > 100", () => {
    const result = PaginationQuerySchema.safeParse({ pageSize: "200" });
    expect(result.success).toBe(false);
  });

  it("accepts valid pagination params", () => {
    const result = PaginationQuerySchema.safeParse({ page: "2", pageSize: "10" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(2);
      expect(result.data.pageSize).toBe(10);
    }
  });
});
