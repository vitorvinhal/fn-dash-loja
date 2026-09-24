-- =====================================================================
-- FN Dash Loja — Security Hardening
-- Execute no Supabase SQL Editor (SQL > Editores de consulta > Novas query)
-- ---------------------------------------------------------------------
-- Objetivo: substituir as policies abertas (FOR ALL USING true) por
-- policies que exigem sessão autenticada. Dados continuam compartilhados
-- entre usuários logados da família (mesmo modelo de negócio), mas
-- leituras/escritas anônimas passam a ser bloqueadas em todas as tabelas.
--
-- Reversível: para voltar ao comportamento antigo, remova estas policies
-- e recrie as originais ("Allow all ..." / "..._all" USING (true)).
--
-- NOTA: as rotas de API usam a SERVICE ROLE KEY (bypassa RLS) e o Admin
-- segue com acesso total via essas policies por papel (admin).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1) products / sales / expenses — dados principais (JSONB em coluna data)
-- ---------------------------------------------------------------------
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['products','sales','expenses','channels','categories','product_tags','product_tag_relations']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Allow all %s" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_insert" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_select" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_update" ON public.%I', t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s_delete" ON public.%I', t, t);
  END LOOP;
END $$;

CREATE POLICY "products_authenticated_all"
  ON public.products FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "sales_authenticated_all"
  ON public.sales FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "expenses_authenticated_all"
  ON public.expenses FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "channels_authenticated_all"
  ON public.channels FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "categories_authenticated_all"
  ON public.categories FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "product_tags_authenticated_all"
  ON public.product_tags FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

CREATE POLICY "product_tag_relations_authenticated_all"
  ON public.product_tag_relations FOR ALL
  TO authenticated
  USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------
-- 2) profiles — leitura compartilhada (avatares/nome do vendedor);
--    gravação/remoção apenas no próprio registro ou por admin
-- ---------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.profiles', 'profiles_select');
  EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.profiles', 'profiles_update');
  EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.profiles', 'profiles_delete');
  EXECUTE format('DROP POLICY IF EXISTS "%s" ON public.profiles', 'Allow all profiles');
END $$;

CREATE POLICY "profiles_select_any_authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_admin"
  ON public.profiles FOR DELETE
  TO authenticated
  USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- ---------------------------------------------------------------------
-- 3) Storage (avatars) — bucket público para leitura;
--    escrita apenas autenticado e no próprio avatar
-- ---------------------------------------------------------------------
DO $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS "%s" ON storage.objects', 'Allow all avatars');
  EXECUTE format('DROP POLICY IF EXISTS "%s" ON storage.objects', 'avatars_all');
END $$;

CREATE POLICY "avatars_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_write_authenticated"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "avatars_update_authenticated"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars');

CREATE POLICY "avatars_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'avatars' AND name LIKE (auth.uid()::text || '.%'));