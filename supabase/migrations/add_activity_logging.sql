-- =========================================================================
-- MIGRAÇÃO: SISTEMA DE TELEMETRIA E LOGS DE ATIVIDADE AUTOMÁTICOS
-- =========================================================================

-- 1. Criar chave estrangeira para permitir joins entre logs e perfis de usuários
ALTER TABLE public.security_logs DROP CONSTRAINT IF EXISTS fk_security_logs_user;
ALTER TABLE public.security_logs 
  ADD CONSTRAINT fk_security_logs_user 
  FOREIGN KEY (user_id) 
  REFERENCES public.profiles(id) 
  ON DELETE SET NULL;

-- 2. Função de Trigger para auditoria automática de escritas no banco
CREATE OR REPLACE FUNCTION public.log_user_action()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id uuid;
    v_store_id uuid;
    v_action text;
    v_details jsonb;
    v_record_name text;
BEGIN
    -- Obter o ID do usuário autenticado no contexto do Supabase
    v_user_id := auth.uid();
    
    -- Determinar a tabela e a operação (INSERT, UPDATE, DELETE)
    v_action := TG_TABLE_NAME || '_' || TG_OP;
    
    -- Determinar a loja associada à operação
    IF TG_TABLE_NAME = 'stores' THEN
        v_store_id := COALESCE(NEW.id, OLD.id);
    ELSE
        v_store_id := COALESCE(NEW.store_id, OLD.store_id);
    END IF;

    -- Construir os detalhes baseados na operação
    IF TG_OP = 'DELETE' THEN
        -- Tenta pegar uma propriedade de nome amigável
        v_record_name := COALESCE(OLD.name, '');
        v_details := jsonb_build_object(
            'id', OLD.id, 
            'name', v_record_name, 
            'operation', 'delete'
        );
    ELSE
        v_record_name := COALESCE(NEW.name, '');
        v_details := jsonb_build_object(
            'id', NEW.id, 
            'name', v_record_name, 
            'operation', LOWER(TG_OP)
        );
    END IF;

    -- Não registrar logs de logs para evitar loops
    IF TG_TABLE_NAME = 'security_logs' THEN
        RETURN NEW;
    END IF;

    -- Inserir o registro na tabela de auditoria
    INSERT INTO public.security_logs (user_id, action, details, store_id)
    VALUES (v_user_id, v_action, v_details, v_store_id);

    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        -- Nunca bloquear a operação principal de escrita em caso de falha no log
        RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Associar os Triggers às tabelas de negócio do sistema

-- Produtos
DROP TRIGGER IF EXISTS tr_log_products ON public.products;
CREATE TRIGGER tr_log_products
AFTER INSERT OR UPDATE OR DELETE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

-- Vendas
DROP TRIGGER IF EXISTS tr_log_sales ON public.sales;
CREATE TRIGGER tr_log_sales
AFTER INSERT OR DELETE ON public.sales
FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

-- Clientes
DROP TRIGGER IF EXISTS tr_log_customers ON public.customers;
CREATE TRIGGER tr_log_customers
AFTER INSERT OR UPDATE OR DELETE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.log_user_action();

-- Movimentações de Estoque (apenas insert, pois estoque é imutável)
DROP TRIGGER IF EXISTS tr_log_stock_movements ON public.stock_movements;
CREATE TRIGGER tr_log_stock_movements
AFTER INSERT ON public.stock_movements
FOR EACH ROW EXECUTE FUNCTION public.log_user_action();
