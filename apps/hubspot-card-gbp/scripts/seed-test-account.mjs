// Semeia a Test Account do HubSpot com as 14 propriedades GBP (do card) + 2 deals
// de exemplo, para ver o card "Diagnóstico GBP" POPULADO em local dev.
//
// Uso (PowerShell), de dentro de apps/hubspot-card-gbp:
//   $env:HUBSPOT_TEST_TOKEN="pat-na1-...."   # token de um Private App da TEST ACCOUNT
//   node scripts\seed-test-account.mjs
//
// O Private App (na Test Account 51728276) precisa dos scopes:
//   crm.objects.deals.read, crm.objects.deals.write,
//   crm.schemas.deals.read, crm.schemas.deals.write
//
// Idempotente: propriedades que já existem são puladas. Requer Node 18+ (fetch global).

const TOKEN = process.env.HUBSPOT_TEST_TOKEN;
if (!TOKEN) {
  console.error('ERRO: defina HUBSPOT_TEST_TOKEN (token do Private App da Test Account).');
  process.exit(1);
}

const BASE = 'https://api.hubapi.com';
const ACCOUNT_ID = '51728276';
const GROUP = 'dealinformation'; // grupo padrão de deals (sempre existe)
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const numProp = (name, label) => ({ name, label, type: 'number', fieldType: 'number', groupName: GROUP });
const enumProp = (name, label, options) => ({
  name, label, type: 'enumeration', fieldType: 'select', groupName: GROUP,
  options: options.map((o, i) => ({ label: o.label, value: o.value, displayOrder: i })),
});

const PROPS = [
  numProp('potencial_comercial', 'Potencial Comercial (GBP)'),
  numProp('ipc', 'IPC - Indice de Potencial Comercial (GBP)'),
  numProp('score_tecnico', 'Score Tecnico (GBP)'),
  numProp('dim_saude', 'Dimensao: Saude do Perfil (GBP)'),
  numProp('dim_seo', 'Dimensao: SEO Local (GBP)'),
  numProp('dim_autoridade', 'Dimensao: Autoridade (GBP)'),
  numProp('dim_conversao', 'Dimensao: Conversao (GBP)'),
  numProp('dim_engajamento', 'Dimensao: Engajamento (GBP)'),
  numProp('dim_conteudo', 'Dimensao: Conteudo (GBP)'),
  enumProp('oferta_recomendada', 'Oferta Recomendada (GBP)', [
    { label: 'SVC-GBP', value: 'SVC-GBP' },
    { label: 'SVC-SITE', value: 'SVC-SITE' },
    { label: 'SVC-ADS', value: 'SVC-ADS' },
  ]),
  enumProp('proxima_acao_aceite', 'NBA - Aceite', [
    { label: 'Pendente', value: 'pendente' },
    { label: 'Aceita', value: 'aceita' },
    { label: 'Rejeitada', value: 'rejeitada' },
  ]),
  enumProp('site_tipo', 'Tipo de Site (GBP)', [
    { label: 'Site proprio', value: 'site' },
    { label: 'Rede social', value: 'social' },
    { label: 'Sem site', value: 'none' },
  ]),
  {
    name: 'nao_reivindicado', label: 'GBP Nao Reivindicado',
    type: 'enumeration', fieldType: 'booleancheckbox', groupName: GROUP,
    options: [
      { label: 'True', value: 'true', displayOrder: 0 },
      { label: 'False', value: 'false', displayOrder: 1 },
    ],
  },
  { name: 'flags_score', label: 'Flags do Score (GBP)', type: 'string', fieldType: 'text', groupName: GROUP },
];

const DEALS = [
  {
    dealname: 'Niti Odontologia (exemplo GBP)',
    potencial_comercial: '79', oferta_recomendada: 'SVC-ADS', ipc: '11', score_tecnico: '75',
    dim_saude: '97', dim_seo: '95', dim_autoridade: '81', dim_conversao: '100', dim_engajamento: '0', dim_conteudo: '70',
    site_tipo: 'site', nao_reivindicado: 'false', flags_score: '', proxima_acao_aceite: 'pendente',
  },
  {
    dealname: 'Clinica Guerra (exemplo GBP)',
    potencial_comercial: '11', oferta_recomendada: 'SVC-SITE', ipc: '11', score_tecnico: '74',
    dim_saude: '97', dim_seo: '75', dim_autoridade: '92', dim_conversao: '45', dim_engajamento: '60', dim_conteudo: '70',
    site_tipo: 'social', nao_reivindicado: 'false', flags_score: 'site=rede', proxima_acao_aceite: 'pendente',
  },
];

async function createProp(p) {
  const r = await fetch(`${BASE}/crm/v3/properties/deals`, { method: 'POST', headers: H, body: JSON.stringify(p) });
  if (r.ok) return console.log(`  + propriedade ${p.name}`);
  const t = await r.text();
  if (r.status === 409 || /already exists|PROPERTY_ALREADY_EXISTS/i.test(t)) return console.log(`  = ${p.name} (ja existe)`);
  console.error(`  ! ${p.name} FALHOU [${r.status}]: ${t.slice(0, 220)}`);
}

async function createDeal(props) {
  const r = await fetch(`${BASE}/crm/v3/objects/deals`, { method: 'POST', headers: H, body: JSON.stringify({ properties: props }) });
  const t = await r.text();
  if (r.ok) { const id = JSON.parse(t).id; console.log(`  + deal "${props.dealname}" -> id ${id}`); return id; }
  console.error(`  ! deal "${props.dealname}" FALHOU [${r.status}]: ${t.slice(0, 220)}`);
  return null;
}

(async () => {
  console.log('1/2 Criando as 14 propriedades GBP em deals...');
  for (const p of PROPS) await createProp(p);

  console.log('\n2/2 Criando deals de exemplo...');
  const ids = [];
  for (const d of DEALS) { const id = await createDeal(d); if (id) ids.push(id); }

  console.log('\nPronto. Abra um destes deals (pela local dev session) para ver o card POPULADO:');
  for (const id of ids) console.log(`  https://app.hubspot.com/contacts/${ACCOUNT_ID}/record/0-3/${id}`);
})().catch((e) => { console.error('Falha geral:', e.message); process.exit(1); });
