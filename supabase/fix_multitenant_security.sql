-- =============================================================
-- CORREÇÃO DE SEGURANÇA MULTI-TENANCY + COLUNA ACTIVE
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)
-- Projeto: lmuyarubwmdoaadxbgpl
-- =============================================================

-- -------------------------------------------------------------
-- 1. Adicionar coluna `active` nos produtos (se ainda não existe)
-- -------------------------------------------------------------
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Garantir que todos os produtos antigos fiquem ativos por padrão
UPDATE public.products SET active = true WHERE active IS NULL;

-- -------------------------------------------------------------
-- 2. CORREÇÃO CRÍTICA: Remover a política pública que expõe
--    produtos de TODAS as lojas para usuários autenticados
-- -------------------------------------------------------------
DROP POLICY IF EXISTS "Permitir visualização pública de produtos" ON public.products;

-- Recriar a política pública SOMENTE para anon (vitrine pública).
-- Usuários autenticados (dashboard) só verão produtos da própria loja
-- graças à política de isolamento já existente.
CREATE POLICY "Permitir visualização pública de produtos" ON public.products
    FOR SELECT TO anon USING (true);

-- -------------------------------------------------------------
-- 3. Corrigir o mesmo problema nas demais tabelas que têm
--    políticas públicas com `authenticated` no USING (true)
-- -------------------------------------------------------------

-- STORES (já tem 2 políticas conflitantes)
DROP POLICY IF EXISTS "Permitir visualização pública de lojas" ON public.stores;
-- A política "Permitir visualização da própria loja" já cobre usuários autenticados.
-- Para a vitrine pública ler dados de uma loja específica, usamos anon:
CREATE POLICY "Permitir visualização pública de lojas" ON public.stores
    FOR SELECT TO anon USING (true);

-- -------------------------------------------------------------
-- 4. Verificação: listar políticas ativas na tabela products
-- -------------------------------------------------------------
SELECT policyname, cmd, roles, qual
FROM pg_policies
WHERE tablename = 'products'
ORDER BY policyname;
