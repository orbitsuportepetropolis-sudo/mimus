-- =========================================================================
-- MIGRAÇÃO: TABELA DE CONTROLE DE LEADS (CRM INTERNO DO FUNDADOR)
-- =========================================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  whatsapp      TEXT,
  instagram     TEXT,
  loja          TEXT,
  origem        TEXT DEFAULT 'Instagram',
  dor_principal TEXT,
  demo          BOOLEAN DEFAULT false,
  conta_criada  BOOLEAN DEFAULT false,
  ativado       BOOLEAN DEFAULT false,
  ultimo_contato DATE,
  proxima_acao  TEXT,
  status        TEXT DEFAULT 'Ativo',
  notes         TEXT,
  store_id      UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca por nome
CREATE INDEX IF NOT EXISTS idx_leads_name ON public.leads(name);

-- RLS: apenas super_admins podem manipular leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Política de leitura e escrita apenas para super_admin
CREATE POLICY "super_admin_leads_all" ON public.leads
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION public.handle_lead_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_lead_updated_at ON public.leads;
CREATE TRIGGER tr_lead_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_lead_updated_at();
