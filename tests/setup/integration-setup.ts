/**
 * Global setup for integration tests.
 * Runs once before the test suite.
 */

import { beforeAll, afterAll } from "vitest";
import { cleanDatabase } from "./test-db";

beforeAll(async () => {
  // Clean database before tests
  await cleanDatabase();
});

afterAll(async () => {
  // Clean up after all tests
  await cleanDatabase();
});
