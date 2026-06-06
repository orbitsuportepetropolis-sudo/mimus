-- =============================================================
-- DIAGNÓSTICO + LIMPEZA FORÇADA — Rode BLOCO POR BLOCO
-- =============================================================

-- BLOCO 1: Confirmar quantos registros existem nessa loja
-- (Se retornar 0 em tudo, os dados estão em outra loja!)
SELECT 'financial_transactions' AS tabela, COUNT(*), SUM(value) AS total
  FROM public.financial_transactions
  WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
UNION ALL
SELECT 'sales', COUNT(*), SUM(total_value)
  FROM public.sales
  WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
UNION ALL
SELECT 'products_sem_foto', COUNT(*), 0
  FROM public.products
  WHERE store_id = 'ae9d67b9-870b-49a0-8250-a4ac2b1a43cb'
    AND (image_url IS NULL OR image_url = '');

-- ─────────────────────────────────────────────────────────────
-- SE BLOCO 1 RETORNOU ZERO EM TUDO:
-- Os dados pertencem a OUTRA LOJA. Rode o bloco abaixo para
-- descobrir QUAL store_id tem os dados financeiros errados.
-- ─────────────────────────────────────────────────────────────

-- BLOCO 2: Descobrir qual loja tem o faturamento R$ 719,81
SELECT
  ft.store_id,
  s.name AS nome_da_loja,
  COUNT(*) AS qtd_transacoes,
  SUM(ft.value) AS total_entradas
FROM public.financial_transactions ft
JOIN public.stores s ON s.id = ft.store_id
WHERE ft.type = 'revenue'
GROUP BY ft.store_id, s.name
ORDER BY total_entradas DESC;

-- BLOCO 3: Descobrir qual loja tem as vendas (Gabriela Costa etc.)
SELECT
  sal.store_id,
  st.name AS nome_da_loja,
  COUNT(*) AS qtd_vendas,
  SUM(sal.total_value) AS total_vendas
FROM public.sales sal
JOIN public.stores st ON st.id = sal.store_id
GROUP BY sal.store_id, st.name
ORDER BY total_vendas DESC;

-- BLOCO 4: Ver TODOS os produtos sem foto de TODAS as lojas
SELECT
  p.store_id,
  s.name AS loja,
  p.name AS produto,
  p.brand,
  p.sku
FROM public.products p
JOIN public.stores s ON s.id = p.store_id
WHERE (p.image_url IS NULL OR p.image_url = '')
  AND (p.images IS NULL OR p.images::text = '[]')
ORDER BY s.name, p.name;
