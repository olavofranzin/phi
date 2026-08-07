const fs = require('fs');
const path = require('path');

const LIVE = process.argv.includes('--live');
const liveSecret = process.env.ONB_WEBHOOK_SECRET || '';
if (LIVE && !liveSecret) {
  throw new Error('ONB_WEBHOOK_SECRET is required when generating live export');
}

const cred = {
  notionApi: LIVE ? { id: 'KpPCTsYPAvGXGfp2', name: 'Notion account' } : { id: '<credential_id_redacted>', name: 'Notion account' },
  telegramApi: LIVE ? { id: 'pHCHzZTP2yReQXb6', name: 'Telegram account' } : { id: '<TELEGRAM_CREDENTIAL_ID_redacted>', name: 'Telegram account' },
  googlePalmApi: LIVE ? { id: 'cZNPIzF5ZCMrpnDr', name: 'Google Gemini(PaLM) Api account' } : { id: '<GEMINI_CREDENTIAL_ID_redacted>', name: 'Google Gemini(PaLM) Api account' },
};
const chatId = LIVE ? '930549271' : '<TELEGRAM_CHAT_ID_redacted>';
const onbSecret = LIVE ? liveSecret : '<ONB_WEBHOOK_SECRET_redacted>';

const CLIENTES_DB = '04e34a62624b484cbda546604564b88c';
const ETAPAS_DB = '6eb4565b4f1d498c8b2978e0c80880fd';
const CLASS_PROP = 'Classifica\\u00e7\\u00e3o do briefing';
const htmlEscape = "={{ String($json.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}";
const notionHeaders = {
  parameters: [
    { name: 'Notion-Version', value: '2022-06-28' },
    { name: 'Accept', value: 'application/json' },
  ],
};

const pickers = String.raw`const pickTitle = (page) => {
  for (const prop of Object.values(page.properties || {})) {
    if (prop?.type === 'title') return (prop.title || []).map((item) => item.plain_text || '').join('').trim();
  }
  return '';
};
const pickSelect = (prop) => prop?.select?.name || prop?.status?.name || '';
const pickNumber = (prop) => prop?.number ?? prop?.rollup?.number ?? null;
const pickPlainText = (prop) => (prop?.rich_text || []).map((item) => item.plain_text || '').join('').trim();
const richText = (text) => [{ type: 'text', text: { content: String(text || '').slice(0, 1900) } }];
const brIso = () => new Date().toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + '-03:00';`;

const validarSecret = String.raw`const ONB_WEBHOOK_SECRET = '${onbSecret}';
const out = [];
for (const item of $input.all()) {
  const headers = item.json.headers || {};
  const lowerHeaders = {};
  for (const [key, value] of Object.entries(headers)) lowerHeaders[String(key).toLowerCase()] = value;
  const provided = String(lowerHeaders['x-onb-secret'] || '').trim();
  out.push({ json: { ...item.json, onb_secret_valid: provided === ONB_WEBHOOK_SECRET } });
}
return out;`;

const validarPayload = String.raw`const out = [];
for (const item of $input.all()) {
  const body = item.json.body && typeof item.json.body === 'object' ? item.json.body : item.json;
  const briefing = body.briefing_payload;
  const errors = [];
  if (!body.cliente_page_id || typeof body.cliente_page_id !== 'string') errors.push('cliente_page_id ausente');
  if (!briefing || typeof briefing !== 'object' || Array.isArray(briefing) || Object.keys(briefing).length === 0) errors.push('briefing_payload invalido');
  out.push({ json: { ...item.json, cliente_page_id: body.cliente_page_id, briefing_payload: briefing, payload_valid: errors.length === 0, payload_errors: errors } });
}
return out;`;

const localizarSeq = String.raw`${pickers}
const base = $('[Onb A2.3] Validar Payload').item.json;
const cliente = $('[Onb A2.3] Buscar Cliente').item.json;
const results = $json.results || [];
let seq7 = null;
let seq8 = null;
for (const page of results) {
  const props = page.properties || {};
  const seq = pickNumber(props['Sequ\u00eancia']) ?? pickNumber(props.Sequencia);
  const etapa = {
    page_id: page.id,
    nome: pickTitle(page),
    status: pickSelect(props.Status),
    observacoes: pickPlainText(props['Observa\u00e7\u00f5es']) || pickPlainText(props.Observacoes) || '',
  };
  if (Number(seq) === 7) seq7 = etapa;
  if (Number(seq) === 8) seq8 = etapa;
}
if (!seq7 || !seq8) throw new Error('Seq 7 ou Seq 8 nao encontrada para cliente ' + base.cliente_page_id);
return [{ json: { ...base, cliente_nome: pickTitle(cliente), seq7, seq8 } }];`;

const normalizarDecisao = String.raw`const pickText = (data) => {
  if (typeof data.text === 'string' && data.text.trim()) return data.text;
  if (typeof data.mergedResponse === 'string' && data.mergedResponse.trim()) return data.mergedResponse;
  if (Array.isArray(data.content?.parts)) return data.content.parts.map((part) => part.text || '').join('');
  if (typeof data.content === 'string') return data.content;
  return '';
};
const prev = $('[Onb A2.3] Localizar Seq 7 e Seq 8').item.json;
const raw = pickText($json).replace(new RegExp('\\x60{3}json|\\x60{3}', 'g'), '').replace(/\*\*/g, '').trim();
let parsed;
try { parsed = JSON.parse(raw); } catch (error) { parsed = null; }
const allowed = new Set(['Aprovado', 'Aprovado com lacunas', 'Insuficiente']);
const hasResumo = (obj) => obj && typeof obj === 'object' && ['oferta', 'publico', 'objecoes', 'diferencial', 'concorrentes', 'metas', 'riscos'].every((key) => typeof obj[key] === 'string');
let decisao = { classificacao: 'Insuficiente', justificativa: 'Avaliacao automatica falhou', lacunas: ['Erro tecnico'], resumo_operacional: null };
if (parsed && allowed.has(parsed.classificacao)) {
  const classificacao = parsed.classificacao;
  const resumo = classificacao === 'Insuficiente' ? null : (hasResumo(parsed.resumo_operacional) ? parsed.resumo_operacional : null);
  if (classificacao === 'Insuficiente' || resumo) {
    decisao = {
      classificacao,
      justificativa: String(parsed.justificativa || ''),
      lacunas: Array.isArray(parsed.lacunas) ? parsed.lacunas.map((x) => String(x)).filter(Boolean) : [],
      resumo_operacional: resumo,
    };
  }
}
const modo = decisao.classificacao === 'Aprovado' ? 'APROVADO' : decisao.classificacao === 'Aprovado com lacunas' ? 'LACUNAS' : 'INSUFICIENTE';
return [{ json: { ...prev, decisao, modo } }];`;

const prepararAprovado = String.raw`${pickers}
const iso = brIso();
const classe = $json.decisao.classificacao;
const resumo = $json.decisao.resumo_operacional || {};
const lacunas = ($json.decisao.lacunas || []).join(', ');
const seq7Obs = ($json.seq7.observacoes || '') + '\nA2.3 classificou em ' + classe + ' em ' + iso + '.';
const seq8Obs = ($json.seq8.observacoes || '') + '\nResumo gerado por A2.3 em ' + iso + '. Sub-pagina anexada ao cliente.';
const blockParagraph = (text) => ({ object: 'block', type: 'paragraph', paragraph: { rich_text: richText(text) } });
const heading = (text) => ({ object: 'block', type: 'heading_2', heading_2: { rich_text: richText(text) } });
const resumoChildren = [
  ['Oferta', resumo.oferta],
  ['Publico', resumo.publico],
  ['Objecoes', resumo.objecoes],
  ['Diferencial', resumo.diferencial],
  ['Concorrentes', resumo.concorrentes],
  ['Metas', resumo.metas],
  ['Riscos', resumo.riscos],
].flatMap(([title, text]) => [heading(title), blockParagraph(text || '-')]);
const originalJson = JSON.stringify($json.briefing_payload, null, 2).slice(0, 1800);
const originalChildren = [
  heading('Payload bruto'),
  { object: 'block', type: 'code', code: { language: 'json', rich_text: richText(originalJson) } },
];
return [{ json: {
  ...$json,
  cliente_update_body: { properties: { 'Classifica\u00e7\u00e3o do briefing': { select: { name: classe } } } },
  resumo_body: { parent: { page_id: $json.cliente_page_id }, properties: { title: { title: [{ text: { content: 'Resumo Operacional do Briefing' } }] } }, children: resumoChildren },
  original_body: { parent: { page_id: $json.cliente_page_id }, properties: { title: { title: [{ text: { content: 'Briefing original (resposta do Form)' } }] } }, children: originalChildren },
  seq7_update_body: { properties: { Status: { select: { name: 'Conclu\u00eddo' } }, 'Observa\u00e7\u00f5es': { rich_text: richText(seq7Obs) } } },
  seq8_update_body: { properties: { Status: { select: { name: 'Conclu\u00eddo' } }, 'Observa\u00e7\u00f5es': { rich_text: richText(seq8Obs) } } },
  text: classe === 'Aprovado'
    ? '\u2705 Cliente ' + $json.cliente_nome + ' aprovado: resumo no Notion.'
    : '\u26a0\ufe0f Cliente ' + $json.cliente_nome + ' aprovado com lacunas: ' + (lacunas || 'lacunas nao especificadas') + '. Esclarecimento curto antes da call. Resumo no Notion.'
} }];`;

const prepararInsuficiente = String.raw`${pickers}
const iso = brIso();
const classe = $json.decisao.classificacao;
const lacunas = ($json.decisao.lacunas || []).join(', ') || 'lacunas criticas nao especificadas';
const seq7Obs = ($json.seq7.observacoes || '') + '\nA2.3 classificou em ' + classe + ' em ' + iso + '.';
const originalJson = JSON.stringify($json.briefing_payload, null, 2).slice(0, 1800);
const originalChildren = [
  { object: 'block', type: 'heading_2', heading_2: { rich_text: richText('Payload bruto') } },
  { object: 'block', type: 'code', code: { language: 'json', rich_text: richText(originalJson) } },
];
return [{ json: {
  ...$json,
  cliente_update_body: { properties: { 'Classifica\u00e7\u00e3o do briefing': { select: { name: 'Insuficiente' } } } },
  original_body: { parent: { page_id: $json.cliente_page_id }, properties: { title: { title: [{ text: { content: 'Briefing original (resposta do Form)' } }] } }, children: originalChildren },
  seq7_update_body: { properties: { Status: { select: { name: 'Conclu\u00eddo' } }, 'Observa\u00e7\u00f5es': { rich_text: richText(seq7Obs) } } },
  text: '\u274c Cliente ' + $json.cliente_nome + ' classificado Insuficiente: ' + lacunas + '. A2.4 (Lote 3) fara microcall quando estiver no ar.'
} }];`;

const montarRespostaAprovado = String.raw`const p = $('[Onb A2.3] Preparar Atualizacoes Aprovado').item.json;
const resumo = $('[Onb A2.3] Criar Sub-pagina Resumo Operacional').item.json;
const original = $('[Onb A2.3] Criar Sub-pagina Briefing Original').item.json;
return [{ json: { ...p, resumo_page_id: resumo.id, original_page_id: original.id, sub_paginas: [resumo.id, original.id], text: p.text } }];`;

const montarRespostaInsuf = String.raw`const p = $('[Onb A2.3] Preparar Atualizacoes Insuficiente').item.json;
const original = $('[Onb A2.3] Criar Sub-pagina Briefing Original Insuf').item.json;
return [{ json: { ...p, original_page_id: original.id, sub_paginas: [original.id], text: p.text } }];`;

const response200Aprovado = "={{ { ok: true, classificacao: $('[Onb A2.3] Montar Telegram Aprovado').item.json.decisao.classificacao, cliente_page_id: $('[Onb A2.3] Montar Telegram Aprovado').item.json.cliente_page_id, sub_paginas: $('[Onb A2.3] Montar Telegram Aprovado').item.json.sub_paginas || [] } }}";
const response200Insuf = "={{ { ok: true, classificacao: $('[Onb A2.3] Montar Telegram Insuf').item.json.decisao.classificacao, cliente_page_id: $('[Onb A2.3] Montar Telegram Insuf').item.json.cliente_page_id, sub_paginas: $('[Onb A2.3] Montar Telegram Insuf').item.json.sub_paginas || [] } }}";

const systemMessage = 'Voce e analista comercial-operacional de uma agencia de trafego pago. Recebe respostas de briefing do cliente em JSON. Tarefa: 1) Classificar em UMA das 3 classes: Aprovado, Aprovado com lacunas, Insuficiente. 2) Se Aprovado ou Aprovado com lacunas: gerar resumo operacional de 1 pagina com 7 secoes: oferta, publico, objecoes, diferencial, concorrentes, metas, riscos. Criterios: Aprovado: campos mandatorios todos presentes e claros (contato, oferta principal, objetivo, orcamento, concorrentes, canais atuais, processo comercial). Aprovado com lacunas: mandatorios presentes mas com falta de info nao-critica (ex: detalhes incompletos em 1-2 campos secundarios). Lista as lacunas. Insuficiente: faltam campos mandatorios criticos ou informacao tao vaga que nao da pra operar. Lista as lacunas criticas. Resposta APENAS JSON valido, sem markdown, sem comentarios externos. Schema: { "classificacao": "Aprovado" | "Aprovado com lacunas" | "Insuficiente", "justificativa": "<frase curta>", "lacunas": ["<descricao>", ...], "resumo_operacional": { "oferta": "...", "publico": "...", "objecoes": "...", "diferencial": "...", "concorrentes": "...", "metas": "...", "riscos": "..." } }';

function code(id, name, x, y, jsCode) {
  return { id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position: [x, y], parameters: { mode: 'runOnceForAllItems', jsCode } };
}
function ifNode(id, name, x, y, leftValue, operation, rightValue = true, type = 'boolean') {
  return { id, name, type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [x, y], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue, operator: { type, operation }, rightValue }], combinator: 'and' } } };
}
function respond(id, name, x, y, code, body) {
  return { id, name, type: 'n8n-nodes-base.respondToWebhook', typeVersion: 1.5, position: [x, y], parameters: { respondWith: 'json', responseBody: body, options: { responseCode: code } } };
}
function http(id, name, x, y, method, url, jsonBody) {
  const parameters = { method, url, authentication: 'predefinedCredentialType', nodeCredentialType: 'notionApi', sendHeaders: true, specifyHeaders: 'keypair', headerParameters: notionHeaders, options: { response: { response: { responseFormat: 'json', neverError: false } } } };
  if (jsonBody) Object.assign(parameters, { sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody });
  return { id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.3, position: [x, y], parameters, credentials: { notionApi: cred.notionApi } };
}
function telegram(id, name, x, y) {
  return { id, name, type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: [x, y], parameters: { resource: 'message', operation: 'sendMessage', chatId, text: htmlEscape, additionalFields: { parse_mode: 'HTML', appendAttribution: false } }, credentials: { telegramApi: cred.telegramApi }, continueOnFail: true };
}
function switchNode() {
  const mk = (value) => ({ outputKey: value, conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: '={{ $json.modo }}', operator: { type: 'string', operation: 'equals' }, rightValue: value }], combinator: 'and' } });
  return { id: 'a23-switch-classe', name: '[Onb A2.3] Roteador por Classe', type: 'n8n-nodes-base.switch', typeVersion: 3.4, position: [3000, 120], parameters: { rules: { values: ['APROVADO', 'LACUNAS', 'INSUFICIENTE'].map(mk) }, options: { fallbackOutput: 'none' } } };
}

const queryEtapasBody = "={{ { filter: { property: 'Cliente', relation: { contains: $('[Onb A2.3] Validar Payload').item.json.cliente_page_id } }, page_size: 100 } }}";
const nodes = [
  { id: 'a23-webhook', name: '[Onb A2.3] Webhook Briefing', type: 'n8n-nodes-base.webhook', typeVersion: 2.1, position: [0, 160], parameters: { httpMethod: 'POST', path: 'a2.3-classifica-briefing', responseMode: 'responseNode', options: {} } },
  code('a23-secret', '[Onb A2.3] Validar Secret', 240, 160, validarSecret),
  ifNode('a23-if-secret', '[Onb A2.3] Secret Valido?', 480, 160, '={{ $json.onb_secret_valid }}', 'equals'),
  respond('a23-401', '[Onb A2.3] Responder 401', 720, 360, 401, '={{ { ok: false, error: "unauthorized" } }}'),
  code('a23-payload', '[Onb A2.3] Validar Payload', 720, 80, validarPayload),
  ifNode('a23-if-payload', '[Onb A2.3] Payload Valido?', 960, 80, '={{ $json.payload_valid }}', 'equals'),
  respond('a23-400', '[Onb A2.3] Responder 400', 1200, 280, 400, '={{ { ok: false, error: "invalid_payload", details: $json.payload_errors } }}'),
  http('a23-cliente', '[Onb A2.3] Buscar Cliente', 1200, 0, 'GET', '={{ "https://api.notion.com/v1/pages/" + $json.cliente_page_id }}'),
  ifNode('a23-if-classificado', '[Onb A2.3] Ja Classificado?', 1440, 0, "={{ $json.properties['Classifica\\u00e7\\u00e3o do briefing']?.select?.name || '' }}", 'notEmpty', '', 'string'),
  respond('a23-idempotente', '[Onb A2.3] Responder Idempotente', 1680, -160, 200, "={{ { ok: true, ja_classificado: true, classificacao: $json.properties['Classifica\\u00e7\\u00e3o do briefing'].select.name } }}"),
  http('a23-etapas', '[Onb A2.3] Buscar Etapas do Cliente', 1680, 80, 'POST', `https://api.notion.com/v1/databases/${ETAPAS_DB}/query`, queryEtapasBody),
  code('a23-seq', '[Onb A2.3] Localizar Seq 7 e Seq 8', 1920, 80, localizarSeq),
  { id: 'a23-gemini', name: '[Onb A2.3] Avaliar via Gemini Pro', type: '@n8n/n8n-nodes-langchain.googleGemini', typeVersion: 1.2, position: [2280, 80], parameters: { resource: 'text', operation: 'message', modelId: { __rl: true, mode: 'list', value: 'models/gemini-2.5-pro' }, messages: { values: [{ role: 'user', content: '={{ JSON.stringify({ cliente_nome: $json.cliente_nome, briefing_payload: $json.briefing_payload }) }}' }] }, simplify: true, options: { includeMergedResponse: true, systemMessage, temperature: 0.1, maxOutputTokens: 2048 } }, credentials: { googlePalmApi: cred.googlePalmApi }, continueOnFail: true, retryOnFail: true, waitBetweenTries: 2000 },
  code('a23-normalizar', '[Onb A2.3] Normalizar Decisao', 2640, 80, normalizarDecisao),
  switchNode(),
  code('a23-prep-aprovado', '[Onb A2.3] Preparar Atualizacoes Aprovado', 3240, -40, prepararAprovado),
  http('a23-set-cliente-aprovado', '[Onb A2.3] Setar Classificacao no Cliente', 3480, -40, 'PATCH', '={{ "https://api.notion.com/v1/pages/" + $json.cliente_page_id }}', '={{ $json.cliente_update_body }}'),
  http('a23-criar-resumo', '[Onb A2.3] Criar Sub-pagina Resumo Operacional', 3720, -40, 'POST', 'https://api.notion.com/v1/pages', "={{ $('[Onb A2.3] Preparar Atualizacoes Aprovado').item.json.resumo_body }}"),
  http('a23-criar-original', '[Onb A2.3] Criar Sub-pagina Briefing Original', 3960, -40, 'POST', 'https://api.notion.com/v1/pages', "={{ $('[Onb A2.3] Preparar Atualizacoes Aprovado').item.json.original_body }}"),
  http('a23-update-seq7', '[Onb A2.3] Atualizar Seq 7', 4200, -40, 'PATCH', "={{ 'https://api.notion.com/v1/pages/' + $('[Onb A2.3] Preparar Atualizacoes Aprovado').item.json.seq7.page_id }}", "={{ $('[Onb A2.3] Preparar Atualizacoes Aprovado').item.json.seq7_update_body }}"),
  http('a23-update-seq8', '[Onb A2.3] Atualizar Seq 8', 4440, -40, 'PATCH', "={{ 'https://api.notion.com/v1/pages/' + $('[Onb A2.3] Preparar Atualizacoes Aprovado').item.json.seq8.page_id }}", "={{ $('[Onb A2.3] Preparar Atualizacoes Aprovado').item.json.seq8_update_body }}"),
  code('a23-msg-aprovado', '[Onb A2.3] Montar Telegram Aprovado', 4680, -40, montarRespostaAprovado),
  telegram('a23-tg-aprovado', '[Onb A2.3] Telegram Aprovado/Lacunas', 4920, -40),
  respond('a23-200-aprovado', '[Onb A2.3] Responder 200 Aprovado', 5160, -40, 200, response200Aprovado),
  code('a23-prep-insuf', '[Onb A2.3] Preparar Atualizacoes Insuficiente', 3240, 320, prepararInsuficiente),
  http('a23-set-insuf', '[Onb A2.3] Setar Classificacao Insuficiente', 3480, 320, 'PATCH', '={{ "https://api.notion.com/v1/pages/" + $json.cliente_page_id }}', '={{ $json.cliente_update_body }}'),
  http('a23-original-insuf', '[Onb A2.3] Criar Sub-pagina Briefing Original Insuf', 3720, 320, 'POST', 'https://api.notion.com/v1/pages', "={{ $('[Onb A2.3] Preparar Atualizacoes Insuficiente').item.json.original_body }}"),
  http('a23-update-seq7-insuf', '[Onb A2.3] Atualizar Seq 7 Insuf', 3960, 320, 'PATCH', "={{ 'https://api.notion.com/v1/pages/' + $('[Onb A2.3] Preparar Atualizacoes Insuficiente').item.json.seq7.page_id }}", "={{ $('[Onb A2.3] Preparar Atualizacoes Insuficiente').item.json.seq7_update_body }}"),
  code('a23-msg-insuf', '[Onb A2.3] Montar Telegram Insuf', 4200, 320, montarRespostaInsuf),
  telegram('a23-tg-insuf', '[Onb A2.3] Telegram Insuficiente', 4440, 320),
  respond('a23-200-insuf', '[Onb A2.3] Responder 200 Insuficiente', 4680, 320, 200, response200Insuf),
];

const connections = {
  '[Onb A2.3] Webhook Briefing': { main: [[{ node: '[Onb A2.3] Validar Secret', type: 'main', index: 0 }]] },
  '[Onb A2.3] Validar Secret': { main: [[{ node: '[Onb A2.3] Secret Valido?', type: 'main', index: 0 }]] },
  '[Onb A2.3] Secret Valido?': { main: [[{ node: '[Onb A2.3] Validar Payload', type: 'main', index: 0 }], [{ node: '[Onb A2.3] Responder 401', type: 'main', index: 0 }]] },
  '[Onb A2.3] Validar Payload': { main: [[{ node: '[Onb A2.3] Payload Valido?', type: 'main', index: 0 }]] },
  '[Onb A2.3] Payload Valido?': { main: [[{ node: '[Onb A2.3] Buscar Cliente', type: 'main', index: 0 }], [{ node: '[Onb A2.3] Responder 400', type: 'main', index: 0 }]] },
  '[Onb A2.3] Buscar Cliente': { main: [[{ node: '[Onb A2.3] Ja Classificado?', type: 'main', index: 0 }]] },
  '[Onb A2.3] Ja Classificado?': { main: [[{ node: '[Onb A2.3] Responder Idempotente', type: 'main', index: 0 }], [{ node: '[Onb A2.3] Buscar Etapas do Cliente', type: 'main', index: 0 }]] },
  '[Onb A2.3] Buscar Etapas do Cliente': { main: [[{ node: '[Onb A2.3] Localizar Seq 7 e Seq 8', type: 'main', index: 0 }]] },
  '[Onb A2.3] Localizar Seq 7 e Seq 8': { main: [[{ node: '[Onb A2.3] Avaliar via Gemini Pro', type: 'main', index: 0 }]] },
  '[Onb A2.3] Avaliar via Gemini Pro': { main: [[{ node: '[Onb A2.3] Normalizar Decisao', type: 'main', index: 0 }]] },
  '[Onb A2.3] Normalizar Decisao': { main: [[{ node: '[Onb A2.3] Roteador por Classe', type: 'main', index: 0 }]] },
  '[Onb A2.3] Roteador por Classe': { main: [[{ node: '[Onb A2.3] Preparar Atualizacoes Aprovado', type: 'main', index: 0 }], [{ node: '[Onb A2.3] Preparar Atualizacoes Aprovado', type: 'main', index: 0 }], [{ node: '[Onb A2.3] Preparar Atualizacoes Insuficiente', type: 'main', index: 0 }]] },
  '[Onb A2.3] Preparar Atualizacoes Aprovado': { main: [[{ node: '[Onb A2.3] Setar Classificacao no Cliente', type: 'main', index: 0 }]] },
  '[Onb A2.3] Setar Classificacao no Cliente': { main: [[{ node: '[Onb A2.3] Criar Sub-pagina Resumo Operacional', type: 'main', index: 0 }]] },
  '[Onb A2.3] Criar Sub-pagina Resumo Operacional': { main: [[{ node: '[Onb A2.3] Criar Sub-pagina Briefing Original', type: 'main', index: 0 }]] },
  '[Onb A2.3] Criar Sub-pagina Briefing Original': { main: [[{ node: '[Onb A2.3] Atualizar Seq 7', type: 'main', index: 0 }]] },
  '[Onb A2.3] Atualizar Seq 7': { main: [[{ node: '[Onb A2.3] Atualizar Seq 8', type: 'main', index: 0 }]] },
  '[Onb A2.3] Atualizar Seq 8': { main: [[{ node: '[Onb A2.3] Montar Telegram Aprovado', type: 'main', index: 0 }]] },
  '[Onb A2.3] Montar Telegram Aprovado': { main: [[{ node: '[Onb A2.3] Telegram Aprovado/Lacunas', type: 'main', index: 0 }]] },
  '[Onb A2.3] Telegram Aprovado/Lacunas': { main: [[{ node: '[Onb A2.3] Responder 200 Aprovado', type: 'main', index: 0 }]] },
  '[Onb A2.3] Preparar Atualizacoes Insuficiente': { main: [[{ node: '[Onb A2.3] Setar Classificacao Insuficiente', type: 'main', index: 0 }]] },
  '[Onb A2.3] Setar Classificacao Insuficiente': { main: [[{ node: '[Onb A2.3] Criar Sub-pagina Briefing Original Insuf', type: 'main', index: 0 }]] },
  '[Onb A2.3] Criar Sub-pagina Briefing Original Insuf': { main: [[{ node: '[Onb A2.3] Atualizar Seq 7 Insuf', type: 'main', index: 0 }]] },
  '[Onb A2.3] Atualizar Seq 7 Insuf': { main: [[{ node: '[Onb A2.3] Montar Telegram Insuf', type: 'main', index: 0 }]] },
  '[Onb A2.3] Montar Telegram Insuf': { main: [[{ node: '[Onb A2.3] Telegram Insuficiente', type: 'main', index: 0 }]] },
  '[Onb A2.3] Telegram Insuficiente': { main: [[{ node: '[Onb A2.3] Responder 200 Insuficiente', type: 'main', index: 0 }]] },
};

const workflow = {
  id: 'fzHjTyMcPc6Rnlb1',
  name: 'Onb - Classifica Briefing Resumo Operacional',
  active: true,
  isArchived: false,
  nodes,
  connections,
  settings: { executionOrder: 'v1', availableInMCP: true, timezone: 'America/Sao_Paulo' },
  staticData: null,
  meta: null,
  pinData: {},
};

if (LIVE) {
  delete workflow.id;
  delete workflow.active;
  delete workflow.isArchived;
  delete workflow.staticData;
  delete workflow.meta;
  delete workflow.pinData;
}

const outDir = __dirname;
const json = JSON.stringify(workflow, null, 2) + '\n';
if (LIVE) {
  fs.writeFileSync(path.join(outDir, 'workflow_live.json'), json, 'utf8');
} else {
  fs.writeFileSync(path.join(outDir, 'workflow.json'), json, 'utf8');
  fs.writeFileSync(path.join(outDir, 'sandbox_export.json'), json, 'utf8');
}
