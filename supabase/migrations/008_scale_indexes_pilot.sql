-- ============================================================
-- KUSANGA KITADI — Migração 008: Índices de Alta Concorrência
-- Preparação para Operação Piloto com 1.000 Utilizadores em Luanda
-- ============================================================

-- 1. Índice composto para pesquisa acelerada por Município e Bairro
CREATE INDEX IF NOT EXISTS idx_atms_municipality_neighborhood
  ON atms (municipality, neighborhood);

-- 2. Índice para filtragem rápida por estado de funcionamento do ATM
CREATE INDEX IF NOT EXISTS idx_atms_status
  ON atms (status);

-- 3. Índice para ordenação e busca dos últimos reportes por ATM (crítico para concorrência)
CREATE INDEX IF NOT EXISTS idx_reports_atm_created_desc
  ON reports (atm_id, created_at DESC);

-- 4. Índice para histórico de contribuições do utilizador no perfil
CREATE INDEX IF NOT EXISTS idx_reports_user_created_desc
  ON reports (user_id, created_at DESC);

-- 5. Índice para consultas rápidas na auditoria de moderação de reportes
CREATE INDEX IF NOT EXISTS idx_reports_is_spam_created
  ON reports (is_spam, created_at DESC)
  WHERE is_spam = false;

-- 6. Índice de busca para ATM favoritos do utilizador
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_atm
  ON user_favorites (user_id, atm_id);

-- 7. Índice para identificação imediata de administradores e moderadores (RLS)
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON profiles (role);

COMMENT ON INDEX idx_atms_municipality_neighborhood IS 'Otimiza buscas geográficas por município e bairro em Luanda para até 1.000 utilizadores em simultâneo.';
COMMENT ON INDEX idx_reports_atm_created_desc IS 'Acelera a agregação em tempo real do estado de dinheiro e filas com base nos reportes recentes.';
