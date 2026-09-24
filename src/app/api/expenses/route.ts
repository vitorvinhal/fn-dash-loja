import { NextRequest } from "next/server";
import {
  errorResponse,
  getSupabaseAdmin,
  parseBody,
  parseQuery,
  requireAuth,
} from "@/lib/api-utils";
import {
  CreateExpenseBodySchema,
  PaginationQuerySchema,
  ExpenseListSchema,
  ExpenseSchema,
} from "@/lib/schemas";

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const query = parseQuery(req, PaginationQuerySchema);
  if (query.error) return query.error;

  const { page, pageSize, search, sort, order } = query.data;
  const supabase = getSupabaseAdmin();

  let qb = supabase.from("expenses").select("*", { count: "exact" });

  if (search) {
    qb = qb.or(`data->>'description'.ilike.%${search}%,data->>'category'.ilike.%${search}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, count, error } = await qb
    .order(`data->>'${sort}'`, { ascending: order === "asc" })
    .range(from, to);

  if (error) {
    return errorResponse(500, "DB_ERROR", error.message);
  }

  const total = count || 0;
  const body = {
    data: (data || []).map((row: { id: string; data: Record<string, unknown> }) => ({
      id: row.id,
      ...row.data,
    })),
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  };

  const validation = ExpenseListSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(500, "SCHEMA_MISMATCH", "Response shape invalid", validation.error.flatten());
  }

  return Response.json(body);
}

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const body = await parseBody(req, CreateExpenseBodySchema);
  if (body.error) return body.error;

  const supabase = getSupabaseAdmin();
  const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("expenses")
    .insert({ id, data: { ...body.data, created_at: now } })
    .select()
    .single();

  if (error) {
    return errorResponse(500, "DB_ERROR", error.message);
  }

  const expense = { id: data.id, ...((data as { data: Record<string, unknown> }).data) };
  const validation = ExpenseSchema.safeParse(expense);
  if (!validation.success) {
    return errorResponse(500, "SCHEMA_MISMATCH", "Created expense shape invalid", validation.error.flatten());
  }

  return Response.json(expense, { status: 201 });
}
