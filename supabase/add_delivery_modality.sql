-- =========================================================================
-- MIGRAÇÃO: ADICIONAR MODALIDADE DE COMPRA E ENDEREÇO DE ENTREGA
-- Execute no SQL Editor do Supabase (projeto: lmuyarubwmdoaadxbgpl)
-- =========================================================================

-- 1. Adicionar colunas de entrega na tabela public.sales caso não existam
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'pickup';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS delivery_address text;

-- 2. Atualizar a função RPC create_storefront_order para suportar a modalidade de compra e método de pagamento
DROP FUNCTION IF EXISTS public.create_storefront_order(uuid, text, text, numeric, numeric, jsonb);
DROP FUNCTION IF EXISTS public.create_storefront_order(uuid, text, text, numeric, numeric, jsonb, text, text);
DROP FUNCTION IF EXISTS public.create_storefront_order(uuid, text, text, numeric, numeric, jsonb, text, text, text);

CREATE OR REPLACE FUNCTION public.create_storefront_order(
  p_store_id uuid,
  p_client_name text,
  p_client_phone text,
  p_total_value numeric,
  p_discount numeric,
  p_items jsonb,
  p_delivery_type text DEFAULT 'pickup',
  p_delivery_address text DEFAULT NULL,
  p_payment_method text DEFAULT 'pix'
)
RETURNS uuid AS $$
DECLARE
  v_customer_id uuid;
  v_sale_id uuid;
  v_item jsonb;
  v_product_id uuid;
  v_qty integer;
  v_price numeric;
  v_stock integer;
  v_phone_cleaned text;
BEGIN
  -- Limpar o telefone para busca exata (apenas números)
  v_phone_cleaned := regexp_replace(p_client_phone, '\D', '', 'g');

  -- 1. Buscar se já existe o cliente na mesma loja
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE store_id = p_store_id 
    AND (
      regexp_replace(phone, '\D', '', 'g') = v_phone_cleaned 
      OR phone = p_client_phone
    )
  LIMIT 1;

  -- Se não existir, cadastrar o cliente automaticamente
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, name, phone)
    VALUES (p_store_id, p_client_name, p_client_phone)
    RETURNING id INTO v_customer_id;
  END IF;

  -- 2. Criar a venda com status 'pendente'
  INSERT INTO public.sales (store_id, customer_id, total_value, discount, payment_method, status, delivery_type, delivery_address)
  VALUES (p_store_id, v_customer_id, p_total_value, p_discount, p_payment_method, 'pendente', p_delivery_type, p_delivery_address)
  RETURNING id INTO v_sale_id;

  -- 3. Inserir itens da venda e validar estoque
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_price := (v_item->>'unit_price')::numeric;

    -- Verificar estoque atual do produto
    SELECT quantity_in_stock INTO v_stock
    FROM public.products
    WHERE id = v_product_id;

    IF v_stock IS NULL OR v_stock < v_qty THEN
      RAISE EXCEPTION 'Produto indisponível ou estoque insuficiente';
    END IF;

    -- Inserir item da venda (o trigger log_sale_stock_movement vai retirar do estoque automaticamente)
    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price)
    VALUES (v_sale_id, v_product_id, v_qty, v_price);
  END LOOP;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissão de execução para a função de pedidos de forma pública (anon)
GRANT EXECUTE ON FUNCTION public.create_storefront_order(uuid, text, text, numeric, numeric, jsonb, text, text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.create_storefront_order(uuid, text, text, numeric, numeric, jsonb, text, text, text) TO authenticated;
