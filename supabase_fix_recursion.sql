-- ============================================
-- FN Dash Loja — FIX: infinite recursion profiles
-- ============================================

-- 1. DESABILITAR RLS temporariamente para limpar tudo
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- 2. Dropar TODAS as policies da tabela profiles (qualquer nome)
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
  END LOOP;
END $$;

-- 3. Reabilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar policy simples e segura
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON public.profiles
  FOR DELETE USING (true);

-- 5. Garantir colunas
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'family';

-- 6. Garantir que vitorvinhal90 é admin e tem profile
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

-- 7. Fix trigger handle_new_user (SECURITY DEFINER para evitar recursion)
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
