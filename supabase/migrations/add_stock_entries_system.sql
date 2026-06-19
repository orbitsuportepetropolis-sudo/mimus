-- =========================================================================
-- CONFIGURAÇÃO DO SISTEMA DE ENTRADA DE ESTOQUE (STOCK_ENTRIES)
-- =========================================================================

-- 1. Criar a tabela stock_entries (caso não exista)
CREATE TABLE IF NOT EXISTS public.stock_entries (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL DEFAULT current_date,
    supplier text,
    observations text,
    total_value numeric(10,2) NOT NULL DEFAULT 0.00,
    total_items integer NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'created', -- 'created', 'awaiting', 'delivered'
    expected_delivery_date date,
    delivery_date date,
    freight numeric(10,2) NOT NULL DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Adicionar colunas necessárias na tabela stock_entries (caso já exista sem elas)
ALTER TABLE public.stock_entries ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'created';
ALTER TABLE public.stock_entries ADD COLUMN IF NOT EXISTS expected_delivery_date date;
ALTER TABLE public.stock_entries ADD COLUMN IF NOT EXISTS delivery_date date;
ALTER TABLE public.stock_entries ADD COLUMN IF NOT EXISTS freight numeric(10,2) NOT NULL DEFAULT 0.00;

-- 3. Criar a tabela stock_entry_items (caso não exista)
CREATE TABLE IF NOT EXISTS public.stock_entry_items (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id uuid REFERENCES public.stock_entries(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    quantity integer NOT NULL,
    quantity_received integer,
    unit_cost numeric(10,2) NOT NULL DEFAULT 0.00,
    total_cost numeric(10,2) NOT NULL DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Adicionar colunas necessárias na tabela stock_entry_items (caso já exista sem elas)
ALTER TABLE public.stock_entry_items ADD COLUMN IF NOT EXISTS quantity_received integer;
ALTER TABLE public.stock_entry_items ADD COLUMN IF NOT EXISTS unit_cost numeric(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE public.stock_entry_items ADD COLUMN IF NOT EXISTS total_cost numeric(10,2) NOT NULL DEFAULT 0.00;

-- 5. Ativar RLS nas tabelas
ALTER TABLE public.stock_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_entry_items ENABLE ROW LEVEL SECURITY;

-- 6. Recriar políticas de RLS para isolamento de loja (Standard User)
DROP POLICY IF EXISTS "Isolamento de loja para stock_entries (SELECT)" ON public.stock_entries;
CREATE POLICY "Isolamento de loja para stock_entries (SELECT)" ON public.stock_entries
    FOR SELECT TO authenticated USING (store_id = public.get_user_store_id());

DROP POLICY IF EXISTS "Isolamento de loja para stock_entries (INSERT)" ON public.stock_entries;
CREATE POLICY "Isolamento de loja para stock_entries (INSERT)" ON public.stock_entries
    FOR INSERT TO authenticated WITH CHECK (store_id = public.get_user_store_id());

DROP POLICY IF EXISTS "Isolamento de loja para stock_entries (UPDATE)" ON public.stock_entries;
CREATE POLICY "Isolamento de loja para stock_entries (UPDATE)" ON public.stock_entries
    FOR UPDATE TO authenticated USING (store_id = public.get_user_store_id()) WITH CHECK (store_id = public.get_user_store_id());

DROP POLICY IF EXISTS "Isolamento de loja para stock_entries (DELETE)" ON public.stock_entries;
CREATE POLICY "Isolamento de loja para stock_entries (DELETE)" ON public.stock_entries
    FOR DELETE TO authenticated USING (store_id = public.get_user_store_id());

-- Itens da entrada (stock_entry_items)
DROP POLICY IF EXISTS "Isolamento de loja para stock_entry_items (SELECT)" ON public.stock_entry_items;
CREATE POLICY "Isolamento de loja para stock_entry_items (SELECT)" ON public.stock_entry_items
    FOR SELECT TO authenticated USING (EXISTS (
        SELECT 1 FROM public.stock_entries e WHERE e.id = entry_id AND e.store_id = public.get_user_store_id()
    ));

DROP POLICY IF EXISTS "Isolamento de loja para stock_entry_items (INSERT)" ON public.stock_entry_items;
CREATE POLICY "Isolamento de loja para stock_entry_items (INSERT)" ON public.stock_entry_items
    FOR INSERT TO authenticated WITH CHECK (EXISTS (
        SELECT 1 FROM public.stock_entries e WHERE e.id = entry_id AND e.store_id = public.get_user_store_id()
    ));

DROP POLICY IF EXISTS "Isolamento de loja para stock_entry_items (UPDATE)" ON public.stock_entry_items;
CREATE POLICY "Isolamento de loja para stock_entry_items (UPDATE)" ON public.stock_entry_items
    FOR UPDATE TO authenticated USING (EXISTS (
        SELECT 1 FROM public.stock_entries e WHERE e.id = entry_id AND e.store_id = public.get_user_store_id()
    )) WITH CHECK (EXISTS (
        SELECT 1 FROM public.stock_entries e WHERE e.id = entry_id AND e.store_id = public.get_user_store_id()
    ));

DROP POLICY IF EXISTS "Isolamento de loja para stock_entry_items (DELETE)" ON public.stock_entry_items;
CREATE POLICY "Isolamento de loja para stock_entry_items (DELETE)" ON public.stock_entry_items
    FOR DELETE TO authenticated USING (EXISTS (
        SELECT 1 FROM public.stock_entries e WHERE e.id = entry_id AND e.store_id = public.get_user_store_id()
    ));

-- 7. Recriar políticas de RLS para acesso total do Super Admin
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.stock_entries;
CREATE POLICY "Super Admin: acesso total" ON public.stock_entries 
    FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.stock_entry_items;
CREATE POLICY "Super Admin: acesso total" ON public.stock_entry_items 
    FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
