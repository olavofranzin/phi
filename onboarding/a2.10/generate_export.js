const fs = require('fs');
const path = require('path');

// === ADR-19 build-time injection ===
// Substitui o flag --live legado. Sem env vars: JSON gerado sanitizado (commit-safe).
// Com env vars exportadas: valores reais (deploy n8n). Ver .env.example.
const fromEnvOrRedacted = (envName, redacted) => {
  const value = process.env[envName];
  return (typeof value === 'string' && value.length > 0) ? value : redacted;
};

const cred = {
  notionApi: { id: fromEnvOrRedacted('NOTION_CRED_ID', '<credential_id_redacted>'), name: 'Notion account' },
  telegramApi: { id: fromEnvOrRedacted('TELEGRAM_CRED_ID', '<TELEGRAM_CREDENTIAL_ID_redacted>'), name: 'Telegram account' },
  googlePalmApi: { id: fromEnvOrRedacted('GEMINI_CRED_ID', '<GEMINI_CREDENTIAL_ID_redacted>'), name: 'Google Gemini(PaLM) Api account' },
};
const chatId = fromEnvOrRedacted('TELEGRAM_CHAT_ID', '<TELEGRAM_CHAT_ID_redacted>');

const activeStatuses = "['Em andamento', 'N\\u00e3o iniciado', 'Bloqueado']";
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

const filtrarElegiveis = String.raw`${pickers}
const TARGET_TITLE = 'Executar valida\u00e7\u00e3o final PASS/FAIL da stack';
const TARGET_STATUS = 'Conclu\u00eddo';
const activeStatuses = new Set(${activeStatuses});
const out = [];
for (const item of $input.all()) {
  const page = item.json || {};
  if (page.archived || page.is_archived) continue;
  const props = page.properties || {};
  const title = pickTitle(page);
  const status = pickSelect(props.Status);
  const clienteRelation = props.Cliente?.relation || [];
  if (title !== TARGET_TITLE || status !== TARGET_STATUS || clienteRelation.length === 0) continue;
  out.push({ json: {
    seq21_page_id: page.id,
    seq21_nome: title,
    seq21_observacoes: pickPlainText(props['Observa\u00e7\u00f5es']) || pickPlainText(props['Observacoes']) || '',
    cliente_page_id: clienteRelation[0].id,
    active_statuses: ${activeStatuses}
  } });
}
return out;`;

const filtrarAtivo = String.raw`${pickers}
const activeStatuses = new Set(${activeStatuses});
const etapa = $('[Onb A2.10] Filtrar Elegiveis').item.json;
const cliente = $json || {};
const status = pickSelect((cliente.properties || {}).Status);
if (!activeStatuses.has(status)) return [];
return [{ json: { ...etapa, cliente_nome: pickTitle(cliente), cliente_status: status, cliente_observacoes: pickPlainText((cliente.properties || {})['Observa\u00e7\u00f5es']) || '' } }];`;

const buscarSeq22 = String.raw`${pickers}
const current = $json;
const MARK = 'Bloqueio gate A2.10';
let seq22 = null;
for (const item of $('[Onb A2.10] Buscar Etapas').all()) {
  const page = item.json || {};
  if (page.archived || page.is_archived) continue;
  const props = page.properties || {};
  const rel = props.Cliente?.relation || [];
  const seq = pickNumber(props['Sequ\u00eancia']) ?? pickNumber(props.Sequencia);
  if (rel[0]?.id === current.cliente_page_id && Number(seq) === 22) {
    seq22 = {
      page_id: page.id,
      nome: pickTitle(page),
      status: pickSelect(props.Status),
      observacoes: pickPlainText(props['Observa\u00e7\u00f5es']) || pickPlainText(props.Observacoes) || '',
    };
    break;
  }
}
if (!seq22) return [];
const fired = current.seq21_observacoes.includes('A2.10 disparada em');
const blockedByGate = seq22.observacoes.includes(MARK);
if (fired && !blockedByGate) return [];
return [{ json: { ...current, seq22 } }];`;

const prepararQuadro = String.raw`const prev = $('[Onb A2.10] Buscar seq 22 do Cliente').item.json;
const results = $json.results || [];
const quadro = results.find((block) => block.type === 'child_page' && /pass\/fail/i.test(block.child_page?.title || ''));
return [{ json: { ...prev, quadro_page_id: quadro?.id || null, modo: quadro ? 'LER_QUADRO' : 'CRIAR_TEMPLATE' } }];`;

const triageQuadro = String.raw`const prev = $('[Onb A2.10] Preparar Quadro').item.json;
const blocks = $json.results || [];
const textOf = (rt) => (rt || []).map((x) => x.plain_text || x.text?.content || '').join('');
const rows = [];
for (const block of blocks) {
  if (block.type === 'table_row') {
    rows.push((block.table_row?.cells || []).map(textOf));
  } else if (block.type === 'paragraph') {
    const line = textOf(block.paragraph?.rich_text);
    if (line.includes('|')) rows.push(line.split('|').map((x) => x.trim()));
  }
}
const dataRows = rows.filter((row) => row.length >= 5 && !/^item validado$/i.test(String(row[0] || '').trim()));
const valid = dataRows.length >= 7;
return [{ json: { ...prev, quadro_rows: dataRows.slice(0, 7), modo: valid ? 'AVALIAR' : 'ALERTAR' } }];`;

const extrairTabela = String.raw`const rows = $json.quadro_rows || [];
const tabela = rows.slice(0, 7).map((row) => ({
  item: String(row[0] || '').replace(/^\d+\.\s*/, '').trim(),
  ferramenta: String(row[1] || '').trim(),
  status: String(row[2] || '').trim().toUpperCase(),
  evidencia: String(row[3] || '').trim(),
  acao: String(row[4] || '').trim(),
}));
return [{ json: { ...$json, tabela, payload: { cliente_nome: $json.cliente_nome, tabela } } }];`;

const normalizarDecisao = String.raw`const pickText = (data) => {
  if (typeof data.text === 'string' && data.text.trim()) return data.text;
  if (typeof data.mergedResponse === 'string' && data.mergedResponse.trim()) return data.mergedResponse;
  if (Array.isArray(data.content?.parts)) return data.content.parts.map((part) => part.text || '').join('');
  if (typeof data.content === 'string') return data.content;
  return '';
};
const prev = $('[Onb A2.10] Extrair Tabela').item.json;
const raw = pickText($json).replace(new RegExp('\\x60{3}json|\\x60{3}', 'g'), '').trim();
let parsed;
try { parsed = JSON.parse(raw); } catch (error) { parsed = null; }
const failFallback = { resultado: 'FAIL', justificativa: 'Gemini indisponivel - bloqueio conservador.', itens_fail: ['Avaliacao automatica falhou'] };
const decisao = parsed && ['PASS', 'FAIL'].includes(String(parsed.resultado || '').toUpperCase())
  ? { resultado: String(parsed.resultado).toUpperCase(), justificativa: String(parsed.justificativa || ''), itens_fail: Array.isArray(parsed.itens_fail) ? parsed.itens_fail : [] }
  : failFallback;
return [{ json: { ...prev, decisao } }];`;

const prepararPass = String.raw`${pickers}
const iso = brIso();
const seq21Obs = ($json.seq21_observacoes || '') + '\nA2.10 disparada em ' + iso + '. Resultado: PASS. Liberado pra Fase 5.';
const seq22Obs = ($json.seq22?.observacoes || '') + '\nDestravada por A2.10 PASS em ' + iso + '.';
const should_unlock_seq22 = String($json.seq22?.observacoes || '').includes('Bloqueio gate A2.10');
return [{ json: {
  ...$json,
  should_unlock_seq22,
  seq21_update_body: { properties: { 'Observa\u00e7\u00f5es': { rich_text: richText(seq21Obs) } } },
  seq22_update_body: { properties: { Status: { select: { name: 'Pendente' } }, 'Observa\u00e7\u00f5es': { rich_text: richText(seq22Obs) } } },
  text: 'OK Cliente ' + $json.cliente_nome + ': validacao PASS - liberado pra Fase 5.'
} }];`;

const prepararFail = String.raw`${pickers}
const iso = brIso();
const fails = ($json.decisao?.itens_fail || []).join(', ') || 'sem item especifico';
const seq21Obs = ($json.seq21_observacoes || '') + '\nA2.10 disparada em ' + iso + '. Resultado: FAIL. Itens FAIL: ' + fails + '.';
const seq22Obs = ($json.seq22?.observacoes || '') + '\nBloqueio gate A2.10 em ' + iso + '. FAIL na seq 21 - itens: ' + fails + '.';
return [{ json: {
  ...$json,
  seq21_update_body: { properties: { 'Observa\u00e7\u00f5es': { rich_text: richText(seq21Obs) } } },
  seq22_update_body: { properties: { Status: { select: { name: 'Bloqueado' } }, 'Observa\u00e7\u00f5es': { rich_text: richText(seq22Obs) } } },
  text: 'ALERTA Cliente ' + $json.cliente_nome + ': validacao FAIL. Itens: ' + fails + '. Proxima fase (seq 22) BLOQUEADA ate correcao.'
} }];`;

const restaurarTelegramPass = "const p = $('[Onb A2.10] Preparar PASS').item.json; return [{ json: { ...p, notion_response: $json, text: p.text } }];";
const restaurarTelegramFail = "const p = $('[Onb A2.10] Preparar FAIL').item.json; return [{ json: { ...p, notion_response: $json, text: p.text } }];";

const templateBodyExpr = `={{ {
  parent: { page_id: $json.seq21_page_id },
  properties: { title: { title: [{ text: { content: 'Quadro PASS/FAIL - Validacao Final' } }] } },
  children: [
    { object: 'block', type: 'table', table: { table_width: 5, has_column_header: true, has_row_header: false, children: [
      { object: 'block', type: 'table_row', table_row: { cells: [['Item validado'], ['Ferramenta'], ['PASS/FAIL'], ['Evidencia'], ['Acao se FAIL']].map(c => [{ type: 'text', text: { content: c[0] } }]) } },
      ...[
        ['Snippet GTM instalado', 'GTM', '-', '-', '-'],
        ['Tag base GA4', 'GA4', '-', '-', '-'],
        ['Evento-chave GA4', 'GA4', '-', '-', '-'],
        ['Pixel base', 'Meta', '-', '-', '-'],
        ['Evento-chave Meta', 'Meta', '-', '-', '-'],
        ['Conversao importada', 'Google Ads', '-', '-', '-'],
        ['Jornada completa', 'Stack', '-', '-', '-'],
      ].map(row => ({ object: 'block', type: 'table_row', table_row: { cells: row.map(cell => [{ type: 'text', text: { content: cell } }]) } }))
    ] } }
  ]
} }}`;

const systemMessage = 'Voce avalia gate de validacao final do onboarding. Recebe uma tabela com 7 itens (GTM, GA4 tag, GA4 evento, Pixel Meta, evento Meta, conversao Google Ads, jornada completa). Decida: PASS (TODOS os 7 marcados PASS) ou FAIL (qualquer um FAIL ou ausente ou ambiguo). Resposta APENAS JSON valido, sem markdown, sem comentarios extras: { "resultado": "PASS" ou "FAIL", "justificativa": "<frase curta>", "itens_fail": ["<nome do item>", ...] }';

function code(id, name, x, y, jsCode) {
  return { id, name, type: 'n8n-nodes-base.code', typeVersion: 2, position: [x, y], parameters: { mode: 'runOnceForAllItems', jsCode } };
}
function notionGetAll(id, name, x, y, databaseId) {
  return { id, name, type: 'n8n-nodes-base.notion', typeVersion: 2.2, position: [x, y], parameters: { resource: 'databasePage', operation: 'getAll', databaseId: { __rl: true, mode: 'list', value: databaseId }, returnAll: true, simple: false, filterType: 'none' }, credentials: { notionApi: cred.notionApi } };
}
function http(id, name, x, y, method, url, jsonBody) {
  const parameters = { method, url, authentication: 'predefinedCredentialType', nodeCredentialType: 'notionApi', sendHeaders: true, specifyHeaders: 'keypair', headerParameters: notionHeaders, options: { response: { response: { responseFormat: 'json', neverError: false } } } };
  if (jsonBody) Object.assign(parameters, { sendBody: true, contentType: 'json', specifyBody: 'json', jsonBody });
  return { id, name, type: 'n8n-nodes-base.httpRequest', typeVersion: 4.3, position: [x, y], parameters, credentials: { notionApi: cred.notionApi } };
}
function telegram(id, name, x, y) {
  return { id, name, type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: [x, y], parameters: { resource: 'message', operation: 'sendMessage', chatId, text: htmlEscape, additionalFields: { parse_mode: 'HTML', appendAttribution: false } }, credentials: { telegramApi: cred.telegramApi }, continueOnFail: true };
}
function switchNode(id, name, x, y, cases) {
  return { id, name, type: 'n8n-nodes-base.switch', typeVersion: 3.2, position: [x, y], parameters: { rules: { values: cases.map((value) => ({ outputKey: value, conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: '={{ $json.modo }}', operator: { type: 'string', operation: 'equals' }, rightValue: value }], combinator: 'and' } })) }, options: { fallbackOutput: 'none' } } };
}

const nodes = [
  { id: 'a210-schedule', name: '[Onb A2.10] Schedule Trigger', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.3, position: [0, 0], parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 9, triggerAtMinute: 0 }] } } },
  notionGetAll('a210-buscar-etapas', '[Onb A2.10] Buscar Etapas', 224, 0, '6eb4565b4f1d498c8b2978e0c80880fd'),
  code('a210-filtrar', '[Onb A2.10] Filtrar Elegiveis', 448, 0, filtrarElegiveis),
  { id: 'a210-obter-cliente', name: '[Onb A2.10] Obter Cliente', type: 'n8n-nodes-base.notion', typeVersion: 2.2, position: [672, 0], parameters: { resource: 'databasePage', operation: 'get', pageId: { __rl: true, mode: 'id', value: '={{ $json.cliente_page_id }}' }, simple: false }, credentials: { notionApi: cred.notionApi } },
  code('a210-filtrar-ativo', '[Onb A2.10] Filtrar Cliente Ativo', 896, 0, filtrarAtivo),
  code('a210-seq22', '[Onb A2.10] Buscar seq 22 do Cliente', 1120, 0, buscarSeq22),
  http('a210-buscar-subpagina', '[Onb A2.10] Buscar Sub-pagina Quadro', 1344, 0, 'GET', '={{ "https://api.notion.com/v1/blocks/" + $json.seq21_page_id + "/children?page_size=100" }}'),
  code('a210-preparar-quadro', '[Onb A2.10] Preparar Quadro', 1568, 0, prepararQuadro),
  switchNode('a210-switch-inicial', '[Onb A2.10] Triage Modo', 1792, 0, ['CRIAR_TEMPLATE', 'LER_QUADRO']),
  http('a210-criar-template', '[Onb A2.10] Criar Sub-pagina Template', 2016, -240, 'POST', 'https://api.notion.com/v1/pages', templateBodyExpr),
  code('a210-msg-criacao', '[Onb A2.10] Montar Telegram Criacao', 2240, -240, "const p = $('[Onb A2.10] Preparar Quadro').item.json; return [{ json: { ...p, text: 'Cliente ' + p.cliente_nome + ': sub-pagina de Validacao Final criada. Preencha o quadro PASS/FAIL + evidencia por item, depois confirme a etapa seq 21 como Concluido pra liberar o gate.' } }];"),
  telegram('a210-tg-criacao', '[Onb A2.10] Telegram Criacao', 2464, -240),
  http('a210-ler-quadro', '[Onb A2.10] Ler Conteudo Quadro', 2016, 80, 'GET', '={{ "https://api.notion.com/v1/blocks/" + $json.quadro_page_id + "/children?page_size=100" }}'),
  code('a210-triage-conteudo', '[Onb A2.10] Triage Conteudo Quadro', 2240, 80, triageQuadro),
  switchNode('a210-switch-conteudo', '[Onb A2.10] Roteador Conteudo', 2464, 80, ['ALERTAR', 'AVALIAR']),
  code('a210-msg-alerta', '[Onb A2.10] Montar Telegram Alerta', 2688, -32, "return [{ json: { ...$json, text: 'ALERTA Cliente ' + $json.cliente_nome + ': quadro PASS/FAIL existe mas esta vazio/mal-formatado. Preencha pra liberar gate.' } }];"),
  telegram('a210-tg-alerta', '[Onb A2.10] Telegram Alerta', 2912, -32),
  code('a210-extrair', '[Onb A2.10] Extrair Tabela', 2688, 176, extrairTabela),
  { id: 'a210-gemini', name: '[Onb A2.10] Avaliar via Gemini', type: '@n8n/n8n-nodes-langchain.googleGemini', typeVersion: 1.2, position: [2912, 176], parameters: { resource: 'text', operation: 'message', modelId: { __rl: true, mode: 'list', value: 'models/gemini-2.5-flash' }, messages: { values: [{ role: 'user', content: '={{ JSON.stringify($json.payload) }}' }] }, simplify: true, options: { includeMergedResponse: true, systemMessage, temperature: 0.1, maxOutputTokens: 512 } }, credentials: { googlePalmApi: cred.googlePalmApi }, continueOnFail: true, retryOnFail: true, waitBetweenTries: 2000 },
  code('a210-normalizar', '[Onb A2.10] Normalizar Decisao', 3136, 176, normalizarDecisao),
  { id: 'a210-if-pass', name: '[Onb A2.10] Resultado PASS?', type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [3360, 176], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: '={{ $json.decisao.resultado }}', operator: { type: 'string', operation: 'equals' }, rightValue: 'PASS' }], combinator: 'and' } } },
  code('a210-prep-pass', '[Onb A2.10] Preparar PASS', 3584, 32, prepararPass),
  http('a210-update21-pass', '[Onb A2.10] Atualizar Seq 21 PASS', 3808, 32, 'PATCH', '={{ "https://api.notion.com/v1/pages/" + $json.seq21_page_id }}', '={{ $json.seq21_update_body }}'),
  { id: 'a210-if-unlock', name: '[Onb A2.10] Deve Destravar Seq 22?', type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [4032, 32], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 }, conditions: [{ leftValue: "={{ $('[Onb A2.10] Preparar PASS').item.json.should_unlock_seq22 }}", operator: { type: 'boolean', operation: 'equals' }, rightValue: true }], combinator: 'and' } } },
  http('a210-unlock22', '[Onb A2.10] Destravar Seq 22 se Bloqueada', 4256, -64, 'PATCH', "={{ 'https://api.notion.com/v1/pages/' + $('[Onb A2.10] Preparar PASS').item.json.seq22.page_id }}", "={{ $('[Onb A2.10] Preparar PASS').item.json.seq22_update_body }}"),
  code('a210-restore-pass', '[Onb A2.10] Restaurar Telegram PASS', 4480, 32, restaurarTelegramPass),
  telegram('a210-tg-pass', '[Onb A2.10] Telegram PASS', 4704, 32),
  code('a210-prep-fail', '[Onb A2.10] Preparar FAIL', 3584, 320, prepararFail),
  http('a210-update21-fail', '[Onb A2.10] Atualizar Seq 21 FAIL', 3808, 320, 'PATCH', '={{ "https://api.notion.com/v1/pages/" + $json.seq21_page_id }}', '={{ $json.seq21_update_body }}'),
  http('a210-block22', '[Onb A2.10] Bloquear Seq 22', 4032, 320, 'PATCH', "={{ 'https://api.notion.com/v1/pages/' + $('[Onb A2.10] Preparar FAIL').item.json.seq22.page_id }}", "={{ $('[Onb A2.10] Preparar FAIL').item.json.seq22_update_body }}"),
  code('a210-restore-fail', '[Onb A2.10] Restaurar Telegram FAIL', 4256, 320, restaurarTelegramFail),
  telegram('a210-tg-fail', '[Onb A2.10] Telegram FAIL', 4480, 320),
];

const connections = {
  '[Onb A2.10] Schedule Trigger': { main: [[{ node: '[Onb A2.10] Buscar Etapas', type: 'main', index: 0 }]] },
  '[Onb A2.10] Buscar Etapas': { main: [[{ node: '[Onb A2.10] Filtrar Elegiveis', type: 'main', index: 0 }]] },
  '[Onb A2.10] Filtrar Elegiveis': { main: [[{ node: '[Onb A2.10] Obter Cliente', type: 'main', index: 0 }]] },
  '[Onb A2.10] Obter Cliente': { main: [[{ node: '[Onb A2.10] Filtrar Cliente Ativo', type: 'main', index: 0 }]] },
  '[Onb A2.10] Filtrar Cliente Ativo': { main: [[{ node: '[Onb A2.10] Buscar seq 22 do Cliente', type: 'main', index: 0 }]] },
  '[Onb A2.10] Buscar seq 22 do Cliente': { main: [[{ node: '[Onb A2.10] Buscar Sub-pagina Quadro', type: 'main', index: 0 }]] },
  '[Onb A2.10] Buscar Sub-pagina Quadro': { main: [[{ node: '[Onb A2.10] Preparar Quadro', type: 'main', index: 0 }]] },
  '[Onb A2.10] Preparar Quadro': { main: [[{ node: '[Onb A2.10] Triage Modo', type: 'main', index: 0 }]] },
  '[Onb A2.10] Triage Modo': { main: [[{ node: '[Onb A2.10] Criar Sub-pagina Template', type: 'main', index: 0 }], [{ node: '[Onb A2.10] Ler Conteudo Quadro', type: 'main', index: 0 }]] },
  '[Onb A2.10] Criar Sub-pagina Template': { main: [[{ node: '[Onb A2.10] Montar Telegram Criacao', type: 'main', index: 0 }]] },
  '[Onb A2.10] Montar Telegram Criacao': { main: [[{ node: '[Onb A2.10] Telegram Criacao', type: 'main', index: 0 }]] },
  '[Onb A2.10] Ler Conteudo Quadro': { main: [[{ node: '[Onb A2.10] Triage Conteudo Quadro', type: 'main', index: 0 }]] },
  '[Onb A2.10] Triage Conteudo Quadro': { main: [[{ node: '[Onb A2.10] Roteador Conteudo', type: 'main', index: 0 }]] },
  '[Onb A2.10] Roteador Conteudo': { main: [[{ node: '[Onb A2.10] Montar Telegram Alerta', type: 'main', index: 0 }], [{ node: '[Onb A2.10] Extrair Tabela', type: 'main', index: 0 }]] },
  '[Onb A2.10] Montar Telegram Alerta': { main: [[{ node: '[Onb A2.10] Telegram Alerta', type: 'main', index: 0 }]] },
  '[Onb A2.10] Extrair Tabela': { main: [[{ node: '[Onb A2.10] Avaliar via Gemini', type: 'main', index: 0 }]] },
  '[Onb A2.10] Avaliar via Gemini': { main: [[{ node: '[Onb A2.10] Normalizar Decisao', type: 'main', index: 0 }]] },
  '[Onb A2.10] Normalizar Decisao': { main: [[{ node: '[Onb A2.10] Resultado PASS?', type: 'main', index: 0 }]] },
  '[Onb A2.10] Resultado PASS?': { main: [[{ node: '[Onb A2.10] Preparar PASS', type: 'main', index: 0 }], [{ node: '[Onb A2.10] Preparar FAIL', type: 'main', index: 0 }]] },
  '[Onb A2.10] Preparar PASS': { main: [[{ node: '[Onb A2.10] Atualizar Seq 21 PASS', type: 'main', index: 0 }]] },
  '[Onb A2.10] Atualizar Seq 21 PASS': { main: [[{ node: '[Onb A2.10] Deve Destravar Seq 22?', type: 'main', index: 0 }]] },
  '[Onb A2.10] Deve Destravar Seq 22?': { main: [[{ node: '[Onb A2.10] Destravar Seq 22 se Bloqueada', type: 'main', index: 0 }], [{ node: '[Onb A2.10] Restaurar Telegram PASS', type: 'main', index: 0 }]] },
  '[Onb A2.10] Destravar Seq 22 se Bloqueada': { main: [[{ node: '[Onb A2.10] Restaurar Telegram PASS', type: 'main', index: 0 }]] },
  '[Onb A2.10] Restaurar Telegram PASS': { main: [[{ node: '[Onb A2.10] Telegram PASS', type: 'main', index: 0 }]] },
  '[Onb A2.10] Preparar FAIL': { main: [[{ node: '[Onb A2.10] Atualizar Seq 21 FAIL', type: 'main', index: 0 }]] },
  '[Onb A2.10] Atualizar Seq 21 FAIL': { main: [[{ node: '[Onb A2.10] Bloquear Seq 22', type: 'main', index: 0 }]] },
  '[Onb A2.10] Bloquear Seq 22': { main: [[{ node: '[Onb A2.10] Restaurar Telegram FAIL', type: 'main', index: 0 }]] },
  '[Onb A2.10] Restaurar Telegram FAIL': { main: [[{ node: '[Onb A2.10] Telegram FAIL', type: 'main', index: 0 }]] },
};

const workflow = {
  id: '5WD3ilbH1C7fKiVs',
  name: 'Onb - Gate Validacao Final PASS FAIL',
  active: true,
  isArchived: false,
  nodes,
  connections,
  settings: { executionOrder: 'v1', availableInMCP: true, timezone: 'America/Sao_Paulo' },
  staticData: { 'node:[Onb A2.10] Schedule Trigger': { recurrenceRules: [] } },
  meta: null,
  pinData: {},
};

const outDir = __dirname;
// ADR-19: presença de env vars sensíveis → gera workflow_live.json (NÃO comitar).
// Ausência → gera workflow.json + sandbox_export.json sanitizados (commit-safe).
const HAS_REAL_VALUES = !!process.env.NOTION_CRED_ID || !!process.env.TELEGRAM_CRED_ID || !!process.env.GEMINI_CRED_ID || !!process.env.TELEGRAM_CHAT_ID;
if (HAS_REAL_VALUES) {
  delete workflow.id;
  delete workflow.active;
  delete workflow.isArchived;
  delete workflow.staticData;
  delete workflow.meta;
  delete workflow.pinData;
}
const json = JSON.stringify(workflow, null, 2) + '\n';
if (HAS_REAL_VALUES) {
  fs.writeFileSync(path.join(outDir, 'workflow_live.json'), json, 'utf8');
  console.log('Generated workflow_live.json (DO NOT COMMIT — import no n8n e delete)');
} else {
  fs.writeFileSync(path.join(outDir, 'workflow.json'), json, 'utf8');
  fs.writeFileSync(path.join(outDir, 'sandbox_export.json'), json, 'utf8');
}
