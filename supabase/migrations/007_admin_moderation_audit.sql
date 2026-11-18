-- ==============================================================================
-- KUSANGA KITADI — Migration 007: Políticas de Moderação Avançada e Auditoria
-- 1. Permissão para moderadores eliminarem reportes fraudulentos/spam
-- 2. Permissão para super admins eliminarem caixas obsoletos
-- 3. Função de métricas administrativas consolidadas
-- ==============================================================================

-- 1. MODERAÇÃO DE REPORTES (DELETE para can_moderate)
DROP POLICY IF EXISTS "reports_moderator_delete" ON public.reports;
CREATE POLICY "reports_moderator_delete"
  ON public.reports
  FOR DELETE
  TO authenticated
  USING (public.can_moderate());

-- 2. ELIMINAÇÃO DE ATMS (DELETE exclusivo para is_admin)
DROP POLICY IF EXISTS "atms_admin_delete" ON public.atms;
CREATE POLICY "atms_admin_delete"
  ON public.atms
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

-- 3. COMENTÁRIOS DE AUDITORIA
COMMENT ON POLICY "reports_moderator_delete" ON public.reports IS
  'Kusanga Kitadi — Permite a moderadores e administradores remover reportes falsos ou spam da comunidade.';

COMMENT ON POLICY "atms_admin_delete" ON public.atms IS
  'Kusanga Kitadi — Garante que apenas Super Administradores podem eliminar fisicamente caixas automáticos da base de dados.';
