-- =========================================================================
-- CORREÇÃO: HABILITAR ATUALIZAÇÃO (UPDATE) DE VENDAS PARA USUÁRIOS AUTENTICADOS
-- Execute no SQL Editor do Supabase (projeto: lmuyarubwmdoaadxbgpl)
-- =========================================================================

-- Remover política caso já exista para evitar duplicados
DROP POLICY IF EXISTS "Isolamento de loja para vendas (UPDATE)" ON public.sales;

-- Criar política de isolamento para UPDATE
CREATE POLICY "Isolamento de loja para vendas (UPDATE)" ON public.sales
    FOR UPDATE TO authenticated 
    USING (store_id = public.get_user_store_id())
    WITH CHECK (store_id = public.get_user_store_id());

-- Validar que a política foi inserida com sucesso
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'sales'
ORDER BY policyname;
