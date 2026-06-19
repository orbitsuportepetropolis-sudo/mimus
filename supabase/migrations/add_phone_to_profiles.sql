-- =========================================================================
-- MIGRAÇÃO: ADICIONAR WHATSAPP/TELEFONE AO PERFIL DO LOJISTA
-- =========================================================================

-- 1. Adicionar coluna phone na tabela public.profiles caso não exista
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2. Atualizar a função handle_new_user() para capturar o telefone dos metadados de cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_store_id uuid;
  v_store_name text;
BEGIN
  -- Verificar se foi passado um store_id nos metadados (para operadores/convites)
  IF (NEW.raw_user_meta_data->>'store_id') IS NOT NULL THEN
    v_store_id := (NEW.raw_user_meta_data->>'store_id')::uuid;
  ELSE
    -- Extrair nome da loja dos metadados ou usar padrão
    v_store_name := COALESCE(NEW.raw_user_meta_data->>'store_name', 'Minha Loja de Cosméticos');

    -- Criar uma nova loja para o usuário cadastrado
    INSERT INTO public.stores (name)
    VALUES (v_store_name)
    RETURNING id INTO v_store_id;
  END IF;

  -- Criar ou atualizar o perfil de usuário associando o papel, email e telefone
  INSERT INTO public.profiles (id, store_id, name, role, email, phone, status)
  VALUES (
    NEW.id,
    v_store_id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Lojista'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'admin'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone),
    'active'
  )
  ON CONFLICT (id) DO UPDATE
  SET store_id = COALESCE(public.profiles.store_id, EXCLUDED.store_id),
      name = EXCLUDED.name,
      role = EXCLUDED.role,
      email = EXCLUDED.email,
      phone = COALESCE(public.profiles.phone, EXCLUDED.phone);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
