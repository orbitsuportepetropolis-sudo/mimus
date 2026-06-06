-- =========================================================================
-- SISTEMA DE PEDIDOS DO CATÁLOGO: RESERVA DE ESTOQUE + INTEGRAÇÃO FINANCEIRA
-- Execute no SQL Editor do Supabase (projeto: lmuyarubwmdoaadxbgpl)
-- =========================================================================

-- 0. Garantir que a coluna 'status' existe na tabela public.sales e atualizar registros existentes
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status text DEFAULT 'pago';
UPDATE public.sales SET status = 'pago' WHERE status IS NULL;

-- 1. Modificar o trigger financeiro para lançar receita APENAS quando a venda for marcada como 'pago'
CREATE OR REPLACE FUNCTION public.log_sale_financial_transaction()
RETURNS TRIGGER AS $$
BEGIN
  -- Apenas lança a receita se o status da venda for 'pago'
  IF NEW.status = 'pago' AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'pago') THEN
    -- Evitar duplicados caso a venda seja atualizada várias vezes
    IF NOT EXISTS (SELECT 1 FROM public.financial_transactions WHERE sale_id = NEW.id) THEN
      INSERT INTO public.financial_transactions (store_id, type, value, category, description, date, sale_id)
      VALUES (
        NEW.store_id,
        'revenue',
        NEW.total_value,
        'sale',
        'Venda realizada no PDV / Confirmada',
        NEW.created_at::date,
        NEW.id
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Garantir que o trigger de transação financeira rode ao INSERIR e ao ATUALIZAR a venda
DROP TRIGGER IF EXISTS tr_log_sale_financial_transaction ON public.sales;
CREATE TRIGGER tr_log_sale_financial_transaction
AFTER INSERT OR UPDATE ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.log_sale_financial_transaction();


-- 2. Criar trigger para estornar estoque e deletar financeiro caso a venda seja cancelada
CREATE OR REPLACE FUNCTION public.log_sale_status_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_item record;
BEGIN
  -- Se o status mudou para 'cancelado' (e não estava cancelado antes)
  IF NEW.status = 'cancelado' AND (OLD.status IS DISTINCT FROM 'cancelado') THEN
    -- Devolver os produtos de volta ao estoque
    FOR v_item IN (SELECT product_id, quantity FROM public.sale_items WHERE sale_id = NEW.id) LOOP
      INSERT INTO public.stock_movements (store_id, product_id, quantity, type, reason)
      VALUES (NEW.store_id, v_item.product_id, v_item.quantity, 'entry', 'manual_adjustment');
    END LOOP;
    
    -- Deletar a transação financeira correspondente (se existir)
    DELETE FROM public.financial_transactions WHERE sale_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_log_sale_status_changes ON public.sales;
CREATE TRIGGER tr_log_sale_status_changes
AFTER UPDATE OF status ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.log_sale_status_changes();


-- 3. Criar a função RPC para inserção segura de pedidos do catálogo (bypass RLS para anon)
CREATE OR REPLACE FUNCTION public.create_storefront_order(
  p_store_id uuid,
  p_client_name text,
  p_client_phone text,
  p_total_value numeric,
  p_discount numeric,
  p_items jsonb
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
  INSERT INTO public.sales (store_id, customer_id, total_value, discount, payment_method, status)
  VALUES (p_store_id, v_customer_id, p_total_value, p_discount, 'pix', 'pendente')
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
GRANT EXECUTE ON FUNCTION public.create_storefront_order(uuid, text, text, numeric, numeric, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION public.create_storefront_order(uuid, text, text, numeric, numeric, jsonb) TO authenticated;
