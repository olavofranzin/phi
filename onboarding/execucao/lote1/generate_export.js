const fs = require('fs');
const path = require('path');

// === ADR-19 build-time injection ===
// Constantes sensíveis lêem de process.env quando disponíveis; senão caem em
// placeholder redacted. Operação:
//   - Sem env vars (default git/CI): JSONs gerados ficam sanitizados (commit-safe).
//   - Com env vars exportadas: JSONs ganham valores reais (import direto no n8n).
// Ver .env.example pra lista de vars; .env real fica em .gitignore.
const fromEnvOrRedacted = (envName, redacted) => {
  const value = process.env[envName];
  return (typeof value === 'string' && value.length > 0) ? value : redacted;
};

const creds = {
  notionApi: { id: fromEnvOrRedacted('NOTION_CRED_ID', '<credential_id_redacted>'), name: 'Notion account' },
  telegramApi: { id: fromEnvOrRedacted('TELEGRAM_CRED_ID', '<TELEGRAM_CREDENTIAL_ID_redacted>'), name: 'Telegram account' },
  googlePalmApi: { id: fromEnvOrRedacted('GEMINI_CRED_ID', '<GEMINI_CREDENTIAL_ID_redacted>'), name: 'Google Gemini(PaLM) Api account' },
};

const CHAT_ID = fromEnvOrRedacted('TELEGRAM_CHAT_ID', '<TELEGRAM_CHAT_ID_redacted>');
const EXEC_WEBHOOK_KEY = fromEnvOrRedacted('EXEC_WEBHOOK_KEY', '<EXEC_WEBHOOK_KEY_redacted>');
const DB_DEMANDAS = 'cd1ab757-e4d1-493f-b1e1-b64a95d33d1b';
const DB_DEMANDAS_PAGE = 'a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b';
const DB_DEMANDAS_NAME = 'PHI - Demandas';
const DB_SOPS = 'bfeb1105-83a6-4e89-8d62-26607ebfcc8c';
const DB_EVENTOS = '3423df0d-77df-4834-bdda-c08ddbae40ff';
const DB_EVENTOS_PAGE = 'c64f600e-4f46-4b2b-ac22-c1e425c8966e';
const DB_EVENTOS_NAME = 'PHI - Eventos';

const notionHeaders = {
  parameters: [
    { name: 'Notion-Version', value: '2022-06-28' },
    { name: 'Accept', value: 'application/json' },
  ],
};

const htmlEscape = "={{ String($json.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}";

const sharedCore = String.raw`const pickTitle = (page) => {
  for (const prop of Object.values(page.properties || {})) {
    if (prop?.type === 'title') return (prop.title || []).map((part) => part.plain_text || '').join('').trim();
  }
  return '';
};
const pickText = (prop) => (prop?.rich_text || []).map((part) => part.plain_text || '').join('').trim();
const pickSelect = (prop) => prop?.select?.name || prop?.status?.name || '';
const richText = (text) => [{ type: 'text', text: { content: String(text ?? '').slice(0, 1900) } }];
const title = (text) => [{ type: 'text', text: { content: String(text ?? '').slice(0, 1900) } }];
const brDate = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const brDue = () => brDate() + 'T23:59:00-03:00';
const utcNow = () => new Date().toISOString();
const execId = (prefix) => prefix + '-' + $execution.id;
const compactJson = (value) => JSON.stringify(value);
const sopFromItems = (items) => {
  const pages = items.map((item) => item.json || {}).filter((page) => !page.archived && !page.is_archived);
  const vigente = pages.find((page) => {
    const props = page.properties || {};
    return pickSelect(props.area) === 'Execucao' && pickSelect(props.estado) === 'Vigente';
  });
  if (!vigente) throw new Error('SOP Vigente de area Execucao nao encontrada');
  return { id: vigente.id, titulo: pickTitle(vigente), versao: pickText((vigente.properties || {}).versao) || 'v1.0' };
};
`;

const shared = String.raw`${sharedCore}const eventBody = (event) => ({
  parent: { database_id: '${DB_EVENTOS}' },
  properties: {
    tipo: { title: title(event.tipo) },
    entidade_id: { rich_text: richText(event.entidade_id) },
    entidade_area: { select: { name: 'Execucao' } },
    payload_json: { rich_text: richText(compactJson(event.payload)) },
    timestamp: { date: { start: event.timestamp } },
    execution_id: { rich_text: richText(event.execution_id) },
    tenant_id: { rich_text: richText(event.tenant_id) },
    tier_agente: { select: { name: event.tier_agente } },
    versao_sop_aplicada: { rich_text: richText(event.versao_sop_aplicada) },
  },
});`;

const intakeValidateKey = String.raw`const EXEC_WEBHOOK_KEY = '${EXEC_WEBHOOK_KEY}';
const first = $input.first();
const headers = first?.json?.headers || {};
const lower = {};
for (const [key, value] of Object.entries(headers)) lower[String(key).toLowerCase()] = value;
const got = String(lower['x-pacing-secret'] || '').trim();
return [{ json: { ...first.json, ok: EXEC_WEBHOOK_KEY !== '<EXEC_WEBHOOK_KEY_redacted>' && got === EXEC_WEBHOOK_KEY, secret_present: !!got, ok_pre_inject: got !== '' && EXEC_WEBHOOK_KEY !== '' } }];`;

const intakeValidatePayload = String.raw`const out = [];
for (const item of $input.all()) {
  const body = item.json.body && typeof item.json.body === 'object' ? item.json.body : item.json;
  const errors = [];
  if (!body.client_id || typeof body.client_id !== 'string') errors.push('client_id ausente');
  if (!body.cliente_nome || typeof body.cliente_nome !== 'string') errors.push('cliente_nome ausente');
  const payload = {
    client_id: String(body.client_id || '').trim(),
    cliente_nome: String(body.cliente_nome || '').trim(),
    alerta_id: String(body.alerta_id || '').trim(),
    fonte: String(body.fonte || 'pacing-alert').trim(),
    diagnostico: String(body.diagnostico || body.motivo || '').trim(),
    plataforma: String(body.plataforma || '').trim(),
    campanha: String(body.campanha || '').trim(),
    gasto_atual: body.gasto_atual ?? null,
    orcamento_planejado: body.orcamento_planejado ?? null,
  };
  out.push({ json: { ...item.json, ...payload, payload_valid: errors.length === 0, payload_errors: errors } });
}
return out;`;

const normalizeSop = String.raw`${shared}
const sop = sopFromItems($input.all());
const prev = $('[Exec Intake] Validar Payload').item.json;
return [{ json: { ...prev, sop_vigente: sop, versao_sop_aplicada: sop.id } }];`;

const prepareDemand = String.raw`const pickTitle = (page) => {
  for (const prop of Object.values(page.properties || {})) {
    if (prop?.type === 'title') return (prop.title || []).map((part) => part.plain_text || '').join('').trim();
  }
  return '';
};
const pickText = (prop) => (prop?.rich_text || []).map((part) => part.plain_text || '').join('').trim();
const pickSelect = (prop) => prop?.select?.name || prop?.status?.name || '';
const brDate = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Sao_Paulo' });
const brDue = () => brDate() + 'T23:59:00-03:00';
const execId = (prefix) => prefix + '-' + $execution.id;

const ctx = $('[Exec Intake] Normalizar SOP Vigente').item.json;
const existing = $input.all().map((item) => item.json || {}).filter((page) => !page.archived && !page.is_archived);
const demandDate = brDate();
const idempotencyKey = 'pacing|' + demandDate + '|' + ctx.client_id;
const existingKeys = new Set();
for (const page of existing) {
  const props = page.properties || {};
  const obs = pickText(props.observacoes) || pickText(props.Observacoes);
  const titleText = pickTitle(page);
  if (obs.includes(idempotencyKey) || titleText.includes(ctx.cliente_nome)) existingKeys.add(idempotencyKey);
}
const execution_id = execId('EXEC-EXEC-INTAKE');
const tenant_id = 'phi-agencia';
const tituloDemanda = 'Pacing critico cliente ' + ctx.cliente_nome;
const due = brDue();
const observacoes = 'idempotency_key=' + idempotencyKey + '; execution_id=' + execution_id + '; fonte=' + ctx.fonte;
const payload = {
  tenant_id,
  client_id: ctx.client_id,
  execution_id,
  versao_sop_aplicada: ctx.versao_sop_aplicada,
  tipo: 'Pacing/verba',
  classe_sla: 'Critica',
  estado: 'Aberta',
  sla_version: 'v0.3-2026-06-14',
  prazo: due,
  idempotency_key: idempotencyKey,
  alerta_id: ctx.alerta_id,
  fonte: ctx.fonte,
  diagnostico: ctx.diagnostico,
  plataforma: ctx.plataforma,
  campanha: ctx.campanha,
  gasto_atual: ctx.gasto_atual,
  orcamento_planejado: ctx.orcamento_planejado,
};
return [{
  json: {
    ...ctx,
    execution_id,
    tenant_id,
    demanda_titulo: tituloDemanda,
    prioridade: 100,
    prazo: due,
    versao_sop_aplicada: ctx.versao_sop_aplicada,
    observacoes,
    idempotency_key: idempotencyKey,
    ja_existe: existingKeys.has(idempotencyKey),
    cliente_nome: ctx.cliente_nome,
    payload,
    text: '<b>Execucao critica</b>\nPacing/verba aberto para ' + ctx.cliente_nome + '\nPrazo: hoje 23:59 BRT\nSOP: ' + ctx.versao_sop_aplicada,
  }
}];`;

const intakeEventAfterCreate = String.raw`const utcNow = () => new Date().toISOString().slice(0, 10);
const compactJson = (value) => JSON.stringify(value);

const prepared = $('[Exec Intake] Preparar Demanda e Evento').first().json;
const demandaPage = $json || {};
const demanda_id = demandaPage.id;
if (!demanda_id) throw new Error('[Montar Evento demanda.criada] Demanda page.id ausente  Criar Demanda upstream falhou ou substituiu o item');

const ts = utcNow();
if (!ts || !/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
  throw new Error('data invalida produzida por utcNow: ' + JSON.stringify(ts));
}

const payloadComDemandaId = { ...prepared.payload, demanda_id };

return [{
  json: {
    demanda_id,
    evento_tipo: 'demanda.criada',
    entidade_id: demanda_id,
    entidade_area: 'Execucao',
    payload_json: compactJson(payloadComDemandaId),
    timestamp: ts,
    execution_id: prepared.execution_id,
    tenant_id: prepared.tenant_id,
    tier_agente: 'n/a',
    versao_sop_aplicada: prepared.versao_sop_aplicada,
    text: prepared.text + '\nDemanda: ' + demanda_id,
    idempotency_key: prepared.idempotency_key,
  }
}];`;

const orqNormalizeSop = String.raw`${shared}
const sop = sopFromItems($input.all());
return [{ json: { sop_vigente: sop, versao_sop_aplicada: sop.id, tenant_id: 'phi-agencia', execution_id: execId('EXEC-EXEC-ORQ') } }];`;

const orqPrioritize = String.raw`const pickText = (prop) => (prop?.rich_text || []).map((part) => part.plain_text || '').join('').trim();
const pickSelect = (prop) => prop?.select?.name || prop?.status?.name || '';
const pickTitle = (page) => {
  for (const prop of Object.values(page.properties || {})) {
    if (prop?.type === 'title') return (prop.title || []).map((part) => part.plain_text || '').join('').trim();
  }
  return '';
};
const utcNow = () => new Date().toISOString().slice(0, 10);
const execId = (prefix) => prefix + '-' + $execution.id;
const compactJson = (value) => JSON.stringify(value);

const sopFromItems = (items) => {
  const pages = items.map((item) => item.json || {}).filter((page) => !page.archived && !page.is_archived);
  const vigente = pages.find((page) => {
    const props = page.properties || {};
    return pickSelect(props.area) === 'Execucao' && pickSelect(props.estado) === 'Vigente';
  });
  if (!vigente) throw new Error('SOP Vigente de area Execucao nao encontrada');
  return { id: vigente.id, titulo: pickTitle(vigente), versao: pickText((vigente.properties || {}).versao) || 'v1.0' };
};

const sopData = sopFromItems($('[Exec Orq] Buscar SOP Vigente').all());
const execution_id = execId('EXEC-EXEC-ORQ');
const tenant_id = 'phi-agencia';
const ts = utcNow();
if (!ts || !/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
  throw new Error('data invalida produzida por utcNow: ' + JSON.stringify(ts));
}

const demandaPages = $input.all().map((item) => item.json || {}).filter((page) => !page.archived && !page.is_archived);

const priorityFor = (classe_sla) => {
  if (classe_sla === 'Critica') return 100;
  if (classe_sla === 'Recorrente diaria') return 50;
  if (classe_sla === 'Recorrente semanal') return 30;
  if (classe_sla === 'Ad-hoc padrao') return 20;
  return 20;
};
const out = [];
for (const page of demandaPages) {
  const demanda_id = page.id;
  if (!demanda_id) throw new Error('[Calcular Prioridade Pro] page.id ausente  Buscar Demandas Abertas retornou item sem id (alwaysOutputData removido  checar filtros)');
  const props = page.properties || {};
  const tipo = pickSelect(props.tipo);
  const classe_sla = pickSelect(props.classe_sla);
  const client_id = pickText(props.client_id);
  const prioridade = priorityFor(classe_sla);
  const payload = {
    tenant_id,
    client_id,
    execution_id,
    versao_sop_aplicada: sopData.id,
    demanda_id,
    tipo,
    classe_sla,
    prioridade,
    prioridade_origem: 'agente',
    estado: 'Priorizada',
    tier_agente: 'pro',
  };
  out.push({
    json: {
      demanda_id,
      novo_estado: 'Priorizada',
      prioridade,
      prioridade_origem: 'agente',
      versao_sop_aplicada: sopData.id,
      evento_tipo: 'demanda.priorizada',
      entidade_id: demanda_id,
      entidade_area: 'Execucao',
      payload_json: compactJson(payload),
      timestamp: ts,
      execution_id,
      tenant_id,
      tier_agente: 'pro',
    }
  });
}
return out;`;

const orqRestoreAfterGemini = String.raw`return $('[Exec Orq] Calcular Prioridade Pro').all().map((item) => ({ json: item.json }));`;

const qgValidate = String.raw`${sharedCore.replace('const utcNow = () => new Date().toISOString();', 'const utcNow = () => new Date().toISOString().slice(0, 10);')}
const sopData = sopFromItems($('[Exec QG] Buscar SOP Vigente').all());
const execution_id = execId('EXEC-EXEC-QG');
const tenant_id = 'phi-agencia';
const checklist = [
  'Diagnostico da anomalia',
  'Acao tomada OU justificativa',
  'Registro de impacto esperado',
  'Audit (execution_id + fonte)',
];
const out = [];
for (const item of $('[Exec QG] Buscar Demandas Em Revisao').all()) {
  const page = item.json || {};
  const props = page.properties || {};
  const obs = (pickText(props.observacoes) || pickText(props.Observacoes) || '').toLowerCase();
  const hasDiagnostico = /diagnostico|anomalia/.test(obs);
  const hasAcao = /acao tomada|ajuste|pausad|reduz|aument|justificativa|sem acao necessaria/.test(obs);
  const hasImpacto = /impacto esperado|impacto/.test(obs);
  const hasAudit = /execution_id|fonte/.test(obs);
  const checks = [
    { item: checklist[0], ok: hasDiagnostico },
    { item: checklist[1], ok: hasAcao },
    { item: checklist[2], ok: hasImpacto },
    { item: checklist[3], ok: hasAudit },
  ];
  const missing = checks.filter((check) => !check.ok).map((check) => check.item);
  const quality_gate = missing.length === 0 ? 'pass' : 'fail';
  const demanda_id = page.id;
  if (!demanda_id) throw new Error('[Validar DoD] page.id ausente  Buscar Demandas Em Revisao retornou item sem id');
  const client_id = pickText(props.client_id);
  const tipo = pickSelect(props.tipo) || 'Pacing/verba';
  const classe_sla = pickSelect(props.classe_sla) || 'Critica';
  const basePayload = { tenant_id, client_id, execution_id, versao_sop_aplicada: sopData.id, demanda_id, tipo, classe_sla, quality_gate, checklist: checks, tier_agente: 'flash' };
  const ts = utcNow();
  if (!ts || !/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
    throw new Error('data invalida produzida por utcNow: ' + JSON.stringify(ts));
  }
  if (quality_gate === 'pass') {
    out.push({ json: { demanda_id, quality_gate, novo_estado: 'Entregue', versao_sop_aplicada: sopData.id, evento_tipo: 'demanda.entregue', entidade_id: demanda_id, entidade_area: 'Execucao', payload_json: compactJson(basePayload), timestamp: ts, execution_id, tenant_id, tier_agente: 'flash', text: 'PASS demanda ' + demanda_id } });
  } else {
    out.push({ json: { demanda_id, quality_gate, novo_estado: 'Em execucao', versao_sop_aplicada: sopData.id, evento_tipo: 'demanda.reaberta', entidade_id: demanda_id, entidade_area: 'Execucao', payload_json: compactJson({ ...basePayload, missing }), timestamp: ts, execution_id, tenant_id, tier_agente: 'flash', missing, text: '<b>Quality gate FAIL</b>\nDemanda: ' + demanda_id + '\nFaltam:\n- ' + missing.join('\n- ') } });
  }
}
return out;`;

const qgReviewEvent = String.raw`${sharedCore.replace('const utcNow = () => new Date().toISOString();', 'const utcNow = () => new Date().toISOString().slice(0, 10);')}
const sopData = sopFromItems($('[Exec QG] Buscar SOP Vigente').all());
const execution_id = execId('EXEC-EXEC-QG');
const tenant_id = 'phi-agencia';
const ts = utcNow();
if (!ts || !/^\d{4}-\d{2}-\d{2}$/.test(ts)) {
  throw new Error('data invalida produzida por utcNow: ' + JSON.stringify(ts));
}
return $input.all().map((item) => {
  const page = item.json || {};
  if (!page.id) throw new Error('[Montar Evento demanda.em_revisao] page.id ausente  Buscar Demandas Em Revisao retornou item sem id (alwaysOutputData removido  checar filtros)');
  const props = page.properties || {};
  const payload = {
    tenant_id,
    client_id: pickText(props.client_id),
    execution_id,
    versao_sop_aplicada: sopData.id,
    demanda_id: page.id,
    tipo: pickSelect(props.tipo) || 'Pacing/verba',
    classe_sla: pickSelect(props.classe_sla) || 'Critica',
    estado: 'Em revisao',
    tier_agente: 'flash',
  };
  return { json: { demanda_id: page.id, evento_tipo: 'demanda.em_revisao', entidade_id: page.id, entidade_area: 'Execucao', payload_json: compactJson(payload), timestamp: ts, execution_id, tenant_id, tier_agente: 'flash', versao_sop_aplicada: sopData.id } };
});`;

const qgRestoreAfterGemini = String.raw`return $('[Exec QG] Validar DoD Pacing Flash').all().map((item) => ({ json: item.json }));`;

function code(id, name, x, y, jsCode) {
  return { id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position: [x, y], parameters: { mode: 'runOnceForAllItems', jsCode } };
}

function ifNode(id, name, x, y, leftValue, operation = 'equals', rightValue = true, type = 'boolean') {
  return {
    id,
    name,
    type: 'n8n-nodes-base.if',
    typeVersion: 2.3,
    position: [x, y],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue, operator: { type, operation }, rightValue }],
        combinator: 'and',
      },
    },
  };
}

function http(id, name, x, y, method, url, jsonBody) {
  const parameters = {
    method,
    url,
    authentication: 'predefinedCredentialType',
    nodeCredentialType: 'notionApi',
    sendHeaders: true,
    specifyHeaders: 'keypair',
    headerParameters: notionHeaders,
    options: { response: { response: { responseFormat: 'json', neverError: false } } },
  };
  if (jsonBody) Object.assign(parameters, { sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody });
  return { id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.3, position: [x, y], parameters, credentials: { notionApi: creds.notionApi } };
}

function telegram(id, name, x, y, text = htmlEscape) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.telegram',
    typeVersion: 1.2,
    position: [x, y],
    parameters: { resource: 'message', operation: 'sendMessage', chatId: CHAT_ID, text, additionalFields: { parse_mode: 'HTML', appendAttribution: false } },
    credentials: { telegramApi: creds.telegramApi },
    continueOnFail: true,
  };
}

function respond(id, name, x, y, responseCode, body) {
  return { id, name, type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.5, position: [x, y], parameters: { respondWith: 'json', responseBody: body, options: { responseCode } } };
}

function notionGetAll(id, name, x, y, databaseId, filterType = 'none', filters = undefined, alwaysOutputData = true) {
  const parameters = {
    resource: 'databasePage',
    operation: 'getAll',
    databaseId: { __rl: true, mode: 'list', value: databaseId },
    returnAll: true,
    simple: false,
    filterType,
  };
  if (filters) parameters.filters = filters;
  return { id, name, type: 'n8n-nodes-base.notion', typeVersion: 2.2, position: [x, y], parameters, credentials: { notionApi: creds.notionApi }, alwaysOutputData };
}

function notionCreateDemand(id, name, x, y) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position: [x, y],
    parameters: {
      resource: 'databasePage',
      operation: 'create',
      databaseId: { __rl: true, mode: 'list', value: DB_DEMANDAS_PAGE, cachedResultName: DB_DEMANDAS_NAME },
      simple: false,
      propertiesUi: {
        propertyValues: [
          { key: 'titulo|title', type: 'title', title: '={{ $json.demanda_titulo }}' },
          { key: 'tenant_id|rich_text', type: 'rich_text', textContent: '={{ $json.tenant_id }}' },
          { key: 'client_id|rich_text', type: 'rich_text', textContent: '={{ $json.client_id }}' },
          { key: 'tipo|select', type: 'select', selectValue: 'Pacing/verba' },
          { key: 'classe_sla|select', type: 'select', selectValue: 'Critica' },
          { key: 'estado|select', type: 'select', selectValue: 'Aberta' },
          { key: 'prioridade|number', type: 'number', numberValue: '={{ $json.prioridade }}' },
          { key: 'prioridade_origem|select', type: 'select', selectValue: 'agente' },
          { key: 'prazo|date', type: 'date', date: '={{ $json.prazo }}' },
          { key: 'sla_version|rich_text', type: 'rich_text', textContent: 'v0.3-2026-06-14' },
          { key: 'quality_gate|select', type: 'select', selectValue: 'pendente' },
          { key: 'versao_sop_aplicada|rich_text', type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' },
          { key: 'observacoes|rich_text', type: 'rich_text', textContent: '={{ $json.observacoes }}' },
        ],
      },
    },
    credentials: { notionApi: creds.notionApi },
  };
}

function notionCreateEvent(id, name, x, y, pairWithQGRestore = false) {
  const valueFor = (field) => pairWithQGRestore
    ? `={{ $('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.id).json.${field} }}`
    : `={{ $json.${field} }}`;
  return {
    id,
    name,
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position: [x, y],
    parameters: {
      resource: 'databasePage',
      operation: 'create',
      databaseId: { __rl: true, mode: 'list', value: DB_EVENTOS_PAGE, cachedResultName: DB_EVENTOS_NAME },
      simple: false,
      propertiesUi: {
        propertyValues: [
          { key: 'tipo|title', type: 'title', title: valueFor('evento_tipo') },
          { key: 'entidade_id|rich_text', type: 'rich_text', textContent: valueFor('entidade_id') },
          { key: 'entidade_area|select', type: 'select', selectValue: 'Execucao' },
          { key: 'payload_json|rich_text', type: 'rich_text', textContent: valueFor('payload_json') },
          { key: 'timestamp|date', type: 'date', date: valueFor('timestamp') },
          { key: 'execution_id|rich_text', type: 'rich_text', textContent: valueFor('execution_id') },
          { key: 'tenant_id|rich_text', type: 'rich_text', textContent: valueFor('tenant_id') },
          { key: 'tier_agente|select', type: 'select', selectValue: valueFor('tier_agente') },
          { key: 'versao_sop_aplicada|rich_text', type: 'rich_text', textContent: valueFor('versao_sop_aplicada') },
        ],
      },
    },
    credentials: { notionApi: creds.notionApi },
  };
}

function notionCreateOrqEvent(id, name, x, y) {
  const valueFor = (field) => `={{ $('[Exec Orq] Restaurar Payload Priorizacao').all().find(o => o.json.demanda_id === $json.id).json.${field} }}`;
  return {
    id,
    name,
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position: [x, y],
    parameters: {
      resource: 'databasePage',
      operation: 'create',
      databaseId: { __rl: true, mode: 'list', value: DB_EVENTOS_PAGE, cachedResultName: DB_EVENTOS_NAME },
      simple: false,
      propertiesUi: {
        propertyValues: [
          { key: 'tipo|title', type: 'title', title: valueFor('evento_tipo') },
          { key: 'entidade_id|rich_text', type: 'rich_text', textContent: valueFor('entidade_id') },
          { key: 'entidade_area|select', type: 'select', selectValue: 'Execucao' },
          { key: 'payload_json|rich_text', type: 'rich_text', textContent: valueFor('payload_json') },
          { key: 'timestamp|date', type: 'date', date: valueFor('timestamp') },
          { key: 'execution_id|rich_text', type: 'rich_text', textContent: valueFor('execution_id') },
          { key: 'tenant_id|rich_text', type: 'rich_text', textContent: valueFor('tenant_id') },
          { key: 'tier_agente|select', type: 'select', selectValue: valueFor('tier_agente') },
          { key: 'versao_sop_aplicada|rich_text', type: 'rich_text', textContent: valueFor('versao_sop_aplicada') },
        ],
      },
    },
    credentials: { notionApi: creds.notionApi },
  };
}

function notionUpdateOrqDemand(id, name, x, y) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position: [x, y],
    parameters: {
      resource: 'databasePage',
      operation: 'update',
      pageId: { __rl: true, mode: 'id', value: '={{ $json.demanda_id }}' },
      simple: false,
      propertiesUi: {
        propertyValues: [
          { key: 'prioridade|number', type: 'number', numberValue: '={{ $json.prioridade }}' },
          { key: 'prioridade_origem|select', type: 'select', selectValue: '={{ $json.prioridade_origem }}' },
          { key: 'estado|select', type: 'select', selectValue: '={{ $json.novo_estado }}' },
          { key: 'versao_sop_aplicada|rich_text', type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' },
        ],
      },
    },
    credentials: { notionApi: creds.notionApi },
  };
}

function notionUpdateDemand(id, name, x, y) {
  return {
    id,
    name,
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position: [x, y],
    parameters: {
      resource: 'databasePage',
      operation: 'update',
      pageId: { __rl: true, mode: 'id', value: '={{ $json.demanda_id }}' },
      simple: false,
      propertiesUi: {
        propertyValues: [
          { key: 'estado|select', type: 'select', selectValue: '={{ $json.novo_estado }}' },
          { key: 'quality_gate|select', type: 'select', selectValue: '={{ $json.quality_gate }}' },
          { key: 'versao_sop_aplicada|rich_text', type: 'rich_text', textContent: '={{ $json.versao_sop_aplicada }}' },
        ],
      },
    },
    credentials: { notionApi: creds.notionApi },
  };
}

function gemini(id, name, x, y, model, systemMessage, content) {
  return {
    id,
    name,
    type: '@n8n/n8n-nodes-langchain.googleGemini',
    typeVersion: 1.2,
    position: [x, y],
    parameters: {
      resource: 'text',
      operation: 'message',
      modelId: { __rl: true, mode: 'list', value: model },
      messages: { values: [{ role: 'user', content }] },
      simplify: true,
      options: { includeMergedResponse: true, systemMessage, temperature: 0.1, maxOutputTokens: 512 },
    },
    credentials: { googlePalmApi: creds.googlePalmApi },
    continueOnFail: true,
  };
}

function workflow(id, name, nodes, connections, tags) {
  return {
    id,
    name,
    active: false,
    isArchived: false,
    tags: tags.map((tag) => ({ name: tag })),
    nodes,
    connections,
    settings: { executionOrder: 'v1', availableInMCP: true, timezone: 'America/Sao_Paulo' },
    staticData: null,
    meta: null,
    pinData: {},
  };
}

const sopFilters = { conditions: [{ key: 'area', condition: 'equals', selectValue: 'Execucao' }, { key: 'estado', condition: 'equals', selectValue: 'Vigente' }] };
const abertasFilters = { conditions: [{ key: 'estado', condition: 'equals', selectValue: 'Aberta' }] };
const revisaoFilters = { conditions: [{ key: 'estado', condition: 'equals', selectValue: 'Em revisao' }, { key: 'tipo', condition: 'equals', selectValue: 'Pacing/verba' }] };

const intakeNodes = [
  { id: 'exec-intake-webhook', name: '[Exec Intake] Webhook Pacing Alert', type: 'n8n-nodes-base.webhook', typeVersion: 2.1, position: [0, 0], parameters: { httpMethod: 'POST', path: 'pacing-alert', responseMode: 'responseNode', options: {} } },
  code('exec-intake-key', '[Exec Intake] Validar Secret', 220, 0, intakeValidateKey),
  ifNode('exec-intake-if-key', '[Exec Intake] Secret Valido?', 440, 0, '={{ $json.ok }}'),
  respond('exec-intake-401', '[Exec Intake] Responder 401', 660, 180, 401, '={{ { ok: false, error: "unauthorized" } }}'),
  code('exec-intake-payload', '[Exec Intake] Validar Payload', 660, -80, intakeValidatePayload),
  ifNode('exec-intake-if-payload', '[Exec Intake] Payload Valido?', 880, -80, '={{ $json.payload_valid }}'),
  respond('exec-intake-400', '[Exec Intake] Responder 400', 1100, 120, 400, '={{ { ok: false, error: "invalid_payload", details: $json.payload_errors } }}'),
  notionGetAll('exec-intake-sop', '[Exec Intake] Buscar SOP Vigente', 1100, -160, DB_SOPS, 'manual', sopFilters, false),
  code('exec-intake-sop-normalize', '[Exec Intake] Normalizar SOP Vigente', 1320, -160, normalizeSop),
  notionGetAll('exec-intake-existing', '[Exec Intake] Buscar Demandas Existentes', 1540, -160, DB_DEMANDAS, 'none', undefined, false),
  code('exec-intake-prepare', '[Exec Intake] Preparar Demanda e Evento', 1760, -160, prepareDemand),
  ifNode('exec-intake-if-exists', '[Exec Intake] Demanda Ja Existe?', 1980, -160, '={{ $json.ja_existe }}'),
  respond('exec-intake-idempotent', '[Exec Intake] Responder Idempotente', 2200, -20, 200, '={{ { ok: true, idempotent: true, idempotency_key: $json.idempotency_key } }}'),
  notionCreateDemand('exec-intake-create-demanda', '[Exec Intake] Criar Demanda', 2200, -260),
  code('exec-intake-event-body', '[Exec Intake] Montar Evento demanda.criada', 2420, -260, intakeEventAfterCreate),
  notionCreateEvent('exec-intake-create-event', '[Exec Intake] Criar Evento demanda.criada', 2640, -260),
  telegram('exec-intake-telegram', '[Exec Intake] Enviar Telegram Critico', 2860, -260, "={{ String(($('[Exec Intake] Montar Evento demanda.criada').first()?.json?.text) || '(sem texto)').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}"),
  respond('exec-intake-201', '[Exec Intake] Responder 201', 3080, -260, 201, '={{ { ok: true, demanda_id: $(\'[Exec Intake] Montar Evento demanda.criada\').first().json.demanda_id, event: "demanda.criada" } }}'),
];

const intakeConnections = {
  '[Exec Intake] Webhook Pacing Alert': { main: [[{ node: '[Exec Intake] Validar Secret', type: 'main', index: 0 }]] },
  '[Exec Intake] Validar Secret': { main: [[{ node: '[Exec Intake] Secret Valido?', type: 'main', index: 0 }]] },
  '[Exec Intake] Secret Valido?': { main: [[{ node: '[Exec Intake] Validar Payload', type: 'main', index: 0 }], [{ node: '[Exec Intake] Responder 401', type: 'main', index: 0 }]] },
  '[Exec Intake] Validar Payload': { main: [[{ node: '[Exec Intake] Payload Valido?', type: 'main', index: 0 }]] },
  '[Exec Intake] Payload Valido?': { main: [[{ node: '[Exec Intake] Buscar SOP Vigente', type: 'main', index: 0 }], [{ node: '[Exec Intake] Responder 400', type: 'main', index: 0 }]] },
  '[Exec Intake] Buscar SOP Vigente': { main: [[{ node: '[Exec Intake] Normalizar SOP Vigente', type: 'main', index: 0 }]] },
  '[Exec Intake] Normalizar SOP Vigente': { main: [[{ node: '[Exec Intake] Buscar Demandas Existentes', type: 'main', index: 0 }]] },
  '[Exec Intake] Buscar Demandas Existentes': { main: [[{ node: '[Exec Intake] Preparar Demanda e Evento', type: 'main', index: 0 }]] },
  '[Exec Intake] Preparar Demanda e Evento': { main: [[{ node: '[Exec Intake] Demanda Ja Existe?', type: 'main', index: 0 }]] },
  '[Exec Intake] Demanda Ja Existe?': { main: [[{ node: '[Exec Intake] Responder Idempotente', type: 'main', index: 0 }], [{ node: '[Exec Intake] Criar Demanda', type: 'main', index: 0 }]] },
  '[Exec Intake] Criar Demanda': { main: [[{ node: '[Exec Intake] Montar Evento demanda.criada', type: 'main', index: 0 }]] },
  '[Exec Intake] Montar Evento demanda.criada': { main: [[{ node: '[Exec Intake] Criar Evento demanda.criada', type: 'main', index: 0 }]] },
  '[Exec Intake] Criar Evento demanda.criada': { main: [[{ node: '[Exec Intake] Enviar Telegram Critico', type: 'main', index: 0 }]] },
  '[Exec Intake] Enviar Telegram Critico': { main: [[{ node: '[Exec Intake] Responder 201', type: 'main', index: 0 }]] },
};

const orqNodes = [
  { id: 'exec-orq-schedule', name: '[Exec Orq] Schedule 08 BR', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.3, position: [0, -120], parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 8, triggerAtMinute: 0 }] } } },
  { id: 'exec-orq-manual', name: '[Exec Orq] Manual Trigger', type: 'n8n-nodes-base.manualTrigger', typeVersion: 1, position: [0, 120], parameters: {} },
  { id: 'exec-orq-merge-trigger', name: '[Exec Orq] Merge Triggers', type: 'n8n-nodes-base.merge', typeVersion: 3, position: [220, 0], parameters: { mode: 'append', numberInputs: 2 } },
  notionGetAll('exec-orq-sop', '[Exec Orq] Buscar SOP Vigente', 440, 0, DB_SOPS, 'manual', sopFilters, false),
  code('exec-orq-sop-normalize', '[Exec Orq] Normalizar SOP Vigente', 660, 0, orqNormalizeSop),
  notionGetAll('exec-orq-open', '[Exec Orq] Buscar Demandas Abertas', 880, 0, DB_DEMANDAS, 'manual', abertasFilters, false),
  gemini('exec-orq-gemini', '[Exec Orq] Gemini Pro Sequencia do Dia', 1100, 160, 'models/gemini-2.5-pro', 'Voce e o Orquestrador da fila operacional PHI. No Lote 1, apenas confirme a ordenacao por prioridade calculada. Responda JSON curto.', '={{ JSON.stringify($json) }}'),
  code('exec-orq-prioridade', '[Exec Orq] Calcular Prioridade Pro', 1100, 0, orqPrioritize),
  code('exec-orq-restaurar', '[Exec Orq] Restaurar Payload Priorizacao', 1320, 0, orqRestoreAfterGemini),
  notionUpdateOrqDemand('exec-orq-update', '[Exec Orq] Atualizar Demanda Priorizada', 1540, 0),
  notionCreateOrqEvent('exec-orq-event', '[Exec Orq] Criar Evento demanda.priorizada', 1760, 0),
];

const orqConnections = {
  '[Exec Orq] Schedule 08 BR': { main: [[{ node: '[Exec Orq] Merge Triggers', type: 'main', index: 0 }]] },
  '[Exec Orq] Manual Trigger': { main: [[{ node: '[Exec Orq] Merge Triggers', type: 'main', index: 1 }]] },
  '[Exec Orq] Merge Triggers': { main: [[{ node: '[Exec Orq] Buscar SOP Vigente', type: 'main', index: 0 }]] },
  '[Exec Orq] Buscar SOP Vigente': { main: [[{ node: '[Exec Orq] Normalizar SOP Vigente', type: 'main', index: 0 }]] },
  '[Exec Orq] Normalizar SOP Vigente': { main: [[{ node: '[Exec Orq] Buscar Demandas Abertas', type: 'main', index: 0 }]] },
  '[Exec Orq] Buscar Demandas Abertas': { main: [[{ node: '[Exec Orq] Calcular Prioridade Pro', type: 'main', index: 0 }]] },
  '[Exec Orq] Calcular Prioridade Pro': { main: [[{ node: '[Exec Orq] Gemini Pro Sequencia do Dia', type: 'main', index: 0 }]] },
  '[Exec Orq] Gemini Pro Sequencia do Dia': { main: [[{ node: '[Exec Orq] Restaurar Payload Priorizacao', type: 'main', index: 0 }]] },
  '[Exec Orq] Restaurar Payload Priorizacao': { main: [[{ node: '[Exec Orq] Atualizar Demanda Priorizada', type: 'main', index: 0 }]] },
  '[Exec Orq] Atualizar Demanda Priorizada': { main: [[{ node: '[Exec Orq] Criar Evento demanda.priorizada', type: 'main', index: 0 }]] },
};

const qgNodes = [
  { id: 'exec-qg-schedule', name: '[Exec QG] Schedule 5 min', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.3, position: [0, 0], parameters: { rule: { interval: [{ field: 'minutes', minutesInterval: 5 }] } } },
  notionGetAll('exec-qg-sop', '[Exec QG] Buscar SOP Vigente', 220, 0, DB_SOPS, 'manual', sopFilters, false),
  notionGetAll('exec-qg-revisao', '[Exec QG] Buscar Demandas Em Revisao', 440, 0, DB_DEMANDAS, 'manual', revisaoFilters, false),
  code('exec-qg-event-revisao-body', '[Exec QG] Montar Evento demanda.em_revisao', 660, 0, qgReviewEvent),
  notionCreateEvent('exec-qg-event-revisao', '[Exec QG] Criar Evento demanda.em_revisao', 880, 0),
  gemini('exec-qg-gemini', '[Exec QG] Gemini Flash DoD Pacing', 1100, 160, 'models/gemini-2.5-flash', 'Voce e o Padronizador Flash. Valide mecanicamente DoD de Pacing/verba.', '={{ JSON.stringify($json) }}'),
  code('exec-qg-validar', '[Exec QG] Validar DoD Pacing Flash', 1100, 0, qgValidate),
  code('exec-qg-restaurar', '[Exec QG] Restaurar Payload DoD', 1320, 0, qgRestoreAfterGemini),
  ifNode('exec-qg-if-pass', '[Exec QG] Resultado PASS?', 1540, 0, '={{ $json.quality_gate }}', 'equals', 'pass', 'string'),
  notionUpdateDemand('exec-qg-entregue', '[Exec QG] Marcar Entregue', 1760, -140),
  notionCreateEvent('exec-qg-event-entregue', '[Exec QG] Criar Evento demanda.entregue', 1980, -140, true),
  notionUpdateDemand('exec-qg-reabrir', '[Exec QG] Reabrir Demanda', 1760, 160),
  notionCreateEvent('exec-qg-event-reaberta', '[Exec QG] Criar Evento demanda.reaberta', 1980, 160, true),
  telegram('exec-qg-telegram-fail', '[Exec QG] Telegram Checklist FAIL', 2200, 160, "={{ String(($('[Exec QG] Restaurar Payload DoD').all().find(o => o.json.demanda_id === $json.properties.entidade_id.rich_text[0].text.content) || {json:{}}).json.text || '(sem texto)').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}"),
];

const qgConnections = {
  '[Exec QG] Schedule 5 min': { main: [[{ node: '[Exec QG] Buscar SOP Vigente', type: 'main', index: 0 }]] },
  '[Exec QG] Buscar SOP Vigente': { main: [[{ node: '[Exec QG] Buscar Demandas Em Revisao', type: 'main', index: 0 }]] },
  '[Exec QG] Buscar Demandas Em Revisao': { main: [[{ node: '[Exec QG] Montar Evento demanda.em_revisao', type: 'main', index: 0 }]] },
  '[Exec QG] Montar Evento demanda.em_revisao': { main: [[{ node: '[Exec QG] Criar Evento demanda.em_revisao', type: 'main', index: 0 }]] },
  '[Exec QG] Criar Evento demanda.em_revisao': { main: [[{ node: '[Exec QG] Validar DoD Pacing Flash', type: 'main', index: 0 }]] },
  '[Exec QG] Validar DoD Pacing Flash': { main: [[{ node: '[Exec QG] Gemini Flash DoD Pacing', type: 'main', index: 0 }]] },
  '[Exec QG] Gemini Flash DoD Pacing': { main: [[{ node: '[Exec QG] Restaurar Payload DoD', type: 'main', index: 0 }]] },
  '[Exec QG] Restaurar Payload DoD': { main: [[{ node: '[Exec QG] Resultado PASS?', type: 'main', index: 0 }]] },
  '[Exec QG] Resultado PASS?': { main: [[{ node: '[Exec QG] Marcar Entregue', type: 'main', index: 0 }], [{ node: '[Exec QG] Reabrir Demanda', type: 'main', index: 0 }]] },
  '[Exec QG] Marcar Entregue': { main: [[{ node: '[Exec QG] Criar Evento demanda.entregue', type: 'main', index: 0 }]] },
  '[Exec QG] Reabrir Demanda': { main: [[{ node: '[Exec QG] Criar Evento demanda.reaberta', type: 'main', index: 0 }]] },
  '[Exec QG] Criar Evento demanda.reaberta': { main: [[{ node: '[Exec QG] Telegram Checklist FAIL', type: 'main', index: 0 }]] },
};

const workflows = [
  ['intake-pacing', workflow('<workflow_id_pending_review_intake>', 'WF-EXEC-Intake-Pacing', intakeNodes, intakeConnections, ['phi', 'execucao', 'lote1'])],
  ['orquestrador', workflow('<workflow_id_pending_review_orquestrador>', 'WF-EXEC-Orquestrador', orqNodes, orqConnections, ['phi', 'execucao', 'lote1'])],
  ['qualitygate-pacing', workflow('<workflow_id_pending_review_qualitygate>', 'WF-EXEC-QualityGate-Pacing', qgNodes, qgConnections, ['phi', 'execucao', 'lote1'])],
];

function writeIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content || existing.replace(/\r\n/g, '\n') === content) return;
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

for (const [dirName, data] of workflows) {
  const outDir = path.join(__dirname, dirName);
  fs.mkdirSync(outDir, { recursive: true });
  const json = JSON.stringify(data, null, 2) + '\n';
  writeIfChanged(path.join(outDir, 'workflow.json'), json);
  writeIfChanged(path.join(outDir, 'sandbox_export.json'), json);
}
