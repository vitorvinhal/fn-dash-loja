import { NextRequest, NextResponse } from "next/server";
import { z, ZodSchema } from "zod";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// =============================================
// Error response helper
// =============================================
export function errorResponse(
  status: number,
  code: string,
  message: string,
  details?: unknown
) {
  return NextResponse.json({ error: { code, message, details } }, { status });
}

// =============================================
// Parse & validate request body
// =============================================
export async function parseBody<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): Promise<{ data: T; error?: never } | { data?: never; error: NextResponse }> {
  try {
    const raw = await req.json();
    const result = schema.safeParse(raw);
    if (!result.success) {
      return {
        error: errorResponse(422, "VALIDATION_ERROR", "Invalid request body", result.error.flatten()),
      };
    }
    return { data: result.data };
  } catch {
    return {
      error: errorResponse(400, "PARSE_ERROR", "Invalid JSON body"),
    };
  }
}

// =============================================
// Parse query params
// =============================================
export function parseQuery<T>(
  req: NextRequest,
  schema: ZodSchema<T>
): { data: T; error?: never } | { data?: never; error: NextResponse } {
  const raw: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((v, k) => { raw[k] = v; });
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      error: errorResponse(400, "INVALID_QUERY", "Invalid query parameters", result.error.flatten()),
    };
  }
  return { data: result.data };
}

// =============================================
// Supabase admin client (for server-side)
// =============================================
export function getSupabaseAdmin(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase environment variables");
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// =============================================
// Extract user from Authorization header
// =============================================
export async function getUserFromRequest(
  req: NextRequest
): Promise<{ userId: string; email: string; role: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const supabase = getSupabaseAdmin();

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) return null;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    return {
      userId: user.id,
      email: user.email || "",
      role: (profile as { role: string } | null)?.role || "family",
    };
  } catch {
    return null;
  }
}

// =============================================
// Auth middleware
// =============================================
export async function requireAuth(
  req: NextRequest
): Promise<
  | { user: { userId: string; email: string; role: string }; error?: never }
  | { user?: never; error: NextResponse }
> {
  const user = await getUserFromRequest(req);
  if (!user) {
    return { error: errorResponse(401, "UNAUTHORIZED", "Authentication required") };
  }
  return { user };
}

export async function requireAdmin(
  req: NextRequest
): Promise<
  | { user: { userId: string; email: string; role: string }; error?: never }
  | { user?: never; error: NextResponse }
> {
  const auth = await requireAuth(req);
  if (auth.error) return auth;
  if (auth.user.role !== "admin") {
    return { error: errorResponse(403, "FORBIDDEN", "Admin access required") };
  }
  return auth;
}
