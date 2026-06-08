-- =============================================================
-- CORREÇÃO DE SEGURANÇA MULTI-TENANCY - ACESSO À VITRINE PÚBLICA POR USUÁRIOS LOGADOS
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)
-- =============================================================

-- 1. Permitir que usuários autenticados e anônimos leiam as lojas na vitrine pública.
-- Isso corrige o sumiço dos dados da loja quando o usuário está logado em outra loja.
DROP POLICY IF EXISTS "Permitir visualização pública de lojas" ON public.stores;
CREATE POLICY "Permitir visualização pública de lojas" ON public.stores
    FOR SELECT TO anon, authenticated USING (true);

-- 2. Permitir que usuários autenticados e anônimos leiam os produtos na vitrine pública.
-- Isso corrige o sumiço dos itens do estoque quando o usuário está logado em outra loja.
DROP POLICY IF EXISTS "Permitir visualização pública de produtos" ON public.products;
CREATE POLICY "Permitir visualização pública de produtos" ON public.products
    FOR SELECT TO anon, authenticated USING (true);
