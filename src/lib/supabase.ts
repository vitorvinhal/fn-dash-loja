import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://rezvmfcbsossxwynlnce.supabase.co";
const supabaseAnonKey = "sb_publishable_Ng4zcxmxK357tNMpklC_0w_y9JWUh_c";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
