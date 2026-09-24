import { NextRequest } from "next/server";
import {
  errorResponse,
  getSupabaseAdmin,
  parseBody,
  parseQuery,
  requireAuth,
} from "@/lib/api-utils";
import {
  CreateProductBodySchema,
  PaginationQuerySchema,
  ProductListSchema,
  ProductSchema,
} from "@/lib/schemas";

// =============================================
// GET /api/products — list with pagination & filters
// =============================================
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const query = parseQuery(req, PaginationQuerySchema);
  if (query.error) return query.error;

  const { page, pageSize, search, category, channel, sort, order } = query.data;
  const supabase = getSupabaseAdmin();

  let qb = supabase.from("products").select("*", { count: "exact" });

  if (search) {
    qb = qb.or(`data->>'description'.ilike.%${search}%,data->>'sku'.ilike.%${search}%`);
  }
  if (category) {
    qb = qb.eq("data->>'category'", category);
  }
  if (channel) {
    qb = qb.eq("data->>'channel'", channel);
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

  const validation = ProductListSchema.safeParse(body);
  if (!validation.success) {
    return errorResponse(500, "SCHEMA_MISMATCH", "Response shape invalid", validation.error.flatten());
  }

  return Response.json(body);
}

// =============================================
// POST /api/products — create
// =============================================
export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const body = await parseBody(req, CreateProductBodySchema);
  if (body.error) return body.error;

  const supabase = getSupabaseAdmin();
  const id = `prod-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("products")
    .insert({ id, data: { ...body.data, created_at: now, updated_at: now } })
    .select()
    .single();

  if (error) {
    return errorResponse(500, "DB_ERROR", error.message);
  }

  const product = { id: data.id, ...((data as { data: Record<string, unknown> }).data) };
  const validation = ProductSchema.safeParse(product);
  if (!validation.success) {
    return errorResponse(500, "SCHEMA_MISMATCH", "Created product shape invalid", validation.error.flatten());
  }

  return Response.json(product, { status: 201 });
}
