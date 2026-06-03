-- =========================================================================
-- MIMUS - SCRIPT DE POPULAÇÃO DE DADOS DE TESTE (LOJA DEMO & USUÁRIO AURA GLOW)
-- =========================================================================
-- Este script cria um usuário de testes padrão e popula sua loja com
-- produtos de cosméticos reais, clientes e histórico de vendas.
--
-- E-mail de acesso: auraglow@teste.com
-- Senha de acesso: mimus123
--
-- Para executar: Copie este script, abra o "SQL Editor" no painel do Supabase,
-- cole e clique em "Run".
-- =========================================================================

-- 1. Habilitar a extensão pgcrypto
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Deletar usuário antigo de teste para limpar inconsistências de campos nulos
DELETE FROM auth.users WHERE email = 'auraglow@teste.com';

-- 3. Inserir Usuário de Teste em auth.users com campos obrigatórios inicializados como string vazia
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  is_anonymous,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token,
  phone_change,
  phone_change_token,
  email_change_token_current,
  reauthentication_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000002', -- UUID fixo para o usuário demo
  'authenticated',
  'authenticated',
  'auraglow@teste.com',
  extensions.crypt('mimus123', extensions.gen_salt('bf')), -- Senha de teste: mimus123
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Juliana Alencar", "store_name": "Aura Glow Cosméticos"}'::jsonb,
  NOW(),
  NOW(),
  false,
  '', -- confirmation_token
  '', -- email_change
  '', -- email_change_token_new
  '', -- recovery_token
  '', -- phone_change
  '', -- phone_change_token
  '', -- email_change_token_current
  ''  -- reauthentication_token
) ON CONFLICT (id) DO NOTHING;

-- 3. Executar o bloco de inserção dos dados da loja
DO $$
DECLARE
  v_store_id uuid;
  v_customer_1_id uuid;
  v_customer_2_id uuid;
  v_customer_3_id uuid;
  v_prod_1_id uuid;
  v_prod_2_id uuid;
  v_prod_3_id uuid;
  v_prod_4_id uuid;
  v_prod_7_id uuid;
  v_sale_1_id uuid;
  v_sale_2_id uuid;
  v_sale_3_id uuid;
BEGIN
  -- Obter a loja associada ao perfil do usuário demo
  SELECT store_id INTO v_store_id FROM public.profiles WHERE id = 'a0000000-0000-0000-0000-000000000002';
  
  IF v_store_id IS NULL THEN
    -- Fallback: obter última loja criada caso o UUID mude por algum motivo
    SELECT id INTO v_store_id FROM public.stores ORDER BY created_at DESC LIMIT 1;
  END IF;

  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Erro ao obter store_id para a população dos dados.';
  END IF;

  RAISE NOTICE 'Populando dados fictícios na loja com ID: %', v_store_id;

  -- Evitar conflito de domínio único na tabela stores limpando o domínio de todas as lojas
  UPDATE public.stores SET custom_domain = NULL;

  -- 4. Atualizar configurações básicas da loja para a "Aura Glow Cosméticos"
  UPDATE public.stores 
  SET name = 'Aura Glow Cosméticos', 
      plan = 'pro', 
      plan_status = 'active',
      custom_domain = NULL,
      primary_color = '#ec4899', -- Rosa / Pink moderno
      accent_color = '#14b8a6',  -- Teal moderno
      campaign_title = 'Coleção Pele Perfeita Glow ✨',
      campaign_subtitle = 'Ganhe um pincel exclusivo nas compras acima de R$ 150',
      campaign_cta = 'Ver produtos',
      campaign_tag = 'Promoção de Outono'
  WHERE id = v_store_id;

  -- Limpar dados de teste anteriores da loja para evitar duplicados
  DELETE FROM public.financial_transactions WHERE store_id = v_store_id;
  DELETE FROM public.stock_movements WHERE store_id = v_store_id;
  DELETE FROM public.sale_items WHERE sale_id IN (SELECT id FROM public.sales WHERE store_id = v_store_id);
  DELETE FROM public.sales WHERE store_id = v_store_id;
  DELETE FROM public.products WHERE store_id = v_store_id;
  DELETE FROM public.customers WHERE store_id = v_store_id;

  -- 5. Inserir Clientes Fictícios
  INSERT INTO public.customers (store_id, name, phone, instagram, birthday) 
  VALUES (v_store_id, 'Beatriz Silva', '(11) 98765-4321', 'beatriz.makeup', '1995-04-12')
  RETURNING id INTO v_customer_1_id;

  INSERT INTO public.customers (store_id, name, phone, instagram, birthday) 
  VALUES (v_store_id, 'Mariana Santos', '(11) 99888-7766', 'mari.santos', '1998-09-22')
  RETURNING id INTO v_customer_2_id;

  INSERT INTO public.customers (store_id, name, phone, instagram, birthday) 
  VALUES (v_store_id, 'Gabriela Costa', '(11) 97766-5544', 'gabi_costaa', '1990-12-05')
  RETURNING id INTO v_customer_3_id;

  INSERT INTO public.customers (store_id, name, phone, instagram, birthday) 
  VALUES 
  (v_store_id, 'Amanda Ferreira', '(11) 96655-4433', 'amanda.fer', '2001-07-18'),
  (v_store_id, 'Carla Oliveira', '(11) 95544-3322', 'carla.olive', '1988-02-28');

  -- 6. Inserir Produtos de Cosméticos e Maquiagem
  INSERT INTO public.products (store_id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, description) 
  VALUES (v_store_id, 'Batom Velvet Matte Rose', 'Bruna Tavares', 'Maquiagem', 'BT-BVM-01', '7891011121314', 24.90, 49.90, 15, 3, 'Batom líquido de alta pigmentação com efeito matte e textura aveludada.')
  RETURNING id INTO v_prod_1_id;

  INSERT INTO public.products (store_id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, description) 
  VALUES (v_store_id, 'Corretivo Hyaluronic Peach', 'Mimus Beauty', 'Maquiagem', 'MM-CHP-02', '7891011121321', 34.90, 69.90, 8, 3, 'Corretivo hidratante com ácido hialurônico de alta cobertura.')
  RETURNING id INTO v_prod_2_id;

  INSERT INTO public.products (store_id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, description) 
  VALUES (v_store_id, 'Base Fluida Satin 03', 'Macauba', 'Maquiagem', 'MC-BFS-03', '7891011121338', 45.00, 89.90, 12, 4, 'Base de acabamento acetinado com cobertura média construível.')
  RETURNING id INTO v_prod_3_id;

  INSERT INTO public.products (store_id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, description) 
  VALUES (v_store_id, 'Rimel Extra Volume Black', 'Maybelline', 'Olhos', 'MB-REV-04', '7891011121345', 29.90, 59.90, 20, 5, 'Máscara para cílios para volume extremo e definição perfeita.')
  RETURNING id INTO v_prod_4_id;

  INSERT INTO public.products (store_id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, description) 
  VALUES (v_store_id, 'Blush Rosé Líquido', 'Mari Maria', 'Maquiagem', 'MM-BRL-07', '7891011121376', 22.00, 44.90, 10, 3, 'Blush líquido cremoso de longa duração e acabamento natural.')
  RETURNING id INTO v_prod_7_id;

  -- Produtos com alertas e estoque zerado/baixo
  INSERT INTO public.products (store_id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, description) 
  VALUES (v_store_id, 'Delineador Holográfico Glow', 'Aura Glow', 'Olhos', 'AG-DHG-05', '7891011121352', 19.90, 39.90, 0, 3, 'Delineador líquido holográfico com brilho intenso de secagem rápida.');

  INSERT INTO public.products (store_id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, description) 
  VALUES (v_store_id, 'Sérum Renovador Vitamina C', 'Simple Organic', 'Skincare', 'SO-SRV-06', '7891011121369', 59.90, 119.90, 5, 2, 'Sérum facial antioxidante de vitamina C 10% pura.');

  INSERT INTO public.products (store_id, name, brand, category, sku, barcode, cost_price, sale_price, quantity_in_stock, min_stock_alert, description) 
  VALUES (v_store_id, 'Iluminador Pó Compacto Gold', 'Bruna Tavares', 'Maquiagem', 'BT-IPG-09', '7891011121390', 29.90, 59.90, 4, 3, 'Iluminador facial compacto com partículas ultrafinas de brilho dourado.');

  -- 7. Inserir Histórico de Vendas
  -- Venda 1: Beatriz Silva comprando 1 Batom e 1 Corretivo (Pix)
  INSERT INTO public.sales (store_id, customer_id, total_value, discount, payment_method, created_at)
  VALUES (v_store_id, v_customer_1_id, 119.80, 0.00, 'pix', NOW() - INTERVAL '3 days')
  RETURNING id INTO v_sale_1_id;

  INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price)
  VALUES 
  (v_sale_1_id, v_prod_1_id, 1, 49.90),
  (v_sale_1_id, v_prod_2_id, 1, 69.90);

  -- Venda 2: Mariana Santos comprando 1 Base Satin e 1 Rímel (Cartão de Crédito)
  INSERT INTO public.sales (store_id, customer_id, total_value, discount, payment_method, created_at)
  VALUES (v_store_id, v_customer_2_id, 149.80, 0.00, 'credit_card', NOW() - INTERVAL '2 days')
  RETURNING id INTO v_sale_2_id;

  INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price)
  VALUES 
  (v_sale_2_id, v_prod_3_id, 1, 89.90),
  (v_sale_2_id, v_prod_4_id, 1, 59.90);

  -- Venda 3: Gabriela Costa comprando 2 Blushes Líquidos (Dinheiro)
  INSERT INTO public.sales (store_id, customer_id, total_value, discount, payment_method, created_at)
  VALUES (v_store_id, v_customer_3_id, 89.80, 0.00, 'money', NOW() - INTERVAL '1 day')
  RETURNING id INTO v_sale_3_id;

  INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price)
  VALUES 
  (v_sale_3_id, v_prod_7_id, 2, 44.90);

  -- 8. Adicionar algumas despesas para testar o financeiro
  INSERT INTO public.financial_transactions (store_id, type, value, category, description, date)
  VALUES 
  (v_store_id, 'expense', 150.00, 'supplier', 'Compra de embalagens personalizadas', CURRENT_DATE - INTERVAL '5 days'),
  (v_store_id, 'expense', 49.00, 'other', 'Assinatura Mimus Software Pro', CURRENT_DATE - INTERVAL '1 day');

  RAISE NOTICE 'Dados de teste da Aura Glow Cosméticos inseridos com sucesso!';
END $$;
