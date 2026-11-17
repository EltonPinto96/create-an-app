-- ==============================================================================
-- KUSANGA KITADI — Migration 004: Restrição de Acesso Exclusivo a Autenticados
-- Apenas utilizadores autenticados podem consultar caixas automáticos e reportes.
-- ==============================================================================

-- 1. POLÍTICAS DA TABELA 'atms'
-- Revogar leitura pública anterior
DROP POLICY IF EXISTS "atms_public_read_approved" ON public.atms;

-- Criar política de leitura de caixas aprovados restrita a utilizadores autenticados
CREATE POLICY "atms_authenticated_read_approved"
  ON public.atms
  FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- Garantir que moderadores e administradores continuam a poder consultar todos (incluindo pendentes/rejeitados)
DROP POLICY IF EXISTS "atms_moderator_read_all" ON public.atms;
CREATE POLICY "atms_moderator_read_all"
  ON public.atms
  FOR SELECT
  TO authenticated
  USING (public.can_moderate());

-- 2. POLÍTICAS DA TABELA 'reports'
-- Revogar leitura pública de reportes activos
DROP POLICY IF EXISTS "reports_public_read_active" ON public.reports;

-- Criar política de leitura de reportes activos restrita a utilizadores autenticados
CREATE POLICY "reports_authenticated_read_active"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (expires_at > NOW());

-- Garantir que moderadores e administradores continuam a poder consultar o histórico de todos os reportes
DROP POLICY IF EXISTS "reports_admin_read_all" ON public.reports;
CREATE POLICY "reports_moderator_read_all"
  ON public.reports
  FOR SELECT
  TO authenticated
  USING (public.can_moderate());

-- 3. POLÍTICAS DA TABELA 'banks'
-- Apenas utilizadores autenticados podem ler os bancos
DROP POLICY IF EXISTS "banks_public_read" ON public.banks;
CREATE POLICY "banks_authenticated_read"
  ON public.banks
  FOR SELECT
  TO authenticated
  USING (true);

-- 4. COMENTÁRIOS E DOCUMENTAÇÃO DE AUDITORIA
COMMENT ON POLICY "atms_authenticated_read_approved" ON public.atms IS 
  'Kusanga Kitadi — Garante que apenas utilizadores registados e autenticados consultam os caixas de Luanda.';

COMMENT ON POLICY "reports_authenticated_read_active" ON public.reports IS 
  'Kusanga Kitadi — Garante que a disponibilidade de numerário em tempo real é de acesso exclusivo a utilizadores registados.';
