-- =========================================================================
-- CORREÇÃO: ADICIONAR SECURITY DEFINER AOS TRIGGERS DE ESTOQUE E PRODUTOS
-- Execute no SQL Editor do Supabase (projeto: lmuyarubwmdoaadxbgpl)
-- =========================================================================

-- 1. Atualizar a função do trigger update_product_stock
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET quantity_in_stock = quantity_in_stock + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Atualizar a função do trigger log_sale_stock_movement
CREATE OR REPLACE FUNCTION public.log_sale_stock_movement()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id uuid;
BEGIN
  -- Obter a loja proprietária da venda
  SELECT store_id INTO v_store_id FROM public.sales WHERE id = NEW.sale_id;

  INSERT INTO public.stock_movements (store_id, product_id, quantity, type, reason)
  VALUES (v_store_id, NEW.product_id, -NEW.quantity, 'exit', 'sale');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Atualizar a função do trigger log_sale_financial_transaction (caso necessário)
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
