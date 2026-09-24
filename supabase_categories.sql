-- ============================================
-- FN Dash Loja — Sistema de Categorias
-- v2.1.18 — 2026-09-06
-- ============================================
-- Categorias hierárquicas (auto-referenciada)
-- Tags de produtos
-- Relação produto-tag (N:N)
-- ============================================

-- =============================================
-- 1. CATEGORIES — hierarquia auto-referenciada
-- =============================================
CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  parent_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  icon text DEFAULT '',
  color text DEFAULT '#a78bfa',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(name, parent_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);
CREATE INDEX IF NOT EXISTS idx_categories_sort_order ON public.categories(sort_order);

-- RLS aberto
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'categories' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.categories';
  END LOOP;
END $$;
CREATE POLICY "categories_all" ON public.categories FOR ALL USING (true) WITH CHECK (true);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_categories_updated_at ON public.categories;
CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 2. PRODUCT TAGS
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

-- RLS aberto
ALTER TABLE public.product_tags ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'product_tags' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.product_tags';
  END LOOP;
END $$;
CREATE POLICY "product_tags_all" ON public.product_tags FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 3. PRODUCT TAG RELATIONS (N:N)
-- =============================================
CREATE TABLE IF NOT EXISTS public.product_tag_relations (
  product_id text NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.product_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, tag_id)
);

-- RLS aberto
ALTER TABLE public.product_tag_relations ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'product_tag_relations' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.product_tag_relations';
  END LOOP;
END $$;
CREATE POLICY "product_tag_relations_all" ON public.product_tag_relations FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 4. Realtime
-- =============================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.categories; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.product_tags; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.product_tag_relations; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- 5. Categorias iniciais (seed)
-- =============================================
-- Só insere se a tabela estiver vazia
DO $$ BEGIN
  IF (SELECT COUNT(*) FROM public.categories) = 0 THEN
    -- Categorias raiz
    INSERT INTO public.categories (id, name, slug, icon, color, sort_order) VALUES
      ('a0000001-0000-0000-0000-000000000001', 'Roupas', 'roupas', '👕', '#a78bfa', 1),
      ('a0000001-0000-0000-0000-000000000002', 'Acessórios', 'acessorios', '👜', '#22d3ee', 2),
      ('a0000001-0000-0000-0000-000000000003', 'Maquiagem', 'maquiagem', '💄', '#f472b6', 3),
      ('a0000001-0000-0000-0000-000000000004', 'Perfumes', 'perfumes', '🧴', '#fb923c', 4);

    -- Subcategorias de Roupas
    INSERT INTO public.categories (id, name, slug, parent_id, icon, color, sort_order) VALUES
      ('b0000001-0000-0000-0000-000000000001', 'Feminino', 'feminino', 'a0000001-0000-0000-0000-000000000001', '👗', '#ec4899', 1),
      ('b0000001-0000-0000-0000-000000000002', 'Masculino', 'masculino', 'a0000001-0000-0000-0000-000000000001', '👔', '#3b82f6', 2),
      ('b0000001-0000-0000-0000-000000000003', 'Infantil', 'infantil', 'a0000001-0000-0000-0000-000000000001', '🧸', '#22c55e', 3);

    -- Subcategorias de Feminino
    INSERT INTO public.categories (id, name, slug, parent_id, icon, color, sort_order) VALUES
      ('c0000001-0000-0000-0000-000000000001', 'Vestidos', 'vestidos', 'b0000001-0000-0000-0000-000000000001', '', '#ec4899', 1),
      ('c0000001-0000-0000-0000-000000000002', 'Blusas', 'blusas', 'b0000001-0000-0000-0000-000000000001', '', '#ec4899', 2),
      ('c0000001-0000-0000-0000-000000000003', 'Saias', 'saias', 'b0000001-0000-0000-0000-000000000001', '', '#ec4899', 3),
      ('c0000001-0000-0000-0000-000000000004', 'Calças', 'calcas-fem', 'b0000001-0000-0000-0000-000000000001', '', '#ec4899', 4),
      ('c0000001-0000-0000-0000-000000000005', 'Casacos', 'casacos-fem', 'b0000001-0000-0000-0000-000000000001', '', '#ec4899', 5);

    -- Subcategorias de Masculino
    INSERT INTO public.categories (id, name, slug, parent_id, icon, color, sort_order) VALUES
      ('c0000001-0000-0000-0000-000000000010', 'Camisas', 'camisas', 'b0000001-0000-0000-0000-000000000002', '', '#3b82f6', 1),
      ('c0000001-0000-0000-0000-000000000011', 'Calças', 'calcas-masc', 'b0000001-0000-0000-0000-000000000002', '', '#3b82f6', 2),
      ('c0000001-0000-0000-0000-000000000012', 'Camisetas', 'camisetas', 'b0000001-0000-0000-0000-000000000002', '', '#3b82f6', 3);

    -- Tags iniciais
    INSERT INTO public.product_tags (id, name, color) VALUES
      ('d0000001-0000-0000-0000-000000000001', 'Novo', '#22c55e'),
      ('d0000001-0000-0000-0000-000000000002', 'Promoção', '#ef4444'),
      ('d0000001-0000-0000-0000-000000000003', 'Lançamento', '#a855f7'),
      ('d0000001-0000-0000-0000-000000000004', 'Baixo Estoque', '#eab308'),
      ('d0000001-0000-0000-0000-000000000005', 'Mais Vendido', '#f97316'),
      ('d0000001-0000-0000-0000-000000000006', 'Edição Limitada', '#ec4899');
  END IF;
END $$;

-- =============================================
-- 6. Verificação final
-- =============================================
SELECT
  'categories' as table_name,
  (SELECT COUNT(*) FROM public.categories) as row_count,
  CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'categories') THEN 'realtime OK' ELSE 'sem realtime' END as status
UNION ALL
SELECT
  'product_tags',
  (SELECT COUNT(*) FROM public.product_tags),
  CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'product_tags') THEN 'realtime OK' ELSE 'sem realtime' END
UNION ALL
SELECT
  'product_tag_relations',
  (SELECT COUNT(*) FROM public.product_tag_relations),
  CASE WHEN EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'product_tag_relations') THEN 'realtime OK' ELSE 'sem realtime' END;
