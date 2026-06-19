-- =========================================================================
-- CONFIGURAÇÃO DO SUPER ADMIN E CONTROLE DE ACESSO (RBAC)
-- =========================================================================

-- 1. Habilitar a extensão pgcrypto (caso não esteja)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Limpeza total de antigas views, funções e políticas para evitar conflitos
DROP VIEW IF EXISTS public.super_admin_users_view CASCADE;
DROP FUNCTION IF EXISTS public.get_auth_users() CASCADE;
DROP FUNCTION IF EXISTS public.is_super_admin() CASCADE;

-- 3. Adicionar colunas necessárias na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- 4. Criar tabela de auditoria de logs de segurança (security_logs)
CREATE TABLE IF NOT EXISTS public.security_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id uuid, -- UUID do usuário executor (pode ser nulo para tentativas anônimas/não autenticadas)
    affected_user_id uuid, -- UUID do usuário afetado (opcional)
    action text NOT NULL, -- ex: 'login_attempt', 'unauthorized_access', 'impersonate_start', 'suspend_user'
    ip text, -- Endereço IP do dispositivo
    user_agent text, -- Dispositivo / Browser
    details jsonb DEFAULT '{}'::jsonb, -- Detalhes adicionais estruturados
    store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL -- Loja envolvida (opcional)
);

-- Ativar RLS para security_logs
ALTER TABLE public.security_logs ENABLE ROW LEVEL SECURITY;

-- 5. Função helper EM MEMÓRIA (JWT) ultra-robusta e protegida por bloco de exceção
-- Lê o JWT diretamente da sessão PostgREST sem realizar consultas a tabelas físicas,
-- prevenindo recursão de políticas e erros de cache de schema.
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
DECLARE
  claims_str text;
  claims jsonb;
BEGIN
  claims_str := current_setting('request.jwt.claims', true);
  IF claims_str IS NULL OR claims_str = '' THEN
    RETURN false;
  END IF;
  
  claims := claims_str::jsonb;
  RETURN (claims -> 'user_metadata' ->> 'role') = 'super_admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Políticas de acesso para a tabela security_logs
DROP POLICY IF EXISTS "Permitir inserção de logs por qualquer um" ON public.security_logs;
CREATE POLICY "Permitir inserção de logs por qualquer um" ON public.security_logs
    FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir visualização de logs apenas por super admins" ON public.security_logs;
CREATE POLICY "Permitir visualização de logs apenas por super admins" ON public.security_logs
    FOR SELECT TO authenticated USING (public.is_super_admin());

-- 7. Adicionar políticas de controle total de RLS para Super Admin em todas as tabelas (Drop e Recreate)
-- Stores
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.stores;
CREATE POLICY "Super Admin: acesso total" ON public.stores FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Profiles
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.profiles;
CREATE POLICY "Super Admin: acesso total" ON public.profiles FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Products
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.products;
CREATE POLICY "Super Admin: acesso total" ON public.products FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Customers
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.customers;
CREATE POLICY "Super Admin: acesso total" ON public.customers FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Sales
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.sales;
CREATE POLICY "Super Admin: acesso total" ON public.sales FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Sale Items
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.sale_items;
CREATE POLICY "Super Admin: acesso total" ON public.sale_items FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Stock Movements
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.stock_movements;
CREATE POLICY "Super Admin: acesso total" ON public.stock_movements FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Financial Transactions
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.financial_transactions;
CREATE POLICY "Super Admin: acesso total" ON public.financial_transactions FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Integrations
DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.integrations;
CREATE POLICY "Super Admin: acesso total" ON public.integrations FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());

-- Stock Entries e Stock Entry Items (se as tabelas existirem)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_entries') THEN
        DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.stock_entries;
        CREATE POLICY "Super Admin: acesso total" ON public.stock_entries FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_entry_items') THEN
        DROP POLICY IF EXISTS "Super Admin: acesso total" ON public.stock_entry_items;
        CREATE POLICY "Super Admin: acesso total" ON public.stock_entry_items FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;
END $$;

-- 8. Sincronizar e-mails de contas existentes (sintaxe padrão ANSI/PG)
UPDATE public.profiles
SET email = auth.users.email
FROM auth.users
WHERE public.profiles.id = auth.users.id AND public.profiles.email IS NULL;

-- 9. NOTA SOBRE SEED INICIAL DO SUPER ADMIN:
-- Para evitar erros de restrição de colunas nulas (como Database error querying schema),
-- o usuário Super Admin (adriano@mimus.com.br) deve ser criado de forma segura
-- através da API do Supabase (por exemplo, usando o script create_super_admin.js fornecido).

