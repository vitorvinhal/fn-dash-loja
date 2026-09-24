/**
 * Test database setup and teardown.
 *
 * Strategy: Use the Supabase REST API for all DB operations (real HTTP stack).
 * Tests are isolated by cleaning all rows before each test suite.
 *
 * For a real PostgreSQL test DB, set TEST_DATABASE_URL in .env.test.
 * For Supabase, set NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.test.
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

export function getTestSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.TEST_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.TEST_SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing test DB config. Set TEST_SUPABASE_URL + TEST_SUPABASE_KEY in .env.test"
    );
  }

  _client = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return _client;
}

/**
 * Clean all test data from tables.
 * Runs DELETE with no filter to remove all rows.
 */
export async function cleanDatabase(): Promise<void> {
  const db = getTestSupabase();

  const tables = ["products", "sales", "expenses"];
  for (const table of tables) {
    const { error } = await db.from(table).delete().neq("id", "__nonexistent__");
    if (error) {
      console.error(`Failed to clean table ${table}:`, error.message);
    }
  }
}

/**
 * Seed a product row directly into the database.
 */
export async function seedProduct(product: Record<string, unknown>) {
  const db = getTestSupabase();
  const id = (product.id as string) || `test-prod-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await db
    .from("products")
    .upsert({ id, data: { ...product, id } }, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(`Seed product failed: ${error.message}`);
  return { id, ...((data as { data: Record<string, unknown> }).data || product) };
}

/**
 * Seed a sale row directly into the database.
 */
export async function seedSale(sale: Record<string, unknown>) {
  const db = getTestSupabase();
  const id = (sale.id as string) || `test-sale-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await db
    .from("sales")
    .upsert({ id, data: { ...sale, id } }, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(`Seed sale failed: ${error.message}`);
  return { id, ...((data as { data: Record<string, unknown> }).data || sale) };
}

/**
 * Seed an expense row directly into the database.
 */
export async function seedExpense(expense: Record<string, unknown>) {
  const db = getTestSupabase();
  const id = (expense.id as string) || `test-exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  const { data, error } = await db
    .from("expenses")
    .upsert({ id, data: { ...expense, id } }, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(`Seed expense failed: ${error.message}`);
  return { id, ...((data as { data: Record<string, unknown> }).data || expense) };
}

/**
 * Count rows in a table.
 */
export async function countRows(table: string): Promise<number> {
  const db = getTestSupabase();
  const { count, error } = await db
    .from(table)
    .select("*", { count: "exact", head: true });

  if (error) throw new Error(`Count failed: ${error.message}`);
  return count || 0;
}
