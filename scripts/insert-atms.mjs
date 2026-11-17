import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://csgxlruqvzxvijrkvvxi.supabase.co',
  'sb_publishable_UWR-nlDDnwaEQxyS7a8xhQ_mKdkWXa9'
);

// ============================================================
// PASSO 1: Inserir bancos
// ============================================================
const bancos = [
  { id: 'b0000001-0000-0000-0000-000000000001', name: 'BAI — Banco Angolano de Investimentos', logo_url: null },
  { id: 'b0000002-0000-0000-0000-000000000002', name: 'BFA — Banco de Fomento Angola', logo_url: null },
  { id: 'b0000003-0000-0000-0000-000000000003', name: 'Banco BIC', logo_url: null },
  { id: 'b0000004-0000-0000-0000-000000000004', name: 'BPC — Banco de Poupança e Crédito', logo_url: null },
  { id: 'b0000005-0000-0000-0000-000000000005', name: 'Banco Sol', logo_url: null },
  { id: 'b0000006-0000-0000-0000-000000000006', name: 'Standard Bank Angola', logo_url: null },
  { id: 'b0000007-0000-0000-0000-000000000007', name: 'Banco Keve', logo_url: null },
];

console.log('⏳ A inserir bancos...');
const { data: bancosData, error: bancosError } = await supabase
  .from('banks')
  .upsert(bancos, { onConflict: 'id', ignoreDuplicates: false });

if (bancosError) {
  console.error('❌ Erro bancos:', JSON.stringify(bancosError, null, 2));
  process.exit(1);
}
console.log('✅ Bancos inseridos com sucesso!');

// ============================================================
// PASSO 2: Inserir 20 ATMs reais de Luanda
// IDs dos bancos:
//   Banco Atlântico: a1b2c3d4-0000-0000-0000-000000000001
//   BAI:             b0000001-0000-0000-0000-000000000001
//   BFA:             b0000002-0000-0000-0000-000000000002
//   Banco BIC:       b0000003-0000-0000-0000-000000000003
//   BPC:             b0000004-0000-0000-0000-000000000004
//   Banco Sol:       b0000005-0000-0000-0000-000000000005
//   Standard Bank:   b0000006-0000-0000-0000-000000000006
//   Banco Keve:      b0000007-0000-0000-0000-000000000007
// ============================================================
const atms = [
  // ── BAI ──────────────────────────────────────────────────
  {
    name: 'BAI — Sede Torre Garden (Maianga)',
    bank_id: 'b0000001-0000-0000-0000-000000000001',
    address: 'Rua Major Kanhangulo 212, Maianga, Luanda',
    latitude: -8.8248,
    longitude: 13.2341,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM na entrada principal da sede do BAI, Maianga',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'BAI — Agência Kinaxixi',
    bank_id: 'b0000001-0000-0000-0000-000000000001',
    address: 'Largo do Kinaxixi, Maianga, Luanda',
    latitude: -8.8220,
    longitude: 13.2277,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM na agência BAI Kinaxixi junto ao largo',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'BAI — Agência Talatona',
    bank_id: 'b0000001-0000-0000-0000-000000000001',
    address: 'Via Expressa Sul, Talatona, Luanda Sul',
    latitude: -8.9177,
    longitude: 13.1883,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM na agência BAI Talatona, Luanda Sul',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'BAI — Agência Viana',
    bank_id: 'b0000001-0000-0000-0000-000000000001',
    address: 'Av. 11 de Novembro, Viana, Luanda',
    latitude: -8.9242,
    longitude: 13.3744,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM na agência BAI Viana',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'BAI — Agência Morro Bento',
    bank_id: 'b0000001-0000-0000-0000-000000000001',
    address: 'Rua 21 de Janeiro, Morro Bento, Luanda',
    latitude: -8.8534,
    longitude: 13.2374,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM na agência BAI Morro Bento',
    approved_at: new Date().toISOString(),
  },

  // ── BFA ──────────────────────────────────────────────────
  {
    name: 'BFA — Sede Rua Amílcar Cabral (Maianga)',
    bank_id: 'b0000002-0000-0000-0000-000000000002',
    address: 'Rua Amílcar Cabral 58, Maianga, Luanda',
    latitude: -8.8181,
    longitude: 13.2335,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM na sede do BFA, Maianga',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'BFA — Belas Business Park (Talatona)',
    bank_id: 'b0000002-0000-0000-0000-000000000002',
    address: 'Belas Business Park, Talatona, Luanda Sul',
    latitude: -8.9211,
    longitude: 13.1830,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM BFA no Belas Business Park, Talatona',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'BFA — Agência Morro Bento',
    bank_id: 'b0000002-0000-0000-0000-000000000002',
    address: 'Estrada Principal de Benfica, Morro Bento, Luanda',
    latitude: -8.8549,
    longitude: 13.2330,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM BFA Morro Bento',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'BFA — Agência Viana',
    bank_id: 'b0000002-0000-0000-0000-000000000002',
    address: 'Estalagem do Leão, Viana, Luanda',
    latitude: -8.9238,
    longitude: 13.3760,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM BFA Viana junto à Estalagem do Leão',
    approved_at: new Date().toISOString(),
  },

  // ── Banco BIC ─────────────────────────────────────────────
  {
    name: 'Banco BIC — Agência Maianga',
    bank_id: 'b0000003-0000-0000-0000-000000000003',
    address: 'Rua Conselheiro Júlio de Vilhena 60, Maianga, Luanda',
    latitude: -8.8203,
    longitude: 13.2355,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM Banco BIC na agência Maianga',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'Banco BIC — Agência Talatona',
    bank_id: 'b0000003-0000-0000-0000-000000000003',
    address: 'Rua das Acácias, Talatona, Luanda Sul',
    latitude: -8.9183,
    longitude: 13.1854,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM Banco BIC Talatona',
    approved_at: new Date().toISOString(),
  },

  // ── Banco Atlântico ───────────────────────────────────────
  {
    name: 'Atlântico — Belas Shopping',
    bank_id: 'a1b2c3d4-0000-0000-0000-000000000001',
    address: 'Belas Shopping Center, Talatona, Luanda Sul',
    latitude: -8.9243,
    longitude: 13.1861,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM Banco Atlântico no Belas Shopping, piso térreo',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'Atlântico — Aeroporto 4 de Fevereiro',
    bank_id: 'a1b2c3d4-0000-0000-0000-000000000001',
    address: 'Aeroporto Internacional 4 de Fevereiro, Luanda',
    latitude: -8.8583,
    longitude: 13.2311,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM Banco Atlântico no terminal de chegadas do aeroporto',
    approved_at: new Date().toISOString(),
  },

  // ── BPC ───────────────────────────────────────────────────
  {
    name: 'BPC — Sede Kinaxixi',
    bank_id: 'b0000004-0000-0000-0000-000000000004',
    address: 'Largo do Kinaxixi 14, Maianga, Luanda',
    latitude: -8.8222,
    longitude: 13.2282,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM BPC na sede do Largo do Kinaxixi',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'BPC — Agência Cazenga',
    bank_id: 'b0000004-0000-0000-0000-000000000004',
    address: 'Av. da Boavista, Cazenga, Luanda',
    latitude: -8.8233,
    longitude: 13.2640,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM BPC Cazenga',
    approved_at: new Date().toISOString(),
  },

  // ── Banco Sol ─────────────────────────────────────────────
  {
    name: 'Banco Sol — Agência Maianga',
    bank_id: 'b0000005-0000-0000-0000-000000000005',
    address: 'Rua da Missão 71, Maianga, Luanda',
    latitude: -8.8215,
    longitude: 13.2371,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM Banco Sol Maianga',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'Banco Sol — Agência Viana',
    bank_id: 'b0000005-0000-0000-0000-000000000005',
    address: 'Av. 11 de Novembro KM 18, Viana, Luanda',
    latitude: -8.9253,
    longitude: 13.3760,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM Banco Sol Viana',
    approved_at: new Date().toISOString(),
  },

  // ── Standard Bank ─────────────────────────────────────────
  {
    name: 'Standard Bank — Agência Baixa de Luanda',
    bank_id: 'b0000006-0000-0000-0000-000000000006',
    address: 'Rua Rainha Ginga 83, Baixa, Luanda',
    latitude: -8.8181,
    longitude: 13.2311,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM Standard Bank na Baixa de Luanda',
    approved_at: new Date().toISOString(),
  },

  // ── Banco Keve ────────────────────────────────────────────
  {
    name: 'Banco Keve — Agência Luanda',
    bank_id: 'b0000007-0000-0000-0000-000000000007',
    address: 'Rua Major Kanhangulo, Ingombota, Luanda',
    latitude: -8.8198,
    longitude: 13.2347,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM Banco Keve na agência principal de Luanda',
    approved_at: new Date().toISOString(),
  },
  {
    name: 'Banco Keve — Agência Talatona',
    bank_id: 'b0000007-0000-0000-0000-000000000007',
    address: 'Via Expressa Sul, Talatona, Luanda Sul',
    latitude: -8.9195,
    longitude: 13.1870,
    status: 'approved',
    is_active: true,
    source: 'google_maps',
    notes: 'ATM Banco Keve Talatona',
    approved_at: new Date().toISOString(),
  },
];

console.log(`\n⏳ A inserir ${atms.length} ATMs reais de Luanda...`);
const { data: atmsData, error: atmsError } = await supabase
  .from('atms')
  .insert(atms)
  .select('id, name, status');

if (atmsError) {
  console.error('❌ Erro ao inserir ATMs:', JSON.stringify(atmsError, null, 2));
  process.exit(1);
}

console.log(`\n✅ ${atmsData.length} ATMs inseridos com sucesso!`);
atmsData.forEach((atm, i) => {
  console.log(`  ${i + 1}. ${atm.name} [${atm.status}]`);
});
