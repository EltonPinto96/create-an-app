-- ============================================================
-- ATM KOTA — Seed data inicial
-- ============================================================

-- Banco Atlântico
INSERT INTO banks (id, name)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000001',
  'Banco Atlântico'
);

-- ATM Center MDC (aprovado directamente, sem created_by)
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
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000002',
  'a1b2c3d4-0000-0000-0000-000000000001',
  'ATM Center MDC',
  'Avenida Fidel de Castro Ruz - MDC Shopping Via Express',
  'Luanda',
  'Kicuxi',
  -8.97402,
  13.35277,
  'https://maps.app.goo.gl/2fayq3ih5s2GgyoX6',
  'approved',
  '2026-11-17 09:24:00+01'
);

-- Report inicial: disponível, observação presencial
-- confirmed_at: 2026-11-17 09:24:00+01
-- expires_at: calculado automaticamente = 2026-11-17 11:24:00+01
INSERT INTO reports (
  id,
  atm_id,
  availability,
  reported_by,
  confirmed_at,
  source
)
VALUES (
  'a1b2c3d4-0000-0000-0000-000000000003',
  'a1b2c3d4-0000-0000-0000-000000000002',
  'available',
  NULL,
  '2026-11-17 09:24:00+01',
  'observação presencial'
);
