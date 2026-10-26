-- ============================================================
-- SCRIPT DE BANCO DE DADOS SUPABASE - PROJETO ORGANIZAÍ
-- ============================================================
-- Este script cria todas as tabelas, índices, restrições e
-- políticas de segurança (Row Level Security - RLS) necessárias
-- para o funcionamento completo do OrganizAí no Supabase.
-- ============================================================

-- Habilitar extensão para geração de UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. TABELA: profiles
-- Armazena os dados complementares do perfil do usuário
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nome TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS na tabela profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança da tabela profiles
CREATE POLICY "Usuários podem ver seu próprio perfil"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem atualizar seu próprio perfil"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Usuários podem inserir seu próprio perfil"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 2. TABELA: metas
-- Armazena as metas financeiras planejadas pelo usuário
-- ============================================================
CREATE TABLE IF NOT EXISTS public.metas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo TEXT NOT NULL,
  descricao TEXT,
  valor_total NUMERIC(12, 2) NOT NULL,
  total_periodos INTEGER NOT NULL DEFAULT 1,
  valor_por_periodo NUMERIC(12, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_metas_user_id ON public.metas(user_id);
CREATE INDEX IF NOT EXISTS idx_metas_created_at ON public.metas(created_at DESC);

-- Habilitar RLS na tabela metas
ALTER TABLE public.metas ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança da tabela metas
CREATE POLICY "Usuários podem visualizar suas próprias metas"
  ON public.metas FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem cadastrar suas próprias metas"
  ON public.metas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar suas próprias metas"
  ON public.metas FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir suas próprias metas"
  ON public.metas FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. TABELA: metas_pagamentos
-- Armazena as parcelas/períodos quitados de cada meta
-- ============================================================
CREATE TABLE IF NOT EXISTS public.metas_pagamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meta_id UUID REFERENCES public.metas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  periodo INTEGER NOT NULL,
  pago BOOLEAN DEFAULT false NOT NULL,
  data_pagamento TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_metas_pagamentos_meta_id ON public.metas_pagamentos(meta_id);
CREATE INDEX IF NOT EXISTS idx_metas_pagamentos_user_id ON public.metas_pagamentos(user_id);

-- Habilitar RLS na tabela metas_pagamentos
ALTER TABLE public.metas_pagamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança da tabela metas_pagamentos
CREATE POLICY "Usuários podem visualizar seus próprios pagamentos de metas"
  ON public.metas_pagamentos FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem registrar pagamentos em suas metas"
  ON public.metas_pagamentos FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar pagamentos em suas metas"
  ON public.metas_pagamentos FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem excluir pagamentos em suas metas"
  ON public.metas_pagamentos FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. TRIGGER: Criação automática de perfil ao registrar usuário
-- Cria o registro na tabela profiles automaticamente após o signUp
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email
  )
  ON CONFLICT (id) DO UPDATE
  SET
    nome = EXCLUDED.nome,
    email = EXCLUDED.email,
    updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove trigger antigo se existir para evitar duplicação
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Associa o trigger ao evento de inserção de usuários no Supabase Auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
