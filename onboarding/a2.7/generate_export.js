const fs = require('fs');
const path = require('path');

const aggregateCode = String.raw`const activeStatuses = new Set(['Em andamento', 'N\u00e3o iniciado', 'Bloqueado']);
const clienteItems = $('[Onb A2.7] Buscar Clientes Ativos').all();
const etapaItems = $('[Onb A2.7] Buscar Etapas').all();
const now = new Date();
const brNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
const todayBr = new Date(brNow);
todayBr.setHours(0, 0, 0, 0);
const geradoEm = brNow.toLocaleString('sv-SE', { timeZone: 'America/Sao_Paulo' }).replace(' ', 'T') + '-03:00';
const pickTitle = (page) => {
  for (const prop of Object.values(page.properties || {})) {
    if (prop?.type === 'title') return (prop.title || []).map((item) => item.plain_text || '').join('').trim();
  }
  return '';
};
const pickSelect = (prop) => prop?.select?.name || prop?.status?.name || '';
const pickNumber = (prop) => prop?.number ?? null;
const pickDate = (prop) => prop?.date?.start ? String(prop.date.start).slice(0, 10) : '';
const pickPlainText = (prop) => (prop?.rich_text || []).map((item) => item.plain_text || '').join('').trim();
const dayDiff = (dateIso) => {
  const due = new Date(dateIso + 'T00:00:00-03:00');
  return Math.max(0, Math.floor((todayBr.getTime() - due.getTime()) / 86400000));
};
const clientesById = new Map();
const clientesAtivos = [];
const bloqueios = [];
for (const item of clienteItems) {
  const page = item.json || {};
  if (page.archived) continue;
  const props = page.properties || {};
  const status = pickSelect(props.Status);
  const nome = pickTitle(page);
  if (!activeStatuses.has(status)) continue;
  const cliente = {
    nome,
    status,
    data_inicio: pickDate(props['Data in\u00edcio']) || pickDate(props['Data inicio']) || pickDate(props['Data de in\u00edcio']) || '',
    etapas_concluidas: pickNumber(props['Etapas conclu\u00eddas']) ?? pickNumber(props['Etapas concluidas']) ?? 0,
    etapas_atrasadas_count: 0,
    page_id: page.id,
  };
  clientesById.set(page.id, cliente);
  clientesAtivos.push(cliente);
  if (status === 'Bloqueado') {
    bloqueios.push({ tipo: 'cliente', nome, motivo_se_houver: pickPlainText(props['Motivo']) || pickPlainText(props['Observa\u00e7\u00f5es']) || '', page_id: page.id });
  }
}
const etapasAtrasadas = [];
for (const item of etapaItems) {
  const page = item.json || {};
  if (page.archived) continue;
  const props = page.properties || {};
  const status = pickSelect(props.Status);
  const nome = pickTitle(page);
  const clienteRelation = props.Cliente?.relation || [];
  const clienteId = clienteRelation[0]?.id || '';
  const cliente = clientesById.get(clienteId);
  if (status === 'Bloqueado') {
    bloqueios.push({ tipo: 'etapa', nome, motivo_se_houver: pickPlainText(props['Motivo']) || pickPlainText(props['Observa\u00e7\u00f5es']) || '', page_id: page.id });
  }
  const due = pickDate(props['Data prevista']);
  if (status === 'Pendente' && due && cliente && new Date(due + 'T00:00:00-03:00') < todayBr) {
    cliente.etapas_atrasadas_count += 1;
    etapasAtrasadas.push({ categoria: 'etapa_atrasada', cliente_nome: cliente.nome, etapa_nome: nome, sequencia: pickNumber(props['Sequ\u00eancia']), data_prevista: due, dias_atrasada: dayDiff(due), page_id: page.id });
  }
}
return [{ json: { payload: { gerado_em: geradoEm, contagens: { clientes_ativos: clientesAtivos.length, etapas_atrasadas: etapasAtrasadas.length, bloqueios: bloqueios.length }, clientes_ativos: clientesAtivos, etapas_atrasadas: etapasAtrasadas, bloqueios } } }];`;

const fallbackCode = String.raw`const payload = $('[Onb A2.7] Filtrar e Agregar').first().json.payload || {};
const contagens = payload.contagens || {};
const atrasadas = payload.etapas_atrasadas || [];
const bloqueios = payload.bloqueios || [];
const linhas = ['[Digest A2.7 - Gemini indisponivel]', 'Clientes ativos: ' + (contagens.clientes_ativos ?? 0), 'Etapas atrasadas: ' + (contagens.etapas_atrasadas ?? 0), 'Bloqueios: ' + (contagens.bloqueios ?? 0)];
const detalhes = [];
for (const etapa of atrasadas.slice(0, 8)) detalhes.push('etapa_atrasada: ' + (etapa.cliente_nome || '-') + ' - ' + (etapa.etapa_nome || '-') + ' - ' + (etapa.dias_atrasada || 0) + 'd');
for (const bloqueio of bloqueios.slice(0, 8)) detalhes.push('bloqueio_' + (bloqueio.tipo || 'item') + ': ' + (bloqueio.nome || '-') + ' ' + (bloqueio.motivo_se_houver ? '- ' + bloqueio.motivo_se_houver : ''));
linhas.push('Detalhe: ' + (detalhes.length ? detalhes.join('\n') : 'sem detalhes criticos'));
return [{ json: { text: linhas.join('\n'), payload } }];`;

const normalizeCode = String.raw`const out = [];
for (const item of $input.all()) {
  const data = item.json || {};
  const text = String(data.text || data.mergedResponse || data.content?.parts?.map((part) => part.text || '').join('') || data.content || '').trim();
  out.push({ json: { ...data, text } });
}
return out;`;

const systemPrompt = 'Voce e o assistente operacional da agencia. Gere digest diario CURTO e OBJETIVO em portugues brasileiro, formato Telegram. Use bullets simples (-). Sem markdown pesado (sem **negrito**, sem links inline). Emojis sobrios e poucos (alerta e ok). Estrutura fixa: 1) Resumo numerico, 2) Clientes com etapas atrasadas (so se houver), 3) Bloqueios ativos (so se houver), 4) Acao recomendada do dia (uma frase). Se nao houver onboarding ativo, diga apenas isso. NUNCA invente dados que nao estao no payload.';

const nodeBase = {
  notionApi: { id: '<credential_id_redacted>', name: 'Notion account' },
  telegramApi: { id: '<TELEGRAM_CREDENTIAL_ID_redacted>', name: 'Telegram account' },
  googlePalmApi: { id: 'cZNPIzF5ZCMrpnDr', name: 'Google Gemini(PaLM) Api account' },
};

const workflow = {
  id: 'VhaI01i4T6VBud1V',
  name: 'Onb - Digest Diario Onboarding',
  active: true,
  isArchived: false,
  nodes: [
    { id: 'a27-schedule', name: '[Onb A2.7] Schedule Trigger', type: 'n8n-nodes-base.scheduleTrigger', typeVersion: 1.3, position: [0, 0], parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 9, triggerAtMinute: 0 }] } } },
    { id: 'a27-clientes', name: '[Onb A2.7] Buscar Clientes Ativos', type: 'n8n-nodes-base.notion', typeVersion: 2.2, position: [224, 0], alwaysOutputData: true, parameters: { resource: 'databasePage', operation: 'getAll', databaseId: { __rl: true, mode: 'list', value: '04e34a62624b484cbda546604564b88c' }, returnAll: true, simple: false, filterType: 'none' }, credentials: { notionApi: nodeBase.notionApi } },
    { id: 'a27-etapas', name: '[Onb A2.7] Buscar Etapas', type: 'n8n-nodes-base.notion', typeVersion: 2.2, position: [448, 0], executeOnce: true, alwaysOutputData: true, parameters: { resource: 'databasePage', operation: 'getAll', databaseId: { __rl: true, mode: 'list', value: '6eb4565b4f1d498c8b2978e0c80880fd' }, returnAll: true, simple: false, filterType: 'none' }, credentials: { notionApi: nodeBase.notionApi } },
    { id: 'a27-agregar', name: '[Onb A2.7] Filtrar e Agregar', type: 'n8n-nodes-base.code', typeVersion: 2, position: [672, 0], parameters: { mode: 'runOnceForAllItems', jsCode: aggregateCode } },
    { id: 'a27-gemini', name: '[Onb A2.7] Gerar Digest Gemini', type: '@n8n/n8n-nodes-langchain.googleGemini', typeVersion: 1.2, position: [896, 0], parameters: { resource: 'text', operation: 'message', modelId: { __rl: true, mode: 'list', value: 'models/gemini-2.5-flash' }, messages: { values: [{ role: 'user', content: '={{ JSON.stringify($json.payload) }}' }] }, simplify: true, options: { includeMergedResponse: true, systemMessage: systemPrompt, temperature: 0.2, maxOutputTokens: 1024 } }, credentials: { googlePalmApi: nodeBase.googlePalmApi }, continueOnFail: true },
    { id: 'a27-normalizar-gemini', name: '[Onb A2.7] Normalizar Digest', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1008, 0], parameters: { mode: 'runOnceForAllItems', jsCode: normalizeCode } },
    { id: 'a27-if', name: '[Onb A2.7] Tem Resposta?', type: 'n8n-nodes-base.if', typeVersion: 2.3, position: [1120, 0], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: '={{ (($json.text || $json.content || \"\") + \"\").trim() }}', operator: { type: 'string', operation: 'notEmpty' }, rightValue: '' }], combinator: 'and' } } },
    { id: 'a27-fallback', name: '[Onb A2.7] Montar Fallback', type: 'n8n-nodes-base.code', typeVersion: 2, position: [1344, 160], parameters: { mode: 'runOnceForAllItems', jsCode: fallbackCode } },
    { id: 'a27-telegram', name: '[Onb A2.7] Enviar Telegram Olavo', type: 'n8n-nodes-base.telegram', typeVersion: 1.2, position: [1568, 0], parameters: { resource: 'message', operation: 'sendMessage', chatId: '<TELEGRAM_CHAT_ID_redacted>', text: "={{ String($json.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}", additionalFields: { parse_mode: 'HTML', appendAttribution: false } }, credentials: { telegramApi: nodeBase.telegramApi }, continueOnFail: true },
  ],
  connections: {
    '[Onb A2.7] Schedule Trigger': { main: [[{ node: '[Onb A2.7] Buscar Clientes Ativos', type: 'main', index: 0 }]] },
    '[Onb A2.7] Buscar Clientes Ativos': { main: [[{ node: '[Onb A2.7] Buscar Etapas', type: 'main', index: 0 }]] },
    '[Onb A2.7] Buscar Etapas': { main: [[{ node: '[Onb A2.7] Filtrar e Agregar', type: 'main', index: 0 }]] },
    '[Onb A2.7] Filtrar e Agregar': { main: [[{ node: '[Onb A2.7] Gerar Digest Gemini', type: 'main', index: 0 }]] },
    '[Onb A2.7] Gerar Digest Gemini': { main: [[{ node: '[Onb A2.7] Normalizar Digest', type: 'main', index: 0 }]] },
    '[Onb A2.7] Normalizar Digest': { main: [[{ node: '[Onb A2.7] Tem Resposta?', type: 'main', index: 0 }]] },
    '[Onb A2.7] Tem Resposta?': { main: [[{ node: '[Onb A2.7] Enviar Telegram Olavo', type: 'main', index: 0 }], [{ node: '[Onb A2.7] Montar Fallback', type: 'main', index: 0 }]] },
    '[Onb A2.7] Montar Fallback': { main: [[{ node: '[Onb A2.7] Enviar Telegram Olavo', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1', availableInMCP: true, timezone: 'America/Sao_Paulo' },
  staticData: { 'node:[Onb A2.7] Schedule Trigger': { recurrenceRules: [] } },
  meta: null,
  pinData: {},
};

const outDir = __dirname;
const json = JSON.stringify(workflow, null, 2) + '\n';
fs.writeFileSync(path.join(outDir, 'workflow.json'), json, 'utf8');
fs.writeFileSync(path.join(outDir, 'sandbox_export.json'), json, 'utf8');

const sdkCode = `import { workflow, node, trigger, ifElse, newCredential, expr } from '@n8n/workflow-sdk';

const aggregateCode = ${JSON.stringify(aggregateCode)};
const fallbackCode = ${JSON.stringify(fallbackCode)};
const systemPrompt = ${JSON.stringify(systemPrompt)};

const scheduleTrigger = trigger({ type: 'n8n-nodes-base.scheduleTrigger', version: 1.3, config: { name: '[Onb A2.7] Schedule Trigger', position: [0, 0], parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 9, triggerAtMinute: 0 }] } } }, output: [{}] });
const buscarClientes = node({ type: 'n8n-nodes-base.notion', version: 2.2, config: { name: '[Onb A2.7] Buscar Clientes Ativos', position: [224, 0], parameters: { resource: 'databasePage', operation: 'getAll', databaseId: { __rl: true, mode: 'list', value: '04e34a62624b484cbda546604564b88c' }, returnAll: true, simple: false, filterType: 'none' }, credentials: { notionApi: newCredential('Notion account') } }, output: [{ id: 'cliente-page-id', properties: {}, archived: false }] });
const buscarEtapas = node({ type: 'n8n-nodes-base.notion', version: 2.2, config: { name: '[Onb A2.7] Buscar Etapas', position: [448, 0], executeOnce: true, parameters: { resource: 'databasePage', operation: 'getAll', databaseId: { __rl: true, mode: 'list', value: '6eb4565b4f1d498c8b2978e0c80880fd' }, returnAll: true, simple: false, filterType: 'none' }, credentials: { notionApi: newCredential('Notion account') } }, output: [{ id: 'etapa-page-id', properties: {}, archived: false }] });
const filtrarAgregar = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: '[Onb A2.7] Filtrar e Agregar', position: [672, 0], parameters: { mode: 'runOnceForAllItems', jsCode: aggregateCode } }, output: [{ payload: { gerado_em: '2026-06-01T09:00:00-03:00', contagens: { clientes_ativos: 0, etapas_atrasadas: 0, bloqueios: 0 }, clientes_ativos: [], etapas_atrasadas: [], bloqueios: [] } }] });
const gerarGemini = node({ type: '@n8n/n8n-nodes-langchain.googleGemini', version: 1.2, config: { name: '[Onb A2.7] Gerar Digest Gemini', position: [896, 0], continueOnFail: true, parameters: { resource: 'text', operation: 'message', modelId: { __rl: true, mode: 'list', value: 'models/gemini-2.5-flash' }, messages: { values: [{ role: 'user', content: expr('{{ JSON.stringify($json.payload) }}') }] }, simplify: true, options: { includeMergedResponse: true, systemMessage: systemPrompt, temperature: 0.2, maxOutputTokens: 1024 } }, credentials: { googlePalmApi: { id: 'cZNPIzF5ZCMrpnDr', name: 'Google Gemini(PaLM) Api account' } } }, output: [{ text: 'Digest gerado' }] });
const temResposta = ifElse({ version: 2.3, config: { name: '[Onb A2.7] Tem Resposta?', position: [1120, 0], parameters: { conditions: { options: { caseSensitive: true, leftValue: '', typeValidation: 'loose', version: 2 }, conditions: [{ leftValue: expr('{{ (($json.text || $json.content || "") + "").trim() }}'), operator: { type: 'string', operation: 'notEmpty' }, rightValue: '' }], combinator: 'and' } } }, output: [{ text: 'Digest gerado' }] });
const montarFallback = node({ type: 'n8n-nodes-base.code', version: 2, config: { name: '[Onb A2.7] Montar Fallback', position: [1344, 160], parameters: { mode: 'runOnceForAllItems', jsCode: fallbackCode } }, output: [{ text: '[Digest A2.7 - Gemini indisponivel]\\nClientes ativos: 0\\nEtapas atrasadas: 0\\nBloqueios: 0\\nDetalhe: sem detalhes criticos' }] });
const enviarTelegram = node({ type: 'n8n-nodes-base.telegram', version: 1.2, config: { name: '[Onb A2.7] Enviar Telegram Olavo', position: [1568, 0], parameters: { resource: 'message', operation: 'sendMessage', chatId: '930549271', text: expr("{{ String($json.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}"), additionalFields: { parse_mode: 'HTML' } }, credentials: { telegramApi: newCredential('Telegram account') }, continueOnFail: true }, output: [{ ok: true, result: { message_id: 1, text: 'Digest gerado' } }] });

export default workflow('onb-a2-7-digest-diario', 'Onb - Digest Diario Onboarding').add(scheduleTrigger).to(buscarClientes).to(buscarEtapas).to(filtrarAgregar).to(gerarGemini).to(temResposta.onTrue(enviarTelegram).onFalse(montarFallback.to(enviarTelegram)));
`;
fs.writeFileSync(path.join(outDir, 'workflow_sdk_compiled.js'), sdkCode, 'utf8');
