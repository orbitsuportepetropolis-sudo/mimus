-- =============================================================
-- LIMPEZA CIRÚRGICA DA LOJA TOQUE DELICADO / LETÍCIA FRANÇA
-- store_id: ae9d67b9-870b-49a0-8250-a4ac2b1a43cb
-- Execute no SQL Editor do Supabase — projeto: lmuyarubwmdoaadxbgpl
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- PASSO 1 (opcional): Confirmar que é a loja certa
-- ─────────────────────────────────────────────────────────────
SELECT id, name FROM public.stores WHERE id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

-- ─────────────────────────────────────────────────────────────
-- PASSO 2: Ver produtos (confirmar quais têm foto antes de deletar)
-- ─────────────────────────────────────────────────────────────
SELECT
  id,
  name,
  brand,
  sku,
  CASE
    WHEN (image_url IS NOT NULL AND image_url <> '') THEN '✅ TEM FOTO (manter)'
    WHEN (images IS NOT NULL AND images::text <> '[]') THEN '✅ TEM FOTO (manter)'
    ELSE '❌ SEM FOTO (deletar)'
  END AS status_foto
FROM public.products
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
ORDER BY status_foto, name;

-- ─────────────────────────────────────────────────────────────
-- PASSO 3: Preview das vendas falsas
-- ─────────────────────────────────────────────────────────────
SELECT s.id, s.created_at::date, s.total_value, c.name AS cliente
FROM public.sales s
LEFT JOIN public.customers c ON c.id = s.customer_id
WHERE s.store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

-- ─────────────────────────────────────────────────────────────
-- PASSO 4: Preview dos clientes
-- ─────────────────────────────────────────────────────────────
SELECT id, name, phone FROM public.customers
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

-- =============================================================
-- ✂️  LIMPEZA — Execute cada bloco abaixo após confirmar acima
-- =============================================================

-- 5A: Deletar TODOS os registros financeiros (vendas + despesas falsas)
DELETE FROM public.financial_transactions
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

-- 5B: Deletar itens de venda
DELETE FROM public.sale_items
WHERE sale_id IN (
  SELECT id FROM public.sales
  WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
);

-- 5C: Deletar as vendas
DELETE FROM public.sales
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

-- 5D: Deletar movimentações de estoque falsas
DELETE FROM public.stock_movements
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

-- 5E: Deletar produtos SEM foto (demo Aura Glow + produto "1" de teste)
--     Produtos COM foto (reais da Toque Delicado) ficam intactos
DELETE FROM public.products
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
  AND (image_url IS NULL OR image_url = '')
  AND (images IS NULL OR images::text = '[]');

-- 5F: Deletar clientes Aura Glow demo
DELETE FROM public.customers
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
  AND name IN (
    'Beatriz Silva',
    'Mariana Santos',
    'Gabriela Costa',
    'Amanda Ferreira',
    'Carla Oliveira'
  );

-- 5G: Corrigir nome da loja para "Toque Delicado" e limpar campanhas Aura Glow
UPDATE public.stores
SET
  name              = 'Toque Delicado',
  campaign_title    = NULL,
  campaign_subtitle = NULL,
  campaign_cta      = NULL,
  campaign_tag      = NULL,
  primary_color     = '#b5127b',
  accent_color      = '#1bbc9b'
WHERE id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';

-- =============================================================
-- ✅ VERIFICAÇÃO FINAL
-- =============================================================
SELECT name, brand, sale_price, quantity_in_stock FROM public.products
WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb' ORDER BY name;

SELECT COUNT(*) AS vendas      FROM public.sales WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';
SELECT COUNT(*) AS clientes    FROM public.customers WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';
SELECT COUNT(*) AS financeiro  FROM public.financial_transactions WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';
SELECT name     AS loja        FROM public.stores WHERE id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb';
