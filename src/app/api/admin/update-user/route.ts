import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FALLBACK_URL = "https://rezvmfcbsossxwynlnce.supabase.co";
const FALLBACK_ANON_KEY = "sb_publishable_Ng4zcxmxK357tNMpklC_0w_y9JWUh_c";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, email, username, role, avatar, password } = body;

    if (!userId) {
      return NextResponse.json({ ok: false, message: "userId é obrigatório" });
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

    const key = serviceKey || anonKey;
    if (!key) {
      return NextResponse.json({ ok: false, message: "Chave Supabase não encontrada" });
    }

    const admin = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Update auth (email and/or password) if service key available
    if (serviceKey) {
      const authUpdates: Record<string, any> = {};
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
    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (username !== undefined) updates.username = username || null;
    if (role !== undefined) updates.role = role;
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
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      message: "Erro interno: " + (err?.message || "Desconhecido"),
    });
  }
}
