-- =============================================================
-- FIX COMPLETO: active column + RLS + limpeza financeira
-- Execute TUDO de uma vez no SQL Editor do Supabase
-- Projeto: lmuyarubwmdoaadxbgpl
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Adicionar coluna `active` nos produtos (FIX URGENTE)
--    Isso resolve o spinner no dashboard e o erro da IA
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Marcar todos os produtos existentes como ativos
UPDATE public.products SET active = true WHERE active IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. Corrigir RLS — impede que usuários autenticados vejam
--    dados de OUTRAS lojas (bug de multi-tenancy)
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Permitir visualização pública de produtos" ON public.products;
CREATE POLICY "Permitir visualização pública de produtos" ON public.products
    FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "Permitir visualização pública de lojas" ON public.stores;
CREATE POLICY "Permitir visualização pública de lojas" ON public.stores
    FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────────────────────────
-- 3. Forçar limpeza financeira da Toque Delicado (re-execução)
--    store_id: ae9d67b9-870b-49a0-8250-a4ac2b1a43cb
-- ─────────────────────────────────────────────────────────────
DELETE FROM public.financial_transactions
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

DELETE FROM public.sale_items
WHERE sale_id IN (
  SELECT id FROM public.sales
  WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
);

DELETE FROM public.sales
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

DELETE FROM public.stock_movements
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

-- ─────────────────────────────────────────────────────────────
-- 4. Verificação final
-- ─────────────────────────────────────────────────────────────
SELECT 'produtos_restantes'  AS tabela, COUNT(*) AS total
  FROM public.products WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
UNION ALL
SELECT 'vendas',             COUNT(*) FROM public.sales WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
UNION ALL
SELECT 'financeiro',         COUNT(*) FROM public.financial_transactions WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
UNION ALL
SELECT 'coluna_active_ok',   COUNT(*) FROM information_schema.columns
  WHERE table_name = 'products' AND column_name = 'active';
