-- =========================================================================
-- MIGRAÇÃO V2: FUNDAÇÃO SAAS - ASSINATURAS, COBRANÇAS E AUDITORIA
-- =========================================================================

-- 1. ADICIONAR CLASSIFICAÇÃO DE AMBIENTE ÀS LOJAS (SEPARAÇÃO SAAS vs TESTES)
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS environment text NOT NULL DEFAULT 'PRODUCTION';

-- Adicionar constraint de checagem para environment caso não exista
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'stores_environment_check'
    ) THEN
        ALTER TABLE public.stores 
        ADD CONSTRAINT stores_environment_check 
        CHECK (environment IN ('PRODUCTION', 'TEST', 'INTERNAL', 'DEMO', 'PENDING_REVIEW'));
    END IF;
END $$;

-- 2. CRIAR TABELA DE ASSINATURAS (SUBSCRIPTIONS) - FONTE ÚNICA DA VERDADE
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE UNIQUE,
    plan_id text NOT NULL DEFAULT 'free',
    status text NOT NULL DEFAULT 'FREE' CHECK (status IN ('FREE', 'TRIAL', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED', 'COURTESY')),
    amount numeric(10,2) NOT NULL DEFAULT 0.00,
    billing_cycle text NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    trial_started_at timestamp with time zone,
    trial_ends_at timestamp with time zone,
    current_period_start timestamp with time zone,
    current_period_end timestamp with time zone,
    next_billing_at timestamp with time zone,
    cancel_at_period_end boolean NOT NULL DEFAULT false,
    canceled_at timestamp with time zone,
    payment_provider text DEFAULT 'manual',
    external_customer_id text,
    external_subscription_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS para subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para subscriptions
DROP POLICY IF EXISTS "Lojista: visualizar própria assinatura" ON public.subscriptions;
CREATE POLICY "Lojista: visualizar própria assinatura" ON public.subscriptions
    FOR SELECT TO authenticated
    USING (store_id = public.get_user_store_id());

DROP POLICY IF EXISTS "Super Admin: acesso total subscriptions" ON public.subscriptions;
CREATE POLICY "Super Admin: acesso total subscriptions" ON public.subscriptions
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 3. CRIAR TABELA DE PAGAMENTOS (SUBSCRIPTION_PAYMENTS) - IDEMPOTÊNCIA E HISTÓRICO
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
    provider text NOT NULL,
    external_payment_id text NOT NULL UNIQUE, -- Chave de idempotência única
    amount numeric(10,2) NOT NULL DEFAULT 0.00,
    status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'refunded', 'failed')),
    due_date date,
    paid_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS para subscription_payments
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para subscription_payments
DROP POLICY IF EXISTS "Lojista: visualizar próprios pagamentos de assinatura" ON public.subscription_payments;
CREATE POLICY "Lojista: visualizar próprios pagamentos de assinatura" ON public.subscription_payments
    FOR SELECT TO authenticated
    USING (store_id = public.get_user_store_id());

DROP POLICY IF EXISTS "Super Admin: acesso total subscription_payments" ON public.subscription_payments;
CREATE POLICY "Super Admin: acesso total subscription_payments" ON public.subscription_payments
    FOR ALL TO authenticated
    USING (public.is_super_admin())
    WITH CHECK (public.is_super_admin());

-- 4. TRIGGER PARA ATUALIZAR updated_at EM subscriptions
CREATE OR REPLACE FUNCTION public.handle_subscription_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_subscription_updated_at ON public.subscriptions;
CREATE TRIGGER trg_subscription_updated_at
    BEFORE UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_subscription_updated_at();

-- 5. TRIGGER DE SINCRONIZAÇÃO RETROCOMPATÍVEL (subscriptions -> stores)
-- Mantém stores.plan e stores.plan_status espelhados para apps mobile e vitrines legadas
CREATE OR REPLACE FUNCTION public.sync_subscription_to_store()
RETURNS trigger AS $$
BEGIN
    UPDATE public.stores
    SET 
        plan = lower(NEW.plan_id),
        plan_status = lower(NEW.status),
        trial_ends_at = NEW.trial_ends_at,
        subscription_ends_at = NEW.current_period_end,
        asaas_customer_id = COALESCE(NEW.external_customer_id, asaas_customer_id),
        asaas_subscription_id = COALESCE(NEW.external_subscription_id, asaas_subscription_id)
    WHERE id = NEW.store_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_subscription_to_store ON public.subscriptions;
CREATE TRIGGER trg_sync_subscription_to_store
    AFTER INSERT OR UPDATE ON public.subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_subscription_to_store();

-- 6. TRIGGER DE PROTEÇÃO CONTRA AUTO-UPGRADE INDEVIDO EM stores
-- Garante que lojista comum não consiga alterar plan, plan_status, trial_ends_at, environment direto via client Supabase
CREATE OR REPLACE FUNCTION public.protect_store_billing_fields()
RETURNS trigger AS $$
BEGIN
    -- Se for o super admin, permite qualquer alteração
    IF public.is_super_admin() THEN
        RETURN NEW;
    END IF;

    -- Se for o trigger de sincronização de sistema ou service_role, permite
    IF current_user IN ('postgres', 'supabase_admin') OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Para lojistas autenticados comuns, rejeitar ou ignorar alterações em colunas de faturamento/ambiente
    IF NEW.plan IS DISTINCT FROM OLD.plan OR
       NEW.plan_status IS DISTINCT FROM OLD.plan_status OR
       NEW.trial_ends_at IS DISTINCT FROM OLD.trial_ends_at OR
       NEW.subscription_ends_at IS DISTINCT FROM OLD.subscription_ends_at OR
       NEW.environment IS DISTINCT FROM OLD.environment OR
       NEW.asaas_customer_id IS DISTINCT FROM OLD.asaas_customer_id OR
       NEW.asaas_subscription_id IS DISTINCT FROM OLD.asaas_subscription_id THEN
        
        -- Reverte os campos de monetização para os valores originais, preservando outras alterações permitidas (nome, cores, logo, etc.)
        NEW.plan := OLD.plan;
        NEW.plan_status := OLD.plan_status;
        NEW.trial_ends_at := OLD.trial_ends_at;
        NEW.subscription_ends_at := OLD.subscription_ends_at;
        NEW.environment := OLD.environment;
        NEW.asaas_customer_id := OLD.asaas_customer_id;
        NEW.asaas_subscription_id := OLD.asaas_subscription_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_protect_store_billing_fields ON public.stores;
CREATE TRIGGER trg_protect_store_billing_fields
    BEFORE UPDATE ON public.stores
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_store_billing_fields();

-- 7. BACKFILL SEGURO DAS LOJAS EXISTENTES (25 LOJAS)
-- Observação: Não associamos regras rígidas ou IDs específicos no backfill.
-- Todas as lojas existentes sem classificação iniciam com 'PENDING_REVIEW', permitindo que
-- na FASE 2 a auditoria manual classifique cada loja entre PRODUCTION, TEST, INTERNAL ou DEMO.
UPDATE public.stores
SET environment = 'PENDING_REVIEW'
WHERE environment IS NULL;

-- B. Insere registros em subscriptions para todas as lojas que ainda não possuem
INSERT INTO public.subscriptions (
    store_id,
    plan_id,
    status,
    amount,
    trial_started_at,
    trial_ends_at,
    created_at,
    updated_at
)
SELECT 
    s.id AS store_id,
    CASE 
        WHEN s.plan IN ('pro', 'enterprise') THEN s.plan
        ELSE 'free'
    END AS plan_id,
    CASE 
        -- Se o trial ainda estiver no prazo (trial_ends_at > now())
        WHEN s.trial_ends_at IS NOT NULL AND s.trial_ends_at > timezone('utc'::text, now()) THEN 'TRIAL'
        -- Se for trial customizado antigo sem expiração
        WHEN s.plan_status = 'trial_custom' THEN 'TRIAL'
        -- Lojas restantes recebem status FREE sem qualquer interrupção ou bloqueio
        ELSE 'FREE'
    END AS status,
    0.00 AS amount,
    s.created_at AS trial_started_at,
    s.trial_ends_at,
    s.created_at,
    timezone('utc'::text, now())
FROM public.stores s
LEFT JOIN public.subscriptions sub ON sub.store_id = s.id
WHERE sub.id IS NULL
ON CONFLICT (store_id) DO NOTHING;
