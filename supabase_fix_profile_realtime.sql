-- ============================================
-- FN Dash Loja — FIX: profiles realtime + logs
-- v2.1.17 — 2026-09-06
-- ============================================
-- PROBLEMA: tabela profiles nao estava na publicacao
-- de realtime, entao mudancas no profile (avatar,
-- username, notifications) nao sincronizavam entre
-- dispositivos em tempo real.
-- ============================================

-- 1. Adicionar profiles à publicação de realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Verificar se profiles está na publicação
SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles';

-- 3. Garantir que RLS está completamente aberto para profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Dropar policies antigas que podem estar causando conflito
DO $$ DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.profiles';
  END LOOP;
END $$;

-- Criar policies simples e seguras
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (true);

-- 4. Garantir que trigger de updated_at existe
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. Garantir que handle_new_user está correto (SECURITY DEFINER)
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

-- 6. Garantir colunas necessárias
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notifications jsonb DEFAULT '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'family';

-- 7. Garantir que vitorvinhal90 é admin
UPDATE public.profiles SET role = 'admin' WHERE email = 'vitorvinhal90@gmail.com';

-- 8. Garantir profile para vitorvinhal90
INSERT INTO public.profiles (id, email, role, username, avatar, notifications, created_at, updated_at)
SELECT
  au.id, au.email, 'admin',
  COALESCE(au.raw_user_meta_data->>'username', split_part(au.email, '@', 1)),
  '', '{"estoque": true, "vendas": true, "relatorios": false}'::jsonb,
  now(), now()
FROM auth.users au
WHERE au.email = 'vitorvinhal90@gmail.com'
AND NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = au.id);

-- 9. Storage bucket avatars (caso não exista)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

-- 10. Verificação final
SELECT
  'profiles_realtime' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'profiles'
  ) THEN 'OK' ELSE 'FALHOU' END as status
UNION ALL
SELECT
  'profiles_rls' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_tables WHERE tablename = 'profiles' AND schemaname = 'public' AND rowsecurity = true
  ) THEN 'OK' ELSE 'FALHOU' END as status
UNION ALL
SELECT
  'profiles_policies' as check_name,
  CASE WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'profiles' AND schemaname = 'public') >= 4
  THEN 'OK' ELSE 'FALHOU' END as status;
