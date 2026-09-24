import { createBrowserClient } from "@supabase/ssr";

// Valores públicos (publishable) — sobrescritos por variáveis de ambiente.
// Alvo: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY
// Atenção: os valores abaixo já circularam em commit público. Rotacione as
// chaves no Supabase Dashboard e use apenas env vars daqui em diante.
const FALLBACK_URL = "https://rezvmfcbsossxwynlnce.supabase.co";
const FALLBACK_ANON_KEY = "sb_publishable_Ng4zcxmxK357tNMpklC_0w_y9JWUh_c";

export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || FALLBACK_URL;
export const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || FALLBACK_ANON_KEY;

// Sessão persistida em cookie (nome fixo) p/ permitir o guard server-side
// em src/proxy.ts. Cookie HTTP-only no padrão do @supabase/ssr.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  cookieOptions: {
    name: "fn-dash-auth-token",
    maxAge: 60 * 60 * 24 * 30,
    sameSite: "lax",
  },
});

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  email: string;
  role: "admin" | "family";
  username: string | null;
  avatar: string | null;
  notifications: {
    estoque: boolean;
    vendas: boolean;
    relatorios: boolean;
  } | null;
  settings: {
    font_size: string;
    reduce_motion: boolean;
    high_contrast: boolean;
    preferred_payment_method: string;
    default_tax_rate: number;
    currency_format: string;
    date_format: string;
    layout: string;
    color_mode: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  icon: string;
  color: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface UserData {
  id: string;
  user_id: string;
  section: string;
  payload: Json;
  created_at: string;
  updated_at: string;
}
