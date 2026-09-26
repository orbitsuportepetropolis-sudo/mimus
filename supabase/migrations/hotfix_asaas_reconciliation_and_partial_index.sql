-- =========================================================================
-- HOTFIX: ÍNDICE ÚNICO PARCIAL DE ASSINATURA CORRENTE E ÍNDICES EXTERNOS
-- =========================================================================

-- 1. Permite histórico na tabela subscriptions, mas impede múltiplas assinaturas correntes
-- Se existir a constraint rígida antiga UNIQUE (store_id), removemos para permitir histórico
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'subscriptions_store_id_key'
    ) THEN
        ALTER TABLE public.subscriptions DROP CONSTRAINT subscriptions_store_id_key;
    END IF;
END $$;

-- 2. Cria índice único parcial: no máximo 1 assinatura por store_id nos estados correntes
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_current_sub_per_store 
ON public.subscriptions(store_id) 
WHERE status IN ('ACTIVE', 'TRIAL', 'PAST_DUE');

-- 3. Garante índice para consultas rápidas por identificadores externos do gateway
CREATE INDEX IF NOT EXISTS idx_subscriptions_external_sub_id 
ON public.subscriptions(external_subscription_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_external_customer_id 
ON public.subscriptions(external_customer_id);

CREATE INDEX IF NOT EXISTS idx_subscription_payments_external_payment_id 
ON public.subscription_payments(external_payment_id);
