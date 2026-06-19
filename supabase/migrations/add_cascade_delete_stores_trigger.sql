-- =========================================================================
-- MIGRAÇÃO: EXCLUSÃO AUTOMÁTICA E SEGURA DE LOJAS EM CASCATA
-- =========================================================================

-- 1. Função e Trigger BEFORE DELETE na tabela public.stores
-- Esta função limpa todos os dados dependentes na ordem correta antes de excluir a loja,
-- evitando a violação de restrições de chaves estrangeiras (ex: sale_items_product_id_fkey).
CREATE OR REPLACE FUNCTION public.handle_before_delete_store()
RETURNS TRIGGER AS $$
BEGIN
  -- Deletar registros dependentes na ordem correta
  DELETE FROM public.financial_transactions WHERE store_id = OLD.id;
  DELETE FROM public.stock_movements WHERE store_id = OLD.id;
  DELETE FROM public.sale_items WHERE sale_id IN (SELECT id FROM public.sales WHERE store_id = OLD.id);
  DELETE FROM public.sales WHERE store_id = OLD.id;
  DELETE FROM public.products WHERE store_id = OLD.id;
  DELETE FROM public.customers WHERE store_id = OLD.id;
  DELETE FROM public.integrations WHERE store_id = OLD.id;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_before_delete_store ON public.stores;
CREATE TRIGGER tr_before_delete_store
  BEFORE DELETE ON public.stores
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_before_delete_store();

-- 2. Função e Trigger AFTER DELETE na tabela public.profiles
-- Esta função exclui automaticamente a loja quando o perfil do usuário administrador é excluído.
CREATE OR REPLACE FUNCTION public.handle_deleted_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o perfil deletado for do tipo 'admin' e possuir um store_id associado,
  -- deletamos a loja correspondente (o que ativará o trigger tr_before_delete_store acima).
  IF OLD.role = 'admin' AND OLD.store_id IS NOT NULL THEN
    DELETE FROM public.stores WHERE id = OLD.store_id;
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_profile_deleted ON public.profiles;
CREATE TRIGGER tr_on_profile_deleted
  AFTER DELETE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_deleted_profile();
