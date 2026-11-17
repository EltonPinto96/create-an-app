-- ============================================================
-- ATM KOTA — Schema inicial
-- Migration: 001_initial_schema.sql
-- ============================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE atm_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE availability_status AS ENUM ('available', 'no-cash', 'out-of-service');

-- ============================================================
-- TABELAS
-- ============================================================

-- Bancos (geridos por admins)
CREATE TABLE banks (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  logo_url    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Perfis de utilizador (ligados ao auth.users)
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admins
CREATE TABLE admin_roles (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ATMs
CREATE TABLE atms (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bank_id      UUID NOT NULL REFERENCES banks(id) ON DELETE RESTRICT,
  name         TEXT NOT NULL,
  address      TEXT NOT NULL,
  municipality TEXT NOT NULL,
  neighborhood TEXT,
  lat          DOUBLE PRECISION NOT NULL,
  lng          DOUBLE PRECISION NOT NULL,
  maps_url     TEXT,
  status       atm_status NOT NULL DEFAULT 'pending',
  created_by   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reportes de disponibilidade
CREATE TABLE reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  atm_id       UUID NOT NULL REFERENCES atms(id) ON DELETE CASCADE,
  availability availability_status NOT NULL,
  reported_by  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL,
  source       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para calcular automaticamente expires_at = confirmed_at + 2 horas
CREATE OR REPLACE FUNCTION set_report_expires_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.expires_at IS NULL THEN
    NEW.expires_at := NEW.confirmed_at + INTERVAL '2 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_report_expires_at ON reports;
CREATE TRIGGER trigger_set_report_expires_at
  BEFORE INSERT OR UPDATE ON reports
  FOR EACH ROW EXECUTE FUNCTION set_report_expires_at();

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Localização geográfica
CREATE INDEX idx_atms_lat_lng ON atms (lat, lng);
-- Status dos ATMs (filtros frequentes)
CREATE INDEX idx_atms_status ON atms (status);
-- Reports por ATM
CREATE INDEX idx_reports_atm_id ON reports (atm_id);
-- Reports por expiração (queries de reports activos)
CREATE INDEX idx_reports_expires_at ON reports (expires_at);
-- Reports activos por ATM (index composto muito usado)
CREATE INDEX idx_reports_atm_active ON reports (atm_id, expires_at DESC);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE banks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE atms        ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports     ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------
-- Helper: função para verificar se o utilizador é admin
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_roles WHERE admin_roles.user_id = $1
  );
$$;

-- ----------------------------------------------------------------
-- POLICIES: banks
-- ----------------------------------------------------------------

-- Leitura pública
CREATE POLICY "banks_public_read"
  ON banks FOR SELECT
  USING (true);

-- Apenas admins podem inserir/actualizar/apagar
CREATE POLICY "banks_admin_insert"
  ON banks FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "banks_admin_update"
  ON banks FOR UPDATE
  USING (is_admin());

CREATE POLICY "banks_admin_delete"
  ON banks FOR DELETE
  USING (is_admin());

-- ----------------------------------------------------------------
-- POLICIES: profiles
-- ----------------------------------------------------------------

-- Leitura pública dos perfis
CREATE POLICY "profiles_public_read"
  ON profiles FOR SELECT
  USING (true);

-- Utilizador só pode gerir o seu próprio perfil
CREATE POLICY "profiles_own_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_own_update"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ----------------------------------------------------------------
-- POLICIES: admin_roles
-- ----------------------------------------------------------------

-- Apenas admins podem ler a tabela de admins
CREATE POLICY "admin_roles_admin_read"
  ON admin_roles FOR SELECT
  USING (is_admin());

-- Apenas admins podem gerir admins
CREATE POLICY "admin_roles_admin_insert"
  ON admin_roles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "admin_roles_admin_delete"
  ON admin_roles FOR DELETE
  USING (is_admin());

-- ----------------------------------------------------------------
-- POLICIES: atms
-- ----------------------------------------------------------------

-- Leitura pública apenas de ATMs aprovados
CREATE POLICY "atms_public_read_approved"
  ON atms FOR SELECT
  USING (status = 'approved');

-- Utilizadores autenticados podem submeter ATMs (ficam pending)
CREATE POLICY "atms_auth_insert"
  ON atms FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND status = 'pending'
    AND created_by = auth.uid()
  );

-- Admins podem ler todos os ATMs (incluindo pending/rejected)
CREATE POLICY "atms_admin_read_all"
  ON atms FOR SELECT
  USING (is_admin());

-- Admins podem actualizar ATMs (aprovar/rejeitar)
CREATE POLICY "atms_admin_update"
  ON atms FOR UPDATE
  USING (is_admin());

-- Admins podem apagar ATMs
CREATE POLICY "atms_admin_delete"
  ON atms FOR DELETE
  USING (is_admin());

-- ----------------------------------------------------------------
-- POLICIES: reports
-- ----------------------------------------------------------------

-- Leitura pública de reports não expirados
CREATE POLICY "reports_public_read_active"
  ON reports FOR SELECT
  USING (expires_at > NOW());

-- Utilizadores autenticados podem submeter reports
CREATE POLICY "reports_auth_insert"
  ON reports FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND reported_by = auth.uid()
  );

-- Admins podem ler todos os reports
CREATE POLICY "reports_admin_read_all"
  ON reports FOR SELECT
  USING (is_admin());

-- ============================================================
-- TRIGGER: criar perfil automaticamente após registo
-- ============================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
