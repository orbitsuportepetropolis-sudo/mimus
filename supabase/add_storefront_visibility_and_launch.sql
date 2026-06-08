-- =============================================================
-- ADIÇÃO DE CONFIGURAÇÕES DE VITRINE NOS PRODUTOS
-- Execute no SQL Editor do Supabase (https://supabase.com/dashboard)
-- =============================================================

-- 1. Adicionar colunas visible_in_storefront e is_launch
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS visible_in_storefront boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_launch boolean NOT NULL DEFAULT false;

-- 2. Garantir que os produtos já cadastrados tenham os valores padrão setados
UPDATE public.products SET visible_in_storefront = true WHERE visible_in_storefront IS NULL;
UPDATE public.products SET is_launch = false WHERE is_launch IS NULL;
