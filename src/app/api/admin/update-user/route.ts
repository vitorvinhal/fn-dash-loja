import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "@/lib/api-utils";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  try {
    const body: Record<string, string> = await request.json();
    const { userId, email, username, role, avatar, password } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, message: "userId é obrigatório" });
    }

    const admin = getSupabaseAdmin();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Update auth (email and/or password) — requer service role key
    if (serviceKey) {
      const authUpdates: Record<string, string> = {};
      if (email) authUpdates.email = email;
      if (password) authUpdates.password = password;

      if (Object.keys(authUpdates).length > 0) {
        const { error: authError } = await admin.auth.admin.updateUserById(userId, authUpdates);
        if (authError) {
          return NextResponse.json({
            ok: false,
            message: "Erro ao atualizar auth: " + authError.message,
          });
        }
      }
    }

    // Update profile
    const updates: Record<string, string | boolean | null> = { updated_at: new Date().toISOString() };
    if (username !== undefined) updates.username = username || null;
    if (role !== undefined) updates.role = role || "family";
    if (avatar !== undefined) updates.avatar = avatar || null;
    if (email !== undefined) updates.email = email;

    const { error: profileError } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", userId);

    if (profileError) {
      return NextResponse.json({
        ok: false,
        message: "Erro ao atualizar perfil: " + profileError.message,
      });
    }

    return NextResponse.json({ ok: true, message: "Usuário atualizado com sucesso!" });
  } catch (err: unknown) {
    return NextResponse.json({
      ok: false,
      message: "Erro interno: " + (err instanceof Error ? err.message : "Desconhecido"),
    });
  }
}