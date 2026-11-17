-- ============================================================
-- KUSANGA KITADI — Sistema de Gestão de Moderadores
-- Migration: 002_moderator_roles.sql
-- ============================================================

-- Tabela de Moderadores
CREATE TABLE IF NOT EXISTS moderator_roles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email       TEXT NOT NULL,
  invited_by  UUID REFERENCES auth.users(id),
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending', 'revoked')),
  note        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Garantir emails únicos (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_moderator_roles_email ON moderator_roles(LOWER(email));

-- ============================================================
-- FUNÇÕES DE SUPORTE RBAC
-- ============================================================

-- Verifica se um utilizador é moderador ativo
CREATE OR REPLACE FUNCTION is_moderator(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM moderator_roles mr
    LEFT JOIN auth.users u ON u.id = target_user_id
    WHERE (mr.user_id = target_user_id OR LOWER(mr.email) = LOWER(u.email))
      AND mr.status = 'active'
  );
$$;

-- Verifica se tem permissão de moderação (Admin OU Moderador)
CREATE OR REPLACE FUNCTION can_moderate(target_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT is_admin(target_user_id) OR is_moderator(target_user_id);
$$;

-- ============================================================
-- RLS: moderator_roles
-- ============================================================

ALTER TABLE moderator_roles ENABLE ROW LEVEL SECURITY;

-- Admins têm controlo total sobre a tabela de moderadores
CREATE POLICY "moderator_roles_admin_all"
  ON moderator_roles
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Moderadores podem consultar apenas o seu próprio registo
CREATE POLICY "moderator_roles_self_read"
  ON moderator_roles
  FOR SELECT
  USING (
    user_id = auth.uid() OR
    LOWER(email) = LOWER((SELECT email FROM auth.users WHERE id = auth.uid()))
  );

-- ============================================================
-- ATUALIZAÇÃO DE PERMISSÕES NOS ATMS PARA MODERADORES
-- ============================================================

-- Permitir que Moderadores e Admins leiam todos os ATMs (pendentes e arquivados)
DROP POLICY IF EXISTS "atms_admin_read_all" ON atms;
CREATE POLICY "atms_moderator_read_all"
  ON atms FOR SELECT
  USING (can_moderate());

-- Permitir que Moderadores e Admins aprovem/rejeitem ATMs pendentes
DROP POLICY IF EXISTS "atms_admin_update" ON atms;
CREATE POLICY "atms_moderator_update"
  ON atms FOR UPDATE
  USING (can_moderate());

-- Apenas Admins podem eliminar registos físicos de ATMs
-- (mantém-se restrito a is_admin())
