-- ==============================================================================
-- KUSANGA KITADI — Migration 006: Sincronização de Favoritos e Perfil
-- ==============================================================================

-- 1. TABELA DE FAVORITOS SINCRONIZADOS
CREATE TABLE IF NOT EXISTS public.user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  atm_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT user_favorites_user_atm_unique UNIQUE (user_id, atm_id)
);

-- Índices de consulta rápida
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_atm_id ON public.user_favorites(atm_id);

-- Habilitar RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 2. POLÍTICAS RLS PARA FAVORITOS (O utilizador só acede aos seus próprios favoritos)
DROP POLICY IF EXISTS "user_favorites_select_own" ON public.user_favorites;
CREATE POLICY "user_favorites_select_own"
  ON public.user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorites_insert_own" ON public.user_favorites;
CREATE POLICY "user_favorites_insert_own"
  ON public.user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_favorites_delete_own" ON public.user_favorites;
CREATE POLICY "user_favorites_delete_own"
  ON public.user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- 3. PERMISSÕES DE PERFIL
-- Garantir que o utilizador autenticado pode actualizar o seu display_name
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
