-- ============================================================
-- ATM KOTA — Inserção de Bancos e 20 ATMs Reais de Luanda
-- Migração / Seed: supabase/seed_20_atms.sql
-- ============================================================

-- 1. Inserir Bancos de Angola
INSERT INTO banks (id, name, logo_url)
VALUES
  ('b0000001-0000-0000-0000-000000000001', 'BAI — Banco Angolano de Investimentos', NULL),
  ('b0000002-0000-0000-0000-000000000002', 'BFA — Banco de Fomento Angola', NULL),
  ('b0000003-0000-0000-0000-000000000003', 'Banco BIC', NULL),
  ('b0000004-0000-0000-0000-000000000004', 'BPC — Banco de Poupança e Crédito', NULL),
  ('b0000005-0000-0000-0000-000000000005', 'Banco Sol', NULL),
  ('b0000006-0000-0000-0000-000000000006', 'Standard Bank Angola', NULL),
  ('b0000007-0000-0000-0000-000000000007', 'Banco Keve', NULL)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Inserir 20 ATMs Reais de Agências Bancárias em Luanda
INSERT INTO atms (
  id,
  bank_id,
  name,
  address,
  municipality,
  neighborhood,
  lat,
  lng,
  maps_url,
  status,
  approved_at
)
VALUES
  -- BAI (5 ATMs)
  (
    'c0000001-0000-0000-0000-000000000001',
    'b0000001-0000-0000-0000-000000000001',
    'BAI — Sede Torre Garden',
    'Rua Major Kanhangulo 212',
    'Luanda',
    'Maianga',
    -8.8149,
    13.2341,
    'https://maps.google.com/?q=-8.8149,13.2341',
    'approved',
    NOW()
  ),
  (
    'c0000001-0000-0000-0000-000000000002',
    'b0000001-0000-0000-0000-000000000001',
    'BAI — Agência Kinaxixi',
    'Largo do Kinaxixi',
    'Luanda',
    'Kinaxixi',
    -8.8220,
    13.2277,
    'https://maps.google.com/?q=-8.8220,13.2277',
    'approved',
    NOW()
  ),
  (
    'c0000001-0000-0000-0000-000000000003',
    'b0000001-0000-0000-0000-000000000001',
    'BAI — Agência Talatona',
    'Via Expressa Sul / Av. Talatona',
    'Talatona',
    'Talatona',
    -8.9177,
    13.1883,
    'https://maps.google.com/?q=-8.9177,13.1883',
    'approved',
    NOW()
  ),
  (
    'c0000001-0000-0000-0000-000000000004',
    'b0000001-0000-0000-0000-000000000001',
    'BAI — Agência Morro Bento',
    'Rua 21 de Janeiro',
    'Luanda',
    'Morro Bento',
    -8.8534,
    13.2374,
    'https://maps.google.com/?q=-8.8534,13.2374',
    'approved',
    NOW()
  ),
  (
    'c0000001-0000-0000-0000-000000000005',
    'b0000001-0000-0000-0000-000000000001',
    'BAI — Agência Viana Centro',
    'Av. 11 de Novembro',
    'Viana',
    'Viana Centro',
    -8.9242,
    13.3744,
    'https://maps.google.com/?q=-8.9242,13.3744',
    'approved',
    NOW()
  ),
  (
    'c0000001-0000-0000-0000-000000000006',
    'b0000001-0000-0000-0000-000000000001',
    'BAI — Centralidade Kilamba',
    'Quarteirão B, Centralidade do Kilamba',
    'Belas',
    'Kilamba',
    -8.9950,
    13.2620,
    'https://maps.google.com/?q=-8.9950,13.2620',
    'approved',
    NOW()
  ),

  -- BFA (4 ATMs)
  (
    'c0000002-0000-0000-0000-000000000001',
    'b0000002-0000-0000-0000-000000000002',
    'BFA — Sede Rua Amílcar Cabral',
    'Rua Amílcar Cabral 58',
    'Luanda',
    'Maianga',
    -8.8181,
    13.2335,
    'https://maps.google.com/?q=-8.8181,13.2335',
    'approved',
    NOW()
  ),
  (
    'c0000002-0000-0000-0000-000000000002',
    'b0000002-0000-0000-0000-000000000002',
    'BFA — Belas Business Park',
    'Belas Business Park, Torre Cuanza',
    'Talatona',
    'Talatona',
    -8.9211,
    13.1830,
    'https://maps.google.com/?q=-8.9211,13.1830',
    'approved',
    NOW()
  ),
  (
    'c0000002-0000-0000-0000-000000000003',
    'b0000002-0000-0000-0000-000000000002',
    'BFA — Agência Morro Bento',
    'Estrada Principal do Benfica',
    'Luanda',
    'Morro Bento',
    -8.8549,
    13.2330,
    'https://maps.google.com/?q=-8.8549,13.2330',
    'approved',
    NOW()
  ),
  (
    'c0000002-0000-0000-0000-000000000004',
    'b0000002-0000-0000-0000-000000000002',
    'BFA — Agência Viana Estalagem',
    'Estalagem do Leão, Estrada de Catete',
    'Viana',
    'Estalagem',
    -8.9238,
    13.3760,
    'https://maps.google.com/?q=-8.9238,13.3760',
    'approved',
    NOW()
  ),

  -- Banco BIC (2 ATMs)
  (
    'c0000003-0000-0000-0000-000000000001',
    'b0000003-0000-0000-0000-000000000003',
    'Banco BIC — Agência Maianga',
    'Rua Conselheiro Júlio de Vilhena 60',
    'Luanda',
    'Maianga',
    -8.8203,
    13.2355,
    'https://maps.google.com/?q=-8.8203,13.2355',
    'approved',
    NOW()
  ),
  (
    'c0000003-0000-0000-0000-000000000002',
    'b0000003-0000-0000-0000-000000000003',
    'Banco BIC — Agência Talatona',
    'Rua das Acácias',
    'Talatona',
    'Talatona',
    -8.9183,
    13.1854,
    'https://maps.google.com/?q=-8.9183,13.1854',
    'approved',
    NOW()
  ),

  -- Banco Atlântico (2 ATMs)
  (
    'c0000008-0000-0000-0000-000000000001',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Atlântico — Belas Shopping',
    'Belas Shopping Center, Piso 0',
    'Talatona',
    'Talatona',
    -8.9243,
    13.1861,
    'https://maps.google.com/?q=-8.9243,13.1861',
    'approved',
    NOW()
  ),
  (
    'c0000008-0000-0000-0000-000000000002',
    'a1b2c3d4-0000-0000-0000-000000000001',
    'Atlântico — Aeroporto 4 de Fevereiro',
    'Terminal de Chegadas, Aeroporto Internacional',
    'Luanda',
    'Aeroporto',
    -8.8583,
    13.2311,
    'https://maps.google.com/?q=-8.8583,13.2311',
    'approved',
    NOW()
  ),

  -- BPC (2 ATMs)
  (
    'c0000004-0000-0000-0000-000000000001',
    'b0000004-0000-0000-0000-000000000004',
    'BPC — Sede Largo do Kinaxixi',
    'Largo do Kinaxixi 14',
    'Luanda',
    'Kinaxixi',
    -8.8222,
    13.2282,
    'https://maps.google.com/?q=-8.8222,13.2282',
    'approved',
    NOW()
  ),
  (
    'c0000004-0000-0000-0000-000000000002',
    'b0000004-0000-0000-0000-000000000004',
    'BPC — Agência Cazenga',
    'Av. da Boavista / 12 de Julho',
    'Cazenga',
    'Cazenga',
    -8.8233,
    13.2640,
    'https://maps.google.com/?q=-8.8233,13.2640',
    'approved',
    NOW()
  ),

  -- Banco Sol (2 ATMs)
  (
    'c0000005-0000-0000-0000-000000000001',
    'b0000005-0000-0000-0000-000000000005',
    'Banco Sol — Agência Maianga',
    'Rua da Missão 71',
    'Luanda',
    'Maianga',
    -8.8215,
    13.2371,
    'https://maps.google.com/?q=-8.8215,13.2371',
    'approved',
    NOW()
  ),
  (
    'c0000005-0000-0000-0000-000000000002',
    'b0000005-0000-0000-0000-000000000005',
    'Banco Sol — Agência Viana',
    'Av. 11 de Novembro, KM 18',
    'Viana',
    'Viana',
    -8.9253,
    13.3760,
    'https://maps.google.com/?q=-8.9253,13.3760',
    'approved',
    NOW()
  ),

  -- Standard Bank Angola (1 ATM)
  (
    'c0000006-0000-0000-0000-000000000001',
    'b0000006-0000-0000-0000-000000000006',
    'Standard Bank — Agência Baixa',
    'Rua Rainha Ginga 83',
    'Luanda',
    'Baixa',
    -8.8181,
    13.2311,
    'https://maps.google.com/?q=-8.8181,13.2311',
    'approved',
    NOW()
  ),

  -- Banco Keve (1 ATM)
  (
    'c0000007-0000-0000-0000-000000000001',
    'b0000007-0000-0000-0000-000000000007',
    'Banco Keve — Agência Ingombota',
    'Rua Major Kanhangulo',
    'Luanda',
    'Ingombota',
    -8.8198,
    13.2347,
    'https://maps.google.com/?q=-8.8198,13.2347',
    'approved',
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  municipality = EXCLUDED.municipality,
  neighborhood = EXCLUDED.neighborhood,
  lat = EXCLUDED.lat,
  lng = EXCLUDED.lng,
  maps_url = EXCLUDED.maps_url,
  status = EXCLUDED.status;

-- 3. Inserir reportes iniciais de disponibilidade (válidos por 2 horas)
INSERT INTO reports (
  id,
  atm_id,
  availability,
  reported_by,
  confirmed_at,
  source
)
VALUES
  ('d0000001-0000-0000-0000-000000000001', 'c0000001-0000-0000-0000-000000000001', 'available', NULL, NOW(), 'Verificação presencial'),
  ('d0000001-0000-0000-0000-000000000002', 'c0000001-0000-0000-0000-000000000002', 'available', NULL, NOW(), 'Verificação presencial'),
  ('d0000001-0000-0000-0000-000000000003', 'c0000001-0000-0000-0000-000000000003', 'available', NULL, NOW(), 'Verificação presencial'),
  ('d0000001-0000-0000-0000-000000000007', 'c0000002-0000-0000-0000-000000000001', 'available', NULL, NOW(), 'Verificação presencial'),
  ('d0000001-0000-0000-0000-000000000008', 'c0000002-0000-0000-0000-000000000002', 'available', NULL, NOW(), 'Verificação presencial'),
  ('d0000001-0000-0000-0000-000000000013', 'c0000008-0000-0000-0000-000000000001', 'available', NULL, NOW(), 'Verificação presencial')
ON CONFLICT (id) DO NOTHING;

-- 4. Actualizar Políticas de RLS para permitir submissão e visualização de moderação
DROP POLICY IF EXISTS "atms_anon_insert_pending" ON atms;
CREATE POLICY "atms_anon_insert_pending"
  ON atms FOR INSERT
  WITH CHECK (status = 'pending');

DROP POLICY IF EXISTS "banks_public_read" ON banks;
CREATE POLICY "banks_public_read"
  ON banks FOR SELECT
  USING (true);
