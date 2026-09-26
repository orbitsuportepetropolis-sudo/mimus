-- ==============================================================================
-- MIGRATION: Mimus Work & Vitrine Studio (Plano Premium R$ 109)
-- Descrição: Tabelas e colunas para o braço agêntico Co-Work e personalização
--            da vitrine via IA. Aditiva e retrocompatível com produção.
-- ==============================================================================

-- 1. Atualizar constraint de planos em stores para suportar 'premium'
DO $$
BEGIN
  -- Se houver constraint de plano, recria permitindo 'free', 'pro', 'enterprise', 'premium'
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'stores_plan_check'
  ) THEN
    ALTER TABLE stores DROP CONSTRAINT stores_plan_check;
  END IF;

  ALTER TABLE stores ADD CONSTRAINT stores_plan_check 
    CHECK (plan IN ('free', 'pro', 'enterprise', 'premium'));
EXCEPTION
  WHEN OTHERS THEN
    -- Silently continue if stores doesn't have constraint
    NULL;
END $$;

-- 2. Adicionar coluna storefront_theme em stores se não existir
ALTER TABLE stores ADD COLUMN IF NOT EXISTS storefront_theme jsonb DEFAULT '{
  "primary_color": "#E11D48",
  "banner_title": "Bem-vindo à nossa loja",
  "banner_subtitle": "Confira nossas novidades e promoções exclusivas",
  "banner_image_url": null,
  "layout_style": "modern_grid",
  "featured_badge": "Destaques da Semana"
}'::jsonb;

-- 3. Tabela de sessões de trabalho do Mimus Work (Co-Work)
CREATE TABLE IF NOT EXISTS work_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Nova Sessão',
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Garantir colunas caso a tabela já existisse previamente
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS title text NOT NULL DEFAULT 'Nova Sessão';
ALTER TABLE work_sessions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

CREATE INDEX IF NOT EXISTS idx_work_sessions_store ON work_sessions(store_id);

-- 4. Tabela de mensagens do Mimus Work
CREATE TABLE IF NOT EXISTS work_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES work_sessions(id) ON DELETE CASCADE,
  store_id uuid REFERENCES stores(id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  content text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Garantir colunas caso a tabela já existisse previamente sem store_id
ALTER TABLE work_messages ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE work_messages ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_work_messages_session ON work_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_work_messages_store ON work_messages(store_id);

-- 5. Tabela de Telemetria de Uso de IA (Controle de custos de API)
CREATE TABLE IF NOT EXISTS ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  model text NOT NULL DEFAULT 'gemini-2.0-flash',
  prompt_tokens int NOT NULL DEFAULT 0,
  completion_tokens int NOT NULL DEFAULT 0,
  total_tokens int NOT NULL DEFAULT 0,
  estimated_cost_brl numeric(10, 6) NOT NULL DEFAULT 0.000000,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ai_usage_logs ADD COLUMN IF NOT EXISTS store_id uuid REFERENCES stores(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_ai_usage_store ON ai_usage_logs(store_id);

-- 6. Habilitar RLS seguro
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS permissivas baseadas no store_id do usuário autenticado
DO $$
BEGIN
  -- Work Sessions
  DROP POLICY IF EXISTS "Usuários gerenciam sessões de sua loja" ON work_sessions;
  CREATE POLICY "Usuários gerenciam sessões de sua loja" ON work_sessions
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.store_id = work_sessions.store_id
      )
    );

  -- Work Messages
  DROP POLICY IF EXISTS "Usuários gerenciam mensagens de sua loja" ON work_messages;
  CREATE POLICY "Usuários gerenciam mensagens de sua loja" ON work_messages
    FOR ALL USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND (
          profiles.store_id = work_messages.store_id
          OR EXISTS (
            SELECT 1 FROM work_sessions 
            WHERE work_sessions.id = work_messages.session_id 
            AND work_sessions.store_id = profiles.store_id
          )
        )
      )
    );

  -- AI Usage Logs
  DROP POLICY IF EXISTS "Usuários visualizam logs de sua loja" ON ai_usage_logs;
  CREATE POLICY "Usuários visualizam logs de sua loja" ON ai_usage_logs
    FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.store_id = ai_usage_logs.store_id
      )
    );
END $$;
