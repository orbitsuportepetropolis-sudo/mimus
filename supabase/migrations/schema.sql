-- Habilitar a extensão uuid-ossp
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================================
-- TABELAS PRINCIPAIS
-- =========================================================================

-- 1. LOJAS (STORES)
CREATE TABLE public.stores (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL,
    plan text NOT NULL DEFAULT 'free', -- 'free', 'pro', 'enterprise'
    logo_url text,
    primary_color text NOT NULL DEFAULT '#b5127b',
    accent_color text NOT NULL DEFAULT '#1bbc9b',
    font_family text NOT NULL DEFAULT 'Inter',
    campaign_title text,
    campaign_subtitle text,
    campaign_cta text,
    campaign_tag text,
    campaign_banner_url text,
    marquee_text text,
    banners jsonb NOT NULL DEFAULT '[]'::jsonb,
    coupon_first_purchase_active boolean NOT NULL DEFAULT false,
    coupon_first_purchase_code text NOT NULL DEFAULT 'BEMVINDA',
    coupon_first_purchase_pct numeric NOT NULL DEFAULT 10,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. PERFIS DE USUÁRIOS (PROFILES)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
    name text NOT NULL,
    role text NOT NULL DEFAULT 'admin', -- 'admin', 'operator'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PRODUTOS (PRODUCTS)
CREATE TABLE public.products (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    brand text,
    category text,
    sku text,
    barcode text,
    cost_price numeric(10,2) NOT NULL DEFAULT 0.00,
    sale_price numeric(10,2) NOT NULL DEFAULT 0.00,
    quantity_in_stock integer NOT NULL DEFAULT 0,
    min_stock_alert integer NOT NULL DEFAULT 5,
    expiration_date date,
    image_url text,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. CLIENTES (CUSTOMERS)
CREATE TABLE public.customers (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    name text NOT NULL,
    phone text,
    instagram text,
    birthday date,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. VENDAS (SALES)
CREATE TABLE public.sales (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
    total_value numeric(10,2) NOT NULL DEFAULT 0.00,
    discount numeric(10,2) NOT NULL DEFAULT 0.00,
    payment_method text NOT NULL, -- 'pix', 'money', 'credit_card', 'debit_card'
    delivery_type text DEFAULT 'pickup',
    delivery_address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ITENS DA VENDA (SALE_ITEMS)
CREATE TABLE public.sale_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE RESTRICT NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    unit_price numeric(10,2) NOT NULL DEFAULT 0.00
);

-- 7. HISTÓRICO DE MOVIMENTAÇÕES DE ESTOQUE (STOCK_MOVEMENTS)
CREATE TABLE public.stock_movements (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity integer NOT NULL, -- Positivo para entrada, Negativo para saída
    type text NOT NULL, -- 'entry', 'exit', 'adjustment'
    reason text, -- 'sale', 'purchase', 'loss', 'manual_adjustment'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TRANSAÇÕES FINANCEIRAS (FINANCIAL_TRANSACTIONS)
CREATE TABLE public.financial_transactions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL, -- 'revenue' (entrada), 'expense' (saída)
    value numeric(10,2) NOT NULL DEFAULT 0.00,
    category text NOT NULL, -- 'sale', 'supplier', 'rent', 'marketing', 'salary', 'other'
    description text,
    date date NOT NULL DEFAULT current_date,
    sale_id uuid REFERENCES public.sales(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. INTEGRAÇÕES (INTEGRATIONS)
CREATE TABLE public.integrations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    provider text NOT NULL, -- 'loja_integrada', 'nuvemshop', 'shopify', 'mercado_livre'
    credentials jsonb NOT NULL DEFAULT '{}'::jsonb,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =========================================================================
-- FUNÇÕES AUXILIARES E TRIGGERS DO POSTGRES
-- =========================================================================

-- Função para obter a loja do usuário autenticado atual
CREATE OR REPLACE FUNCTION public.get_user_store_id()
RETURNS uuid AS $$
  SELECT store_id FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Trigger 1: Criar perfil automaticamente no cadastro do Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id uuid;
  v_store_name text;
BEGIN
  -- Verificar se foi passado um store_id nos metadados (para operadores/convites)
  IF (NEW.raw_user_meta_data->>'store_id') IS NOT NULL THEN
    v_store_id := (NEW.raw_user_meta_data->>'store_id')::uuid;
  ELSE
    -- Extrair nome da loja dos metadados ou usar padrão
    v_store_name := COALESCE(NEW.raw_user_meta_data->>'store_name', 'Minha Loja de Cosméticos');

    -- Criar uma nova loja para o usuário cadastrado
    INSERT INTO public.stores (name)
    VALUES (v_store_name)
    RETURNING id INTO v_store_id;
  END IF;

  -- Criar o perfil de usuário associado com o papel correto (admin ou operador)
  INSERT INTO public.profiles (id, store_id, name, role)
  VALUES (
    NEW.id,
    v_store_id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Lojista'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin')
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


-- Trigger 2: Atualização automática de estoque ao inserir movimentações
CREATE OR REPLACE FUNCTION public.update_product_stock()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.products
  SET quantity_in_stock = quantity_in_stock + NEW.quantity
  WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_update_product_stock
AFTER INSERT ON public.stock_movements
FOR EACH ROW
EXECUTE FUNCTION public.update_product_stock();


-- Trigger 3: Registrar saída de estoque automaticamente após itens de venda inseridos
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

CREATE TRIGGER tr_log_sale_stock_movement
AFTER INSERT ON public.sale_items
FOR EACH ROW
EXECUTE FUNCTION public.log_sale_stock_movement();


-- Trigger 4: Registrar receita financeira automaticamente após venda realizada
CREATE OR REPLACE FUNCTION public.log_sale_financial_transaction()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.financial_transactions (store_id, type, value, category, description, date, sale_id)
  VALUES (
    NEW.store_id,
    'revenue',
    NEW.total_value,
    'sale',
    'Venda realizada no PDV',
    NEW.created_at::date,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_log_sale_financial_transaction
AFTER INSERT ON public.sales
FOR EACH ROW
EXECUTE FUNCTION public.log_sale_financial_transaction();


-- =========================================================================
-- CONFIGURAÇÕES DE ROW LEVEL SECURITY (RLS)
-- =========================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;

-- Políticas para STORES
CREATE POLICY "Permitir visualização da própria loja" ON public.stores
    FOR SELECT TO authenticated USING (id = public.get_user_store_id());

-- Acesso público de lojas APENAS para anon (vitrine pública).
-- Usuários autenticados usam a política de isolamento acima (store_id filter).
CREATE POLICY "Permitir visualização pública de lojas" ON public.stores
    FOR SELECT TO anon USING (true);

CREATE POLICY "Permitir atualização da própria loja por administradores" ON public.stores
    FOR UPDATE TO authenticated USING (id = public.get_user_store_id() AND EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Políticas para PROFILES
CREATE POLICY "Permitir select do próprio perfil" ON public.profiles
    FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Permitir select de perfis da mesma loja" ON public.profiles
    FOR SELECT TO authenticated USING (store_id = public.get_user_store_id());

CREATE POLICY "Permitir atualização do próprio perfil" ON public.profiles
    FOR UPDATE TO authenticated USING (id = auth.uid());

-- Políticas para PRODUCTS
CREATE POLICY "Isolamento de loja para produtos (SELECT)" ON public.products
    FOR SELECT TO authenticated USING (store_id = public.get_user_store_id());

-- Acesso público de produtos APENAS para anon (vitrine pública).
-- Usuários autenticados usam a política de isolamento acima (store_id filter).
CREATE POLICY "Permitir visualização pública de produtos" ON public.products
    FOR SELECT TO anon USING (true);

CREATE POLICY "Isolamento de loja para produtos (INSERT)" ON public.products
    FOR INSERT TO authenticated WITH CHECK (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para produtos (UPDATE)" ON public.products
    FOR UPDATE TO authenticated USING (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para produtos (DELETE)" ON public.products
    FOR DELETE TO authenticated USING (store_id = public.get_user_store_id());

-- Políticas para CUSTOMERS
CREATE POLICY "Isolamento de loja para clientes (SELECT)" ON public.customers
    FOR SELECT TO authenticated USING (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para clientes (INSERT)" ON public.customers
    FOR INSERT TO authenticated WITH CHECK (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para clientes (UPDATE)" ON public.customers
    FOR UPDATE TO authenticated USING (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para clientes (DELETE)" ON public.customers
    FOR DELETE TO authenticated USING (store_id = public.get_user_store_id());

-- Políticas para SALES
CREATE POLICY "Isolamento de loja para vendas (SELECT)" ON public.sales
    FOR SELECT TO authenticated USING (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para vendas (INSERT)" ON public.sales
    FOR INSERT TO authenticated WITH CHECK (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para vendas (UPDATE)" ON public.sales
    FOR UPDATE TO authenticated USING (store_id = public.get_user_store_id()) WITH CHECK (store_id = public.get_user_store_id());

-- Políticas para SALE_ITEMS
CREATE POLICY "Isolamento de loja para itens da venda (SELECT)" ON public.sale_items
    FOR SELECT TO authenticated USING (EXISTS (
        SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.store_id = public.get_user_store_id()
    ));

CREATE POLICY "Isolamento de loja para itens da venda (INSERT)" ON public.sale_items
    FOR INSERT TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM public.sales WHERE sales.id = sale_items.sale_id AND sales.store_id = public.get_user_store_id()
    ));

-- Políticas para STOCK_MOVEMENTS
CREATE POLICY "Isolamento de loja para movimentações (SELECT)" ON public.stock_movements
    FOR SELECT TO authenticated USING (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para movimentações (INSERT)" ON public.stock_movements
    FOR INSERT TO authenticated WITH CHECK (store_id = public.get_user_store_id());

-- Políticas para FINANCIAL_TRANSACTIONS
CREATE POLICY "Isolamento de loja para financeiro (SELECT)" ON public.financial_transactions
    FOR SELECT TO authenticated USING (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para financeiro (INSERT)" ON public.financial_transactions
    FOR INSERT TO authenticated WITH CHECK (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para financeiro (UPDATE)" ON public.financial_transactions
    FOR UPDATE TO authenticated USING (store_id = public.get_user_store_id());

CREATE POLICY "Isolamento de loja para financeiro (DELETE)" ON public.financial_transactions
    FOR DELETE TO authenticated USING (store_id = public.get_user_store_id());

-- Políticas para INTEGRATIONS
CREATE POLICY "Isolamento de loja para integrações (SELECT)" ON public.integrations
    FOR SELECT TO authenticated USING (store_id = public.get_user_store_id());

CREATE POLICY "Permitir leitura pública de integrações storefront" ON public.integrations
    FOR SELECT TO anon, authenticated USING (provider = 'storefront');

CREATE POLICY "Isolamento de loja para integrações (ALL)" ON public.integrations
    FOR ALL TO authenticated USING (store_id = public.get_user_store_id()) WITH CHECK (store_id = public.get_user_store_id());

-- =========================================================================
-- CONFIGURAÇÃO DE BUCKET DE STORAGE PARA FOTOS DE PRODUTOS
-- =========================================================================

-- Criar bucket product-photos caso não exista
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-photos', 'product-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Remover políticas se existirem para evitar conflitos de re-execução
DROP POLICY IF EXISTS "Permitir leitura pública de fotos" ON storage.objects;
DROP POLICY IF EXISTS "Permitir inserção de fotos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir atualização de fotos para usuários autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir deleção de fotos para usuários autenticados" ON storage.objects;

-- Criar novas políticas de acesso ao bucket
CREATE POLICY "Permitir leitura pública de fotos" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'product-photos');

CREATE POLICY "Permitir inserção de fotos para usuários autenticados" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'product-photos');

CREATE POLICY "Permitir atualização de fotos para usuários autenticados" ON storage.objects
    FOR UPDATE TO authenticated USING (bucket_id = 'product-photos');

CREATE POLICY "Permitir deleção de fotos para usuários autenticados" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'product-photos');

-- =========================================================================
-- MELHORIAS DE ASSINATURA (ASAAS/GOOGLE PLAY) E DOMÍNIOS PERSONALIZADOS
-- =========================================================================

-- Adição de colunas na tabela stores
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS custom_domain text UNIQUE;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '7 days');
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS promotional_ends_at timestamp with time zone;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS plan_status text DEFAULT 'trial';
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS asaas_customer_id text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS asaas_subscription_id text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS subscription_ends_at timestamp with time zone;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS company_name text;
ALTER TABLE public.stores ADD COLUMN IF NOT EXISTS cnpj text;

-- Adição de colunas na tabela products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS promotional_price numeric(10,2);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS has_free_shipping boolean NOT NULL DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS images jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variations jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS active boolean NOT NULL DEFAULT true;

-- Adição de colunas para gerenciamento de clientes e vendas no mobile
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS tags text;
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS notes text;

ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS status text DEFAULT 'novo';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS delivery_type text DEFAULT 'pickup';
ALTER TABLE public.sales ADD COLUMN IF NOT EXISTS delivery_address text;



