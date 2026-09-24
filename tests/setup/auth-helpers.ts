/**
 * Auth helper: mint valid JWTs and manage test sessions.
 *
 * Strategy: Use Supabase Auth to create/retrieve test users,
 * then return the access token for use in Authorization headers.
 */

import { getTestSupabase } from "./test-db";

interface TestUser {
  userId: string;
  email: string;
  password: string;
  role: "admin" | "family";
  token?: string;
}

const TEST_PASSWORD = "Test123456!";

// Pre-seeded test users (created once in global setup)
const testUsers: Record<string, TestUser> = {
  admin: {
    userId: "",
    email: `test-admin-${Date.now()}@test.example.com`,
    password: TEST_PASSWORD,
    role: "admin",
  },
  family: {
    userId: "",
    email: `test-family-${Date.now()}@test.example.com`,
    password: TEST_PASSWORD,
    role: "family",
  },
};

/**
 * Create test users in Supabase Auth and set their roles.
 * Call this once in globalSetup or beforeAll.
 */
export async function seedTestUsers(): Promise<void> {
  const db = getTestSupabase();

  for (const [key, user] of Object.entries(testUsers)) {
    // Sign up
    const { data: authData, error: authError } = await db.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
    });

    if (authError && !authError.message.includes("already")) {
      throw new Error(`Failed to create test user ${key}: ${authError.message}`);
    }

    if (authData?.user) {
      testUsers[key].userId = authData.user.id;

      // Set role in profiles
      await db.from("profiles").upsert(
        {
          id: authData.user.id,
          email: user.email,
          role: user.role,
        },
        { onConflict: "id" }
      );
    }
  }
}

/**
 * Get a valid access token for a test user.
 * Signs in with email/password and returns the JWT.
 */
export async function getAuthToken(
  role: "admin" | "family" = "admin"
): Promise<string> {
  const user = testUsers[role];
  if (!user) throw new Error(`Unknown role: ${role}`);

  const db = getTestSupabase();
  const { data, error } = await db.auth.signInWithPassword({
    email: user.email,
    password: user.password,
  });

  if (error) {
    throw new Error(`Failed to sign in test user ${role}: ${error.message}`);
  }

  return data.session.access_token;
}

/**
 * Get the user ID for a test user.
 */
export function getTestUserId(role: "admin" | "family" = "admin"): string {
  return testUsers[role].userId;
}

/**
 * Build authorization header.
 */
export function authHeader(token: string): { authorization: string } {
  return { authorization: `Bearer ${token}` };
}

/**
 * Cleanup test users. Call in global teardown.
 */
export async function cleanupTestUsers(): Promise<void> {
  const db = getTestSupabase();

  for (const user of Object.values(testUsers)) {
    if (user.userId) {
      await db.auth.admin.deleteUser(user.userId);
    }
  }
}
