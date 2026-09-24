import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin, requireAdmin } from "@/lib/api-utils";

const TABLES_SQL = `
-- =============================================
-- FN Dash Loja — Categorias + Tags
-- Execute no Supabase SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  icon text DEFAULT '',
  color text DEFAULT '#64748b',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, parent_id)
);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.categories';
  END LOOP;
END $$;
CREATE POLICY "categories_all" ON public.categories FOR ALL USING (true) WITH CHECK (true);
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'product_tags' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.product_tags';
  END LOOP;
END $$;
CREATE POLICY "product_tags_all" ON public.product_tags FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.product_tag_relations (
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);
ALTER TABLE public.product_tag_relations ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'product_tag_relations' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.product_tag_relations';
  END LOOP;
END $$;
CREATE POLICY "product_tag_relations_all" ON public.product_tag_relations FOR ALL USING (true) WITH CHECK (true);

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.categories; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.product_tags; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.product_tag_relations; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  IF (SELECT COUNT(*) FROM public.categories) = 0 THEN
    INSERT INTO public.categories (id, name, slug, icon, color, sort_order) VALUES
      ('a0000001-0000-0000-0000-000000000001', 'Roupas', 'roupas', '👕', '#64748b', 1),
      ('a0000001-0000-0000-0000-000000000002', 'Acessórios', 'acessorios', '👜', '#64748b', 2),
      ('a0000001-0000-0000-0000-000000000003', 'Maquiagem', 'maquiagem', '💄', '#64748b', 3),
      ('a0000001-0000-0000-0000-000000000004', 'Perfumes', 'perfumes', '🧴', '#64748b', 4);
    INSERT INTO public.categories (id, name, slug, parent_id, icon, color, sort_order) VALUES
      ('b0000001-0000-0000-0000-000000000001', 'Feminino', 'feminino', 'a0000001-0000-0000-0000-000000000001', '👗', '#64748b', 1),
      ('b0000001-0000-0000-0000-000000000002', 'Masculino', 'masculino', 'a0000001-0000-0000-0000-000000000001', '👔', '#64748b', 2),
      ('b0000001-0000-0000-0000-000000000003', 'Infantil', 'infantil', 'a0000001-0000-0000-0000-000000000001', '🧸', '#64748b', 3);
    INSERT INTO public.product_tags (id, name, color) VALUES
      ('d0000001-0000-0000-0000-000000000001', 'Novo', '#22c55e'),
      ('d0000001-0000-0000-0000-000000000002', 'Promoção', '#ef4444'),
      ('d0000001-0000-0000-0000-000000000003', 'Lançamento', '#a855f7'),
      ('d0000001-0000-0000-0000-000000000004', 'Baixo Estoque', '#eab308'),
      ('d0000001-0000-0000-0000-000000000005', 'Mais Vendido', '#f97316'),
      ('d0000001-0000-0000-0000-000000000006', 'Edição Limitada', '#ec4899');
  END IF;
END $$;
`;

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const admin = getSupabaseAdmin();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const { error: catErr } = await admin.from("categories").select("id").limit(1);
  const categoriesExist = !catErr || !catErr.message?.includes("does not exist");

  const { error: tagErr } = await admin.from("product_tags").select("id").limit(1);
  const tagsExist = !tagErr || !tagErr.message?.includes("does not exist");

  if (categoriesExist && tagsExist) {
    return NextResponse.json({ ok: true, tablesExist: true, message: "Tabelas já existem!" });
  }

  if (serviceKey && !categoriesExist && !tagsExist) {
    try {
      const { error } = await admin.rpc("exec_sql", { sql: TABLES_SQL });
      if (!error) {
        return NextResponse.json({ ok: true, tablesExist: true, message: "Tabelas criadas com sucesso!", created: true });
      }
    } catch {}
  }

  return NextResponse.json({
    ok: false,
    tablesExist: false,
    message: "Tabelas não encontradas. Execute o SQL no Supabase.",
    sql: TABLES_SQL,
    supabaseUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/_/sql/new`,
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const admin = getSupabaseAdmin();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceKey) {
    try {
      const { error } = await admin.rpc("exec_sql", { sql: TABLES_SQL });
      if (!error) {
        return NextResponse.json({ ok: true, message: "Tabelas criadas com sucesso!" });
      }
    } catch {}
  }

  return NextResponse.json({
    ok: false,
    message: "Não foi possível criar automaticamente. Execute o SQL manualmente.",
    sql: TABLES_SQL,
    supabaseUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/project/_/sql/new`,
  });
}
