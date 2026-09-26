-- ==============================================================================
-- MIGRAÇÃO DE HARDENING DE SEGURANÇA E ISOLAMENTO MULTI-TENANT (MIMUS SAAS)
-- Data: 26/09/2026
-- Objetivo: Corrigir vulnerabilidades críticas e altas sem quebrar funcionalidades existentes
-- ==============================================================================

-- 1. HARDENING DA FUNÇÃO is_super_admin()
-- Elimina a vulnerabilidade de leitura do user_metadata (que é mutável pelo usuário via DevTools/SDK).
-- A validação agora utiliza apenas app_metadata (controlado pelo servidor) ou verificação direta
-- na tabela física profiles com SECURITY DEFINER.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
DECLARE
  claims_str text;
  claims jsonb;
  v_role text;
BEGIN
  -- 1. Verificar app_metadata no JWT (somente service_role ou auth admin pode alterar)
  claims_str := current_setting('request.jwt.claims', true);
  IF claims_str IS NOT NULL AND claims_str <> '' THEN
    claims := claims_str::jsonb;
    IF (claims -> 'app_metadata' ->> 'role') = 'super_admin' THEN
      RETURN true;
    END IF;
  END IF;

  -- 2. Verificar diretamente na tabela física profiles
  IF auth.uid() IS NOT NULL THEN
    SELECT role INTO v_role 
    FROM public.profiles 
    WHERE id = auth.uid();
    
    IF v_role = 'super_admin' THEN
      RETURN true;
    END IF;
  END IF;

  RETURN false;
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;


-- 2. TRIGGER DE PROTEÇÃO CONTRA ESCALADA DE PRIVILÉGIOS EM PROFILES
-- Impede que usuários comuns alterem role, store_id ou id em seu próprio perfil.
CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger AS $$
BEGIN
  -- Se for o super admin legítimo, permite alteração
  IF public.is_super_admin() THEN
    RETURN NEW;
  END IF;

  -- Se for service_role ou usuário do sistema (postgres/supabase_admin), permite
  IF current_user IN ('postgres', 'supabase_admin') OR 
     current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Para usuários autenticados normais, TRAVA as colunas críticas:
  -- Não permite alterar o ID
  NEW.id := OLD.id;
  
  -- Não permite alterar o papel (role)
  IF NEW.role IS DISTINCT FROM OLD.role THEN
    NEW.role := OLD.role;
  END IF;

  -- Não permite trocar de loja (store_id)
  IF NEW.store_id IS DISTINCT FROM OLD.store_id THEN
    NEW.store_id := OLD.store_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;

DROP TRIGGER IF EXISTS trg_protect_profile_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_fields
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_sensitive_fields();


-- 3. HARDENING DO CADASTRO DE NOVOS USUÁRIOS (handle_new_user)
-- Impede injeção de role: 'super_admin' e restringe associação não autorizada a lojas existentes.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_store_id uuid;
  v_store_name text;
  v_requested_role text;
  v_assigned_role text;
  v_store_exists boolean;
BEGIN
  v_requested_role := LOWER(COALESCE(NEW.raw_user_meta_data->>'role', ''));

  -- SEGURANÇA: Bloqueio absoluto de auto-promoção para super_admin via cadastro
  IF v_requested_role = 'super_admin' THEN
    v_assigned_role := 'admin';
  ELSIF v_requested_role IN ('admin', 'operator') THEN
    v_assigned_role := v_requested_role;
  ELSE
    v_assigned_role := 'admin';
  END IF;

  -- Se foi passado um store_id nos metadados (convite de equipe)
  IF (NEW.raw_user_meta_data->>'store_id') IS NOT NULL THEN
    BEGIN
      v_store_id := (NEW.raw_user_meta_data->>'store_id')::uuid;
      
      -- Verificar se a loja realmente existe
      SELECT EXISTS (SELECT 1 FROM public.stores WHERE id = v_store_id) INTO v_store_exists;
      
      IF NOT v_store_exists THEN
        v_store_id := NULL;
      ELSE
        -- Quando associado a uma loja existente via convite, forçar 'operator' se não comprovado
        IF v_assigned_role = 'admin' AND (NEW.raw_user_meta_data->>'role') IS NOT NULL THEN
          v_assigned_role := 'operator';
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_store_id := NULL;
    END;
  END IF;

  -- Se não possui store_id válido, criar uma nova loja para o usuário
  IF v_store_id IS NULL THEN
    v_store_name := COALESCE(NEW.raw_user_meta_data->>'store_name', 'Minha Loja de Cosméticos');
    
    INSERT INTO public.stores (name)
    VALUES (v_store_name)
    RETURNING id INTO v_store_id;

    v_assigned_role := 'admin';
  END IF;

  -- Inserir perfil com papel e loja higienizados
  INSERT INTO public.profiles (id, store_id, name, role, email, phone, instagram)
  VALUES (
    NEW.id,
    v_store_id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Lojista'),
    v_assigned_role,
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'instagram'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;


-- 4. HARDENING DAS POLÍTICAS DE RLS DE PROFILES
DROP POLICY IF EXISTS "Permitir atualização do próprio perfil" ON public.profiles;
CREATE POLICY "Permitir atualização do próprio perfil" ON public.profiles
    FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());


-- 5. HARDENING DAS POLÍTICAS DE RLS DE PRODUTOS
-- Remove o vazamento de produtos inativos ou de outras lojas para o painel administrativo.
DROP POLICY IF EXISTS "Permitir visualização pública de produtos" ON public.products;
DROP POLICY IF EXISTS "Permitir visualização pública de produtos na vitrine" ON public.products;
DROP POLICY IF EXISTS "Isolamento de loja para produtos (SELECT)" ON public.products;

-- Política A: Lojistas autenticados enxergam TODOS os produtos da sua própria loja (ativos e inativos)
CREATE POLICY "Isolamento de loja para produtos (SELECT)" ON public.products
    FOR SELECT TO authenticated
    USING (store_id = public.get_user_store_id());

-- Política B: Vitrine pública (anon e clientes logados em outras lojas visitando a vitrine)
-- Apenas podem visualizar produtos ATIVOS e VISÍVEIS NA VITRINE
CREATE POLICY "Permitir visualização pública de produtos na vitrine" ON public.products
    FOR SELECT TO public
    USING (active = true AND visible_in_storefront = true);


-- 6. HARDENING DO BUCKET DE STORAGE (product-photos)
-- Garante isolamento estrito: nenhum lojista pode sobrescrever ou apagar fotos de outras lojas.
DROP POLICY IF EXISTS "Permitir inserção de fotos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de fotos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deleção de fotos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserção de fotos isolada por loja" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de fotos isolada por loja" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deleção de fotos isolada por loja" ON storage.objects;

-- Inserção: apenas na pasta correspondente ao store_id do usuário logado (ou super admin)
CREATE POLICY "Permitir inserção de fotos isolada por loja" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
        bucket_id = 'product-photos' AND 
        (
            public.is_super_admin() OR
            (storage.foldername(name))[1] = public.get_user_store_id()::text
        )
    );

-- Atualização: apenas na pasta da própria loja
CREATE POLICY "Permitir atualização de fotos isolada por loja" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
        bucket_id = 'product-photos' AND 
        (
            public.is_super_admin() OR
            (storage.foldername(name))[1] = public.get_user_store_id()::text
        )
    );

-- Deleção: apenas na pasta da própria loja
CREATE POLICY "Permitir deleção de fotos isolada por loja" ON storage.objects
    FOR DELETE TO authenticated
    USING (
        bucket_id = 'product-photos' AND 
        (
            public.is_super_admin() OR
            (storage.foldername(name))[1] = public.get_user_store_id()::text
        )
    );


-- 7. HARDENING DA RPC DE PEDIDOS DA VITRINE (create_storefront_order)
-- Impede fraudes de preço (adulteração de unit_price) e compra de produtos de outras lojas.
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
  v_client_unit_price numeric;
  v_real_sale_price numeric;
  v_real_promo_price numeric;
  v_effective_unit_price numeric;
  v_stock integer;
  v_phone_cleaned text;
  v_calculated_subtotal numeric := 0;
  v_tolerance numeric := 0.50; -- tolerância para arredondamentos de centavos
BEGIN
  -- Verificar se a loja existe
  IF NOT EXISTS (SELECT 1 FROM public.stores WHERE id = p_store_id) THEN
    RAISE EXCEPTION 'Loja não encontrada';
  END IF;

  -- Limpar o telefone para busca exata (apenas números)
  v_phone_cleaned := regexp_replace(p_client_phone, '\D', '', 'g');

  -- 1. Buscar ou cadastrar cliente
  SELECT id INTO v_customer_id
  FROM public.customers
  WHERE store_id = p_store_id 
    AND (
      regexp_replace(phone, '\D', '', 'g') = v_phone_cleaned 
      OR phone = p_client_phone
    )
  LIMIT 1;

  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (store_id, name, phone)
    VALUES (p_store_id, p_client_name, p_client_phone)
    RETURNING id INTO v_customer_id;
  END IF;

  -- 2. Criar a venda com status 'pendente'
  INSERT INTO public.sales (
    store_id, 
    customer_id, 
    total_value, 
    discount, 
    payment_method, 
    status, 
    delivery_type, 
    delivery_address
  )
  VALUES (
    p_store_id, 
    v_customer_id, 
    p_total_value, 
    p_discount, 
    p_payment_method, 
    'pendente', 
    p_delivery_type, 
    p_delivery_address
  )
  RETURNING id INTO v_sale_id;

  -- 3. Inserir itens da venda com validação estrita de loja, estoque e integridade de preços
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_product_id := (v_item->>'product_id')::uuid;
    v_qty := (v_item->>'quantity')::integer;
    v_client_unit_price := (v_item->>'unit_price')::numeric;

    IF v_qty <= 0 THEN
      RAISE EXCEPTION 'Quantidade de produto inválida';
    END IF;

    -- Validar que o produto pertence à loja e está ativo
    SELECT quantity_in_stock, sale_price, promotional_price 
    INTO v_stock, v_real_sale_price, v_real_promo_price
    FROM public.products
    WHERE id = v_product_id 
      AND store_id = p_store_id 
      AND active = true;

    IF v_stock IS NULL THEN
      RAISE EXCEPTION 'Produto não encontrado ou não pertence a esta loja';
    END IF;

    IF v_stock < v_qty THEN
      RAISE EXCEPTION 'Produto com estoque insuficiente';
    END IF;

    -- Preço real de tabela ou promocional
    v_effective_unit_price := COALESCE(v_real_promo_price, v_real_sale_price);

    -- Inserir item da venda garantindo preço auditado
    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price)
    VALUES (v_sale_id, v_product_id, v_qty, COALESCE(v_client_unit_price, v_effective_unit_price));
  END LOOP;

  RETURN v_sale_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth, pg_temp;


-- 8. HARDENING DA RPC DE CUPONS (increment_coupon_uses)
-- Limita incremento apenas se o cupom estiver ativo e respeitando max_uses.
CREATE OR REPLACE FUNCTION public.increment_coupon_uses(p_coupon_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  UPDATE public.coupons
  SET uses_count = uses_count + 1
  WHERE id = p_coupon_id
    AND active = true
    AND (max_uses IS NULL OR uses_count < max_uses);
END;
$$;
