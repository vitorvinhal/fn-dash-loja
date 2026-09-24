-- ============================================
-- FN Dash Loja — SQL Unificado v2 (corrigido)
-- Rode uma vez no SQL Editor do Supabase
-- ============================================

-- =============================================
-- 1. DESABILITAR RLS para limpar policies antigas
-- =============================================
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. Dropar TODAS as policies da tabela profiles
-- =============================================
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
  END LOOP;
END $$;

-- =============================================
-- 3. Reabilitar RLS com policies limpas
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (true);

-- =============================================
-- 4. Garantir colunas na tabela profiles
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'family';

-- =============================================
-- 5. Garantir que vitorvinhal90 é admin e tem profile
-- =============================================
UPDATE public.profiles SET role = 'admin' WHERE email = 'vitorvinhal90@gmail.com';

INSERT INTO public.profiles (id, email, role, username, avatar, notifications, created_at, updated_at)
SELECT
  au.id, au.email, 'admin',
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  '', '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb,
  now(), now()
FROM auth.users au
WHERE au.email = 'vitorvinhal90@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id);

-- =============================================
-- 6. Fix trigger handle_new_user (SECURITY DEFINER)
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, username, notifications)
  VALUES (
    NEW.id, NEW.email,
    CASE WHEN (SELECT COUNT(*) FROM public.profiles) = 0 THEN 'admin' ELSE 'family' END,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END $$;

-- =============================================
-- 7. PRODUCTS — RLS aberto
-- =============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'products' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.products';
  END LOOP;
END $$;
CREATE POLICY "products_all" ON public.products FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 8. SALES — RLS aberto
-- =============================================
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'sales' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.sales';
  END LOOP;
END $$;
CREATE POLICY "sales_all" ON public.sales FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 9. EXPENSES — RLS aberto
-- =============================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'expenses' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.expenses';
  END LOOP;
END $$;
CREATE POLICY "expenses_all" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 10. USER_DATA — RLS por usuário
-- =============================================
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'user_data' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.user_data';
  END LOOP;
END $$;
CREATE POLICY "user_data_select" ON public.user_data FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "user_data_insert" ON public.user_data FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_data_update" ON public.user_data FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 11. STORAGE — bucket avatars
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname LIKE '%avatar%') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON storage.objects';
  END LOOP;
END $$;
CREATE POLICY "avatars_all" ON storage.objects FOR ALL USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

-- =============================================
-- 12. REALTIME
-- =============================================
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.products; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.sales; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- 13. TRIGGERS — updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON public.sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
