-- ============================================================
-- KUSANGA KITADI — Migração 008: Índices de Alta Concorrência
-- Preparação para Operação Piloto com 1.000 Utilizadores em Luanda
-- Schema validado em 18/11/2024 via information_schema
-- ============================================================

-- 1. Índice composto para pesquisa acelerada por Município e Bairro
CREATE INDEX IF NOT EXISTS idx_atms_municipality_neighborhood
  ON atms (municipality, neighborhood);

-- 2. Índice para filtragem rápida por estado de funcionamento do ATM
CREATE INDEX IF NOT EXISTS idx_atms_status
  ON atms (status);

-- 3. Índice para ordenação dos últimos reportes por ATM (mapa em tempo real)
CREATE INDEX IF NOT EXISTS idx_reports_atm_created_desc
  ON reports (atm_id, created_at DESC);

-- 4. Índice para histórico de contribuições por utilizador no perfil
-- NOTA: a coluna de utilizador em "reports" é "reported_by" (não "user_id")
CREATE INDEX IF NOT EXISTS idx_reports_reporter_created_desc
  ON reports (reported_by, created_at DESC);

-- 5. Índice de busca para ATM favoritos do utilizador
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_atm
  ON user_favorites (user_id, atm_id);

COMMENT ON INDEX idx_atms_municipality_neighborhood IS
  'Otimiza buscas geográficas por município e bairro em Luanda para 1.000 utilizadores em simultâneo.';

COMMENT ON INDEX idx_reports_atm_created_desc IS
  'Acelera a agregação em tempo real do estado de dinheiro e filas com base nos reportes recentes.';
