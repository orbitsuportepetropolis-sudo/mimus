-- ==============================================================================
-- MIGRAÇÃO: GERENCIADOR COMPLETO DE CUPONS (MIMUS)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('percentage', 'fixed', 'product_reward', 'free_shipping')),
  discount_value numeric NOT NULL DEFAULT 0, -- porcentagem (ex: 15) ou valor em reais (ex: 20.00)
  min_order_value numeric NOT NULL DEFAULT 0, -- valor mínimo do carrinho para validar o cupom (ex: 200.00)
  reward_product_id uuid REFERENCES public.products(id) ON DELETE SET NULL, -- produto especial bonificado/promocional
  reward_product_price numeric DEFAULT 0, -- valor cobrado pelo produto especial (ex: 10.00)
  max_uses integer, -- limite máximo de usos geral (null = ilimitado)
  uses_count integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  valid_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  CONSTRAINT unique_store_coupon_code UNIQUE(store_id, code)
);

-- Habilitar RLS
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Política 1: Lojistas autenticados gerenciam seus próprios cupons
DROP POLICY IF EXISTS "Lojistas gerenciam seus cupons" ON public.coupons;
CREATE POLICY "Lojistas gerenciam seus cupons"
ON public.coupons FOR ALL
TO authenticated
USING (
  store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  store_id IN (
    SELECT store_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Política 2: Super Admin possui acesso total
DROP POLICY IF EXISTS "Super Admin: acesso total cupons" ON public.coupons;
CREATE POLICY "Super Admin: acesso total cupons"
ON public.coupons FOR ALL
TO authenticated
USING (public.is_super_admin())
WITH CHECK (public.is_super_admin());

-- Política 3: Clientes públicos na vitrine podem consultar cupons ativos
DROP POLICY IF EXISTS "Consulta publica de cupons ativos da vitrine" ON public.coupons;
CREATE POLICY "Consulta publica de cupons ativos da vitrine"
ON public.coupons FOR SELECT
TO anon, authenticated
USING (active = true);

-- Função RPC para incrementar contagem de usos do cupom na finalização do pedido
CREATE OR REPLACE FUNCTION public.increment_coupon_uses(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.coupons
  SET uses_count = uses_count + 1
  WHERE id = p_coupon_id;
END;
$$;

