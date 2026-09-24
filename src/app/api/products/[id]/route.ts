import { NextRequest } from "next/server";
import { errorResponse, getSupabaseAdmin, parseBody, requireAuth } from "@/lib/api-utils";
import { ProductSchema, UpdateProductBodySchema } from "@/lib/schemas";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("products")
    .select("id, data")
    .eq("id", id)
    .single();

  if (error || !data) {
    return errorResponse(404, "NOT_FOUND", "Product not found");
  }

  const product = { id: data.id, ...((data as { data: Record<string, unknown> }).data) };
  const validation = ProductSchema.safeParse(product);
  if (!validation.success) {
    return errorResponse(500, "SCHEMA_MISMATCH", "Product shape invalid", validation.error.flatten());
  }

  return Response.json(product);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await parseBody(req, UpdateProductBodySchema);
  if (body.error) return body.error;

  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("id, data")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return errorResponse(404, "NOT_FOUND", "Product not found");
  }

  const now = new Date().toISOString();
  const merged = { ...((existing as { data: Record<string, unknown> }).data), ...body.data, updated_at: now };

  const { data, error } = await supabase
    .from("products")
    .update({ data: merged })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return errorResponse(500, "DB_ERROR", error.message);
  }

  const product = { id: data.id, ...((data as { data: Record<string, unknown> }).data) };
  return Response.json(product);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth(req);
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = getSupabaseAdmin();

  const { data: existing, error: fetchError } = await supabase
    .from("products")
    .select("id")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return errorResponse(404, "NOT_FOUND", "Product not found");
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) {
    return errorResponse(500, "DB_ERROR", error.message);
  }

  return new Response(null, { status: 204 });
}
