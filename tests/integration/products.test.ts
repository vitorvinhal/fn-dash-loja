/**
 * Integration tests: /api/products
 *
 * Tests the full HTTP stack against a real Supabase database.
 * Each test is isolated and independent of execution order.
 */

import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { Product } from "../factories";
import { getAuthToken, authHeader } from "../setup/auth-helpers";
import { cleanDatabase, countRows } from "../setup/test-db";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

let adminToken: string;
let familyToken: string;

// =============================================
// Error envelope shape
// =============================================
function expectErrorEnvelope(body: unknown, status: number) {
  expect(body).toHaveProperty("error");
  const err = (body as { error: Record<string, unknown> }).error;
  expect(typeof err.code).toBe("string");
  expect(typeof err.message).toBe("string");
  expect((err.code as string).length).toBeGreaterThan(0);
  expect((err.message as string).length).toBeGreaterThan(0);

  if (status === 422) {
    expect(err).toHaveProperty("details");
  }
}

// =============================================
// Product list shape
// =============================================
function expectProductListShape(body: unknown) {
  expect(body).toHaveProperty("data");
  expect(body).toHaveProperty("pagination");
  const { data, pagination } = body as { data: unknown[]; pagination: Record<string, number> };
  expect(Array.isArray(data)).toBe(true);
  expect(typeof pagination.page).toBe("number");
  expect(typeof pagination.pageSize).toBe("number");
  expect(typeof pagination.total).toBe("number");
  expect(typeof pagination.totalPages).toBe("number");
}

// =============================================
// Single product shape
// =============================================
function expectProductShape(product: unknown) {
  expect(product).toHaveProperty("id");
  expect(product).toHaveProperty("description");
  expect(product).toHaveProperty("amount");
  expect(product).toHaveProperty("category");
  expect(product).toHaveProperty("channel");
  expect(product).toHaveProperty("stock");
  expect(product).toHaveProperty("sku");
}

beforeAll(async () => {
  adminToken = await getAuthToken("admin");
  familyToken = await getAuthToken("family");
});

beforeEach(async () => {
  await cleanDatabase();
});

// =============================================
// GET /api/products — List with pagination
// =============================================
describe("GET /api/products", () => {
  it("returns empty list when no products exist", async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expectProductListShape(body);
    expect(body.data).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  });

  it("returns products after seeding", async () => {
    const product = Product.build({ description: "Test Shirt", stock: 15 });
    await Product.create(product);

    const res = await fetch(`${BASE_URL}/api/products`, {
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
    expect(body.data.some((p: { description: string }) => p.description === "Test Shirt")).toBe(true);
  });

  it("supports pagination", async () => {
    await Product.createList(5);

    const res1 = await fetch(`${BASE_URL}/api/products?page=1&pageSize=2`, {
      headers: authHeader(adminToken),
    });
    const body1 = await res1.json();

    expect(res1.status).toBe(200);
    expect(body1.data).toHaveLength(2);
    expect(body1.pagination.page).toBe(1);
    expect(body1.pagination.pageSize).toBe(2);
    expect(body1.pagination.total).toBe(5);
    expect(body1.pagination.totalPages).toBe(3);

    const res2 = await fetch(`${BASE_URL}/api/products?page=3&pageSize=2`, {
      headers: authHeader(adminToken),
    });
    const body2 = await res2.json();

    expect(body2.data).toHaveLength(1); // 5 items, page 3 = 1 item
  });

  it("filters by search query", async () => {
    await Product.create({ description: "Vestido Floral" });
    await Product.create({ description: "Camisa Azul" });

    const res = await fetch(`${BASE_URL}/api/products?search=Vestido`, {
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].description).toBe("Vestido Floral");
  });

  it("filters by category", async () => {
    await Product.create({ category: "Camisas" });
    await Product.create({ category: "Vestidos" });

    const res = await fetch(`${BASE_URL}/api/products?category=Camisas`, {
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.every((p: { category: string }) => p.category === "Camisas")).toBe(true);
  });

  it("filters by channel", async () => {
    await Product.create({ channel: "Shopee" });
    await Product.create({ channel: "Loja Física" });

    const res = await fetch(`${BASE_URL}/api/products?channel=Shopee`, {
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.every((p: { channel: string }) => p.channel === "Shopee")).toBe(true);
  });

  it("returns 400 for invalid query params", async () => {
    const res = await fetch(`${BASE_URL}/api/products?page=-1`, {
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expectErrorEnvelope(body, 400);
  });
});

// =============================================
// GET /api/products/:id — Get one
// =============================================
describe("GET /api/products/:id", () => {
  it("returns a product by id", async () => {
    const created = await Product.create({ description: "Test Get One" });

    const res = await fetch(`${BASE_URL}/api/products/${created.id}`, {
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expectProductShape(body);
    expect(body.description).toBe("Test Get One");
    expect(body.id).toBe(created.id);
  });

  it("returns 404 for nonexistent product", async () => {
    const res = await fetch(`${BASE_URL}/api/products/nonexistent-id`, {
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expectErrorEnvelope(body, 404);
    expect(body.error.code).toBe("NOT_FOUND");
  });
});

// =============================================
// POST /api/products — Create
// =============================================
describe("POST /api/products", () => {
  it("creates a product with valid data (201)", async () => {
    const payload = Product.build({ description: "New Product" });

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
    expectProductShape(body);
    expect(body.description).toBe("New Product");
    expect(body.id).toBeTruthy();
  });

  it("returns 422 for invalid body", async () => {
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
    expectErrorEnvelope(body, 422);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });

  it("returns 400 for invalid JSON", async () => {
    const res = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(adminToken),
      },
      body: "not json",
    });
    const body = await res.json();

    expect(res.status).toBe(400);
    expectErrorEnvelope(body, 400);
  });

  it("returns 401 without auth token", async () => {
    const payload = Product.build();

    const res = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const body = await res.json();

    expect(res.status).toBe(401);
    expectErrorEnvelope(body, 401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("allows family role to create products", async () => {
    const payload = Product.build({ description: "Family Product" });

    const res = await fetch(`${BASE_URL}/api/products`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(familyToken),
      },
      body: JSON.stringify(payload),
    });

    expect(res.status).toBe(201);
  });
});

// =============================================
// PUT /api/products/:id — Update
// =============================================
describe("PUT /api/products/:id", () => {
  it("updates a product (owner/admin)", async () => {
    const created = await Product.create({ description: "Original" });

    const res = await fetch(`${BASE_URL}/api/products/${created.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(adminToken),
      },
      body: JSON.stringify({ description: "Updated" }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expectProductShape(body);
    expect(body.description).toBe("Updated");
  });

  it("returns 404 for nonexistent product", async () => {
    const res = await fetch(`${BASE_URL}/api/products/fake-id`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(adminToken),
      },
      body: JSON.stringify({ description: "Updated" }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expectErrorEnvelope(body, 404);
  });

  it("returns 401 without auth", async () => {
    const created = await Product.create();

    const res = await fetch(`${BASE_URL}/api/products/${created.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Updated" }),
    });

    expect(res.status).toBe(401);
  });

  it("returns 422 for invalid update body", async () => {
    const created = await Product.create();

    const res = await fetch(`${BASE_URL}/api/products/${created.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeader(adminToken),
      },
      body: JSON.stringify({ amount: -100 }),
    });
    const body = await res.json();

    expect(res.status).toBe(422);
    expectErrorEnvelope(body, 422);
  });
});

// =============================================
// DELETE /api/products/:id
// =============================================
describe("DELETE /api/products/:id", () => {
  it("deletes a product", async () => {
    const created = await Product.create();

    const res = await fetch(`${BASE_URL}/api/products/${created.id}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    });

    expect(res.status).toBe(204);

    // Verify deletion
    const getRes = await fetch(`${BASE_URL}/api/products/${created.id}`, {
      headers: authHeader(adminToken),
    });
    expect(getRes.status).toBe(404);
  });

  it("returns 404 for nonexistent product (idempotent delete)", async () => {
    const res = await fetch(`${BASE_URL}/api/products/nonexistent`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expectErrorEnvelope(body, 404);
  });

  it("returns 401 without auth", async () => {
    const created = await Product.create();

    const res = await fetch(`${BASE_URL}/api/products/${created.id}`, {
      method: "DELETE",
    });

    expect(res.status).toBe(401);
  });
});

// =============================================
// Side effects
// =============================================
describe("Side effects", () => {
  it("create increases total count", async () => {
    const countBefore = await countRows("products");

    await Product.create();

    const countAfter = await countRows("products");
    expect(countAfter).toBe(countBefore + 1);
  });

  it("delete decreases total count", async () => {
    const created = await Product.create();
    const countBefore = await countRows("products");

    await fetch(`${BASE_URL}/api/products/${created.id}`, {
      method: "DELETE",
      headers: authHeader(adminToken),
    });

    const countAfter = await countRows("products");
    expect(countAfter).toBe(countBefore - 1);
  });
});
