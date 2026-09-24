-- ============================================
-- FN Dash Loja — SQL Unificado (rodar uma vez)
-- Cole no SQL Editor do Supabase e clique "Run"
-- ============================================

-- =============================================
-- 1. PROFILES — colunas garantidas
-- =============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'family';

-- =============================================
-- 2. PROFILES — RLS: dropar TUDO e recriar aberto
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Dropar todas as policies antigas (nomes conhecidos dos dois SQLs)
DROP POLICY IF EXISTS "Allow all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Upsert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Criar policy única e aberta
CREATE POLICY "Allow all profiles" ON public.profiles
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 3. PRODUCTS — RLS aberto
-- =============================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all products" ON public.products;
DROP POLICY IF EXISTS "Anyone can view products" ON public.products;
DROP POLICY IF EXISTS "Anyone can insert products" ON public.products;
DROP POLICY IF EXISTS "Anyone can update products" ON public.products;
DROP POLICY IF EXISTS "Anyone can delete products" ON public.products;
CREATE POLICY "Allow all products" ON public.products
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 4. SALES — RLS aberto
-- =============================================
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can view sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can insert sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can update sales" ON public.sales;
DROP POLICY IF EXISTS "Anyone can delete sales" ON public.sales;
CREATE POLICY "Allow all sales" ON public.sales
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 5. EXPENSES — RLS aberto
-- =============================================
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all expenses" ON public.expenses;
DROP POLICY IF EXISTS "Anyone can view expenses" ON public.expenses;
DROP POLICY IF EXISTS "Anyone can insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Anyone can update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Anyone can delete expenses" ON public.expenses;
CREATE POLICY "Allow all expenses" ON public.expenses
  FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 6. USER_DATA — RLS por usuário
-- =============================================
ALTER TABLE public.user_data ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can insert own data" ON public.user_data;
DROP POLICY IF EXISTS "Users can update own data" ON public.user_data;
CREATE POLICY "Users can view own data" ON public.user_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own data" ON public.user_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own data" ON public.user_data
  FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 7. STORAGE — bucket avatars
-- =============================================
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Allow all avatars" ON storage.objects;
CREATE POLICY "Allow all avatars" ON storage.objects
  FOR ALL USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');

-- =============================================
-- 8. REALTIME — adicionar tables
-- =============================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.sales;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =============================================
-- 9. TRIGGERS — updated_at automático
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON public.products;
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;
CREATE TRIGGER update_sales_updated_at
  BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_expenses_updated_at ON public.expenses;
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_data_updated_at ON public.user_data;
CREATE TRIGGER update_user_data_updated_at
  BEFORE UPDATE ON public.user_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. AUTO-CRIAR profile no signup
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 11. Garantir que vitorvinhal90 é admin
-- =============================================
UPDATE public.profiles SET role = 'admin' WHERE email = 'vitorvinhal90@gmail.com';

-- =============================================
-- 12. Fazer INSERT do próprio profile se não existir
--    (para o caso de já ter account mas sem profile)
-- =============================================
INSERT INTO public.profiles (id, email, role, username, avatar, notifications, created_at, updated_at)
SELECT
  au.id,
  au.email,
  'admin',
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  '',
  '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb,
  now(),
  now()
FROM auth.users au
WHERE au.email = 'vitorvinhal90@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id);
