-- ============================================
-- FN Dash Loja — Setup completo do Supabase
-- Rode este SQL no SQL Editor do Supabase
-- ============================================

-- 1. Garantir que profiles tem todas as colunas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'family';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{"font_size": "14", "reduce_motion": false, "high_contrast": false, "preferred_payment_method": "pix", "default_tax_rate": 0, "currency_format": "BRL", "date_format": "DD/MM/YYYY", "layout": "modern", "color_mode": "dark"}'::jsonb;

-- 2. RLS fully open para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Upsert own profile" ON public.profiles;
CREATE POLICY "Allow all profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);

-- 3. Criar profile para vitorvinhal90@gmail.com se não existir
INSERT INTO public.profiles (id, email, username, role, avatar, notifications, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  'admin',
  '',
  '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb,
  now(),
  now()
FROM auth.users au
WHERE au.email = 'vitorvinhal90@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id);

-- 4. Forçar admin para vitorvinhal90@gmail.com
UPDATE public.profiles SET role = 'admin' WHERE email = 'vitorvinhal90@gmail.com';

-- 5. RLS fully open para products, sales, expenses
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all products" ON public.products;
CREATE POLICY "Allow all products" ON public.products FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all sales" ON public.sales;
CREATE POLICY "Allow all sales" ON public.sales FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all expenses" ON public.expenses;
CREATE POLICY "Allow all expenses" ON public.expenses FOR ALL USING (true) WITH CHECK (true);

-- 6. Storage bucket para avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;
DROP POLICY IF EXISTS "Allow all avatars" ON storage.objects;
CREATE POLICY "Allow all avatars" ON storage.objects FOR ALL USING (bucket_id = 'avatars') WITH CHECK (bucket_id = 'avatars');
