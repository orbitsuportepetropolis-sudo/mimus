-- =========================================================================
-- CONFIGURAÇÃO DO SUPER ADMIN E CONTROLE DE ACESSO (RBAC)
-- =========================================================================

-- 1. Habilitar a extensão pgcrypto (caso não esteja)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;

-- 2. Adicionar coluna 'status' na tabela profiles para permitir suspensão de usuários
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- 3. Criar tabela de auditoria de logs de segurança (security_logs)
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

-- 4. Função helper para identificar se o usuário atual é Super Admin
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
  SELECT COALESCE(
    (SELECT role = 'super_admin' FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 5. Políticas de acesso para a tabela security_logs
DROP POLICY IF EXISTS "Permitir inserção de logs por qualquer um" ON public.security_logs;
CREATE POLICY "Permitir inserção de logs por qualquer um" ON public.security_logs
    FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir visualização de logs apenas por super admins" ON public.security_logs;
CREATE POLICY "Permitir visualização de logs apenas por super admins" ON public.security_logs
    FOR SELECT TO authenticated USING (public.is_super_admin());

-- 6. Adicionar políticas de controle total de RLS para Super Admin em todas as tabelas
-- As políticas permissivas de PostgreSQL se combinam com OR, então essa política garante acesso irrestrito
DO $$
BEGIN
    -- Stores
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'stores') THEN
        CREATE POLICY "Super Admin: acesso total" ON public.stores FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'profiles') THEN
        CREATE POLICY "Super Admin: acesso total" ON public.profiles FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    -- Products
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'products') THEN
        CREATE POLICY "Super Admin: acesso total" ON public.products FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    -- Customers
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'customers') THEN
        CREATE POLICY "Super Admin: acesso total" ON public.customers FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    -- Sales
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'sales') THEN
        CREATE POLICY "Super Admin: acesso total" ON public.sales FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    -- Sale Items
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'sale_items') THEN
        CREATE POLICY "Super Admin: acesso total" ON public.sale_items FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    -- Stock Movements
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'stock_movements') THEN
        CREATE POLICY "Super Admin: acesso total" ON public.stock_movements FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    -- Financial Transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'financial_transactions') THEN
        CREATE POLICY "Super Admin: acesso total" ON public.financial_transactions FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    -- Integrations
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'integrations') THEN
        CREATE POLICY "Super Admin: acesso total" ON public.integrations FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
    END IF;

    -- Se existirem as tabelas stock_entries e stock_entry_items, criar RLS para elas também
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_entries') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'stock_entries') THEN
            CREATE POLICY "Super Admin: acesso total" ON public.stock_entries FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'stock_entry_items') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Super Admin: acesso total' AND tablename = 'stock_entry_items') THEN
            CREATE POLICY "Super Admin: acesso total" ON public.stock_entry_items FOR ALL TO authenticated USING (public.is_super_admin()) WITH CHECK (public.is_super_admin());
        END IF;
    END IF;
END $$;

-- 7. SEED INICIAL: Criar conta do Super Admin "Adriano Junior" se não existir
-- E-mail: adriano@mimus.com.br
-- Senha padrão: mimus123
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
  is_anonymous
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  'a0000000-0000-0000-0000-000000000003', -- UUID fixo para o Super Admin
  'authenticated',
  'authenticated',
  'adriano@mimus.com.br',
  extensions.crypt('mimus123', extensions.gen_salt('bf')),
  NOW(),
  '{"provider": "email", "providers": ["email"]}'::jsonb,
  '{"name": "Adriano Junior", "role": "super_admin"}'::jsonb,
  NOW(),
  NOW(),
  false
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = 'adriano@mimus.com.br'
);

-- Garantir que o perfil associado na tabela profiles tenha a role 'super_admin', status 'active' e sem store_id associada
UPDATE public.profiles
SET role = 'super_admin', status = 'active', store_id = NULL
WHERE id = 'a0000000-0000-0000-0000-000000000003';

-- 8. Criar view segura de usuários e e-mails para o painel de Super Admin
CREATE OR REPLACE VIEW public.super_admin_users_view WITH (security_barrier) AS
SELECT 
    p.id,
    p.store_id,
    p.name,
    p.role,
    p.status,
    p.created_at,
    u.email,
    s.name as store_name
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
LEFT JOIN public.stores s ON p.store_id = s.id
WHERE public.is_super_admin();

