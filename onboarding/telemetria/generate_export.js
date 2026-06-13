const fs = require('fs');
const path = require('path');

const creds = {
  notionApi: { id: '<credential_id_redacted>', name: 'Notion account' },
  telegramApi: { id: '<TELEGRAM_CREDENTIAL_ID_redacted>', name: 'Telegram account' },
};

const contextAssignments = [
  { id: 'execution-id', name: 'execution_id', type: 'string', value: "={{ 'EXEC-TELEMETRIA-' + $execution.id }}" },
  { id: 'tenant-id', name: 'tenant_id', type: 'string', value: 'phi-agencia' },
  { id: 'data-snapshot', name: 'data_snapshot', type: 'string', value: '={{ $now.toISOString().slice(0,10) }}' },
  { id: 'versao-consulta', name: 'versao_consulta', type: 'string', value: 'v1.0' },
];

const metricCode = String.raw`const ctx = $('[Telemetria] Set Contexto').first().json;
const execution_id = ctx.execution_id || ('EXEC-TELEMETRIA-' + $execution.id);
const tenant_id = ctx.tenant_id || 'phi-agencia';
const data_snapshot = ctx.data_snapshot || new Date().toISOString().slice(0, 10);
const versao_consulta = ctx.versao_consulta || 'v1.0';

const all = (name) => {
  try { return $(name).all().map((item) => item.json || {}).filter((page) => !page.archived && !page.is_archived); }
  catch (err) { return []; }
};

const clientes = all('[Telemetria] Buscar Clientes');
const etapas = all('[Telemetria] Buscar Etapas');
const mudancas = all('[Telemetria] Buscar Mudancas Escopo');
const catalogo = all('[Telemetria] Buscar Catalogo');
const adrs = all('[Telemetria] Buscar Decisoes ADR');
const aprendizados = all('[Telemetria] Buscar Aprendizados');
const snapshots = all('[Telemetria] Buscar Snapshots Existentes');

const pickTitle = (page) => {
  for (const prop of Object.values(page.properties || {})) {
    if (prop && prop.type === 'title') return (prop.title || []).map((part) => part.plain_text || '').join('').trim();
  }
  return '';
};
const pickText = (prop) => (prop && prop.rich_text || []).map((part) => part.plain_text || '').join('').trim();
const pickSelect = (prop) => (prop && prop.select && prop.select.name) || (prop && prop.status && prop.status.name) || '';
const pickNumber = (prop) => {
  if (!prop) return null;
  if (typeof prop.number === 'number') return prop.number;
  if (typeof prop.rollup?.number === 'number') return prop.rollup.number;
  if (typeof prop.formula?.number === 'number') return prop.formula.number;
  return null;
};
const pickDate = (prop) => prop && prop.date && prop.date.start ? String(prop.date.start).slice(0, 10) : '';
const daysAgo = (days) => new Date(Date.now() - days * 86400000);
const since = (iso, days) => !!iso && new Date(String(iso).slice(0, 10) + 'T00:00:00-03:00') >= daysAgo(days);
const avg = (values) => {
  const nums = values.filter((value) => typeof value === 'number' && !Number.isNaN(value));
  return nums.length ? Number((nums.reduce((sum, value) => sum + value, 0) / nums.length).toFixed(2)) : 0;
};
const diffDays = (start, end) => {
  if (!start || !end) return null;
  return Math.max(0, Math.round((new Date(end + 'T00:00:00-03:00') - new Date(start + 'T00:00:00-03:00')) / 86400000));
};
const hasAny = (page, needles) => {
  const hay = JSON.stringify(page.properties || {}).toLowerCase();
  return needles.some((needle) => hay.includes(needle));
};

const existingKeys = new Set();
for (const page of snapshots) {
  const props = page.properties || {};
  const data = pickDate(props.Data);
  const chave = pickText(props['Chave da m\u00e9trica']);
  const janela = pickSelect(props.Janela);
  if (data && chave && janela) existingKeys.add(data + '|' + chave + '|' + janela);
}

const metricas = [];
const add = (area, chave, janela, valor_num, valor_txt, fonte) => {
  metricas.push({
    area,
    chave,
    janela,
    valor_num: typeof valor_num === 'number' && !Number.isNaN(valor_num) ? valor_num : null,
    valor_txt: valor_txt == null ? '' : String(valor_txt),
    fonte,
    data_snapshot,
    execution_id,
    tenant_id,
    versao_consulta,
    idempotency_key: data_snapshot + '|' + chave + '|' + janela,
    titulo: data_snapshot + ' - ' + area + ' - ' + chave,
  });
};

const activeCliente = (page) => pickSelect(page.properties?.Status) !== 'Arquivado' && pickSelect(page.properties?.Status) !== 'Cancelado';
const activeEtapa = (page) => pickSelect(page.properties?.Status) !== 'Arquivado' && pickSelect(page.properties?.Status) !== 'Pulado (com justificativa)';
const clientesAtivos = clientes.filter(activeCliente);
const etapasAtivas = etapas.filter(activeEtapa);
const concluidas = etapas.filter((page) => pickSelect(page.properties?.Status) === 'Conclu\u00eddo');
const abertas = etapasAtivas.filter((page) => !['Conclu\u00eddo', 'Pulado (com justificativa)'].includes(pickSelect(page.properties?.Status)));
const atrasadas = abertas.filter((page) => {
  const due = pickDate(page.properties?.['Data prevista']);
  return due && due < data_snapshot;
});
const temposOnb = clientesAtivos.map((page) => diffDays(pickDate(page.properties?.['Data de in\u00edcio']), pickDate(page.properties?.['Data real 1\u00aa entrega']))).filter((value) => value != null);
const telegramFailures = [...clientes, ...etapas].filter((page) => hasAny(page, ['telegram: falhou', 'telegram falhou', 'status telegram: falhou']));
const evolutionFailures = [...clientes, ...etapas].filter((page) => hasAny(page, ['evolution: falhou', 'evolution falhou', 'status evolution: falhou']));
const gateItems = etapas.filter((page) => /validacao final|valida\\u00e7\\u00e3o final|pass\/fail|gate/i.test(pickTitle(page)));

add('Onboarding', 'onb.briefings_intake', 'D-1', clientes.filter((page) => since(page.created_time || page.createdTime, 1)).length, '', 'DB Clientes (created_time >= D-1)');
add('Onboarding', 'onb.classificacao_aprovado', 'D-30', clientes.filter((page) => since(page.created_time || page.createdTime, 30) && ['Aprovado', 'Aprovado com lacunas'].includes(pickSelect(page.properties?.['Classifica\u00e7\u00e3o do briefing']))).length, '', 'DB Clientes (Classificacao do briefing, D-30)');
add('Onboarding', 'onb.classificacao_rejeitado', 'D-30', clientes.filter((page) => since(page.created_time || page.createdTime, 30) && ['Insuficiente', 'Rejeitado'].includes(pickSelect(page.properties?.['Classifica\u00e7\u00e3o do briefing']))).length, '', 'DB Clientes (Classificacao do briefing, D-30)');
add('Onboarding', 'onb.etapas_concluidas', 'Snapshot', concluidas.length, '', 'DB Etapas (Status = Concluido)');
add('Onboarding', 'onb.etapas_abertas', 'Snapshot', abertas.length, '', 'DB Etapas (Status aberto)');
add('Onboarding', 'onb.etapas_atrasadas', 'Snapshot', atrasadas.length, '', 'DB Etapas (Data prevista < hoje e Status aberto)');
add('Onboarding', 'onb.falhas_telegram', 'D-7', telegramFailures.filter((page) => since(page.last_edited_time || page.created_time || page.createdTime, 7)).length, '', 'Observacoes/status contendo Telegram falhou, D-7');
add('Onboarding', 'onb.falhas_evolution', 'D-7', evolutionFailures.filter((page) => since(page.last_edited_time || page.created_time || page.createdTime, 7)).length, '', 'Observacoes/status contendo Evolution falhou, D-7');
add('Onboarding', 'onb.gate_pass', 'D-7', gateItems.filter((page) => since(page.last_edited_time || page.created_time || page.createdTime, 7) && hasAny(page, ['pass'])).length, '', 'Etapas gate PASS, D-7');
add('Onboarding', 'onb.gate_fail', 'D-7', gateItems.filter((page) => since(page.last_edited_time || page.created_time || page.createdTime, 7) && hasAny(page, ['fail'])).length, '', 'Etapas gate FAIL, D-7');
add('Onboarding', 'onb.tempo_total_onboarding_dias', 'D-30', avg(temposOnb), '', 'DB Clientes (Data de inicio ate Data real 1a entrega)');

add('Curador', 'cur.mes_abertas', 'Snapshot', mudancas.filter((page) => ['Aberta', 'Em an\u00e1lise', 'Q&A com humano', 'Diff proposto'].includes(pickSelect(page.properties?.Estado))).length, '', 'DB Mudancas de Escopo (Estado aberto)');
add('Curador', 'cur.mes_aprovadas', 'D-30', mudancas.filter((page) => since(page.last_edited_time || page.created_time || page.createdTime, 30) && ['Aprovada', 'Aplicada'].includes(pickSelect(page.properties?.Estado))).length, '', 'DB Mudancas de Escopo (aprovadas D-30)');
add('Curador', 'cur.tempo_medio_aplicacao_dias', 'D-30', 0, 'sem campo de data de aplicacao no schema atual', 'DB Mudancas de Escopo (campo ausente no schema)');
add('Curador', 'cur.rodadas_qa_medias', 'D-30', avg(mudancas.filter((page) => since(page.last_edited_time || page.created_time || page.createdTime, 30)).map((page) => pickNumber(page.properties?.['Rodadas Q&A']))), '', 'DB Mudancas de Escopo (Rodadas Q&A D-30)');

add('Global', 'glb.artefatos_vivos', 'Snapshot', catalogo.filter((page) => pickSelect(page.properties?.Estado) === 'Vivo').length, '', 'DB Catalogo (Estado = Vivo)');
add('Global', 'glb.adrs_aceitos', 'Snapshot', adrs.filter((page) => pickSelect(page.properties?.Status) === 'Aceito').length, '', 'DB Decisoes/ADR (Status = Aceito)');
add('Global', 'glb.aprendizados_aplicados', 'Snapshot', aprendizados.filter((page) => ['Aplicado', 'Aplicados'].includes(pickSelect(page.properties?.Status) || pickSelect(page.properties?.Estado))).length, '', 'DB Aprendizados (Status/Estado aplicado)');
add('Global', 'glb.workflows_ativos', 'Snapshot', catalogo.filter((page) => pickSelect(page.properties?.Tipo) === 'Workflow n8n' && pickSelect(page.properties?.Estado) === 'Vivo').length, '', 'DB Catalogo (Tipo Workflow n8n, Estado Vivo)');

const toCreate = metricas.filter((m) => !existingKeys.has(m.idempotency_key));
const itemsParaCriar = toCreate.map((m) => ({ json: { ...m, metricas_do_dia: metricas, linhas_novas: toCreate.length } }));
if (itemsParaCriar.length === 0) {
  itemsParaCriar.push({ json: { sentinel: true, metricas_do_dia: metricas, linhas_novas: 0, data_snapshot, execution_id, tenant_id, versao_consulta } });
}
return itemsParaCriar;`;

const digestCode = String.raw`const escapeHtml = (value) => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const metricItems = $('[Telemetria] Calcular Metricas').all().map((item) => item.json || {});
const first = metricItems[0] || $json || {};
const metricas = first.metricas_do_dia || metricItems;
const data_snapshot = first.data_snapshot || new Date().toISOString().slice(0, 10);
const byKey = new Map(metricas.map((m) => [m.chave, m]));
const n = (key) => {
  const value = byKey.get(key)?.valor_num;
  return typeof value === 'number' ? value : 0;
};
const txt = (key) => byKey.get(key)?.valor_txt || '';
const alert = (value) => value > 0 ? ' ALERTA' : '';
const linhas = [
  '<b>PHI Telemetria - ' + escapeHtml(data_snapshot) + ' 08:30</b>',
  '',
  '<b>Onboarding</b> (prod desde 2026-05-29)',
  '- Briefings: D-1: ' + n('onb.briefings_intake'),
  '- A2.3 Class.: ' + n('onb.classificacao_aprovado') + ' Aprov | ' + n('onb.classificacao_rejeitado') + ' Rej (D-30)',
  '- Etapas: ' + n('onb.etapas_concluidas') + ' concl | ' + n('onb.etapas_abertas') + ' abertas | ' + n('onb.etapas_atrasadas') + ' atrasadas',
  '- Falhas Telegram (D-7): ' + n('onb.falhas_telegram') + alert(n('onb.falhas_telegram')),
  '- Falhas Evolution (D-7): ' + n('onb.falhas_evolution') + alert(n('onb.falhas_evolution')),
  '- A2.10 Gate: ' + n('onb.gate_pass') + ' PASS | ' + n('onb.gate_fail') + ' FAIL (D-7)',
  '- Tempo medio onboarding: ' + n('onb.tempo_total_onboarding_dias') + ' dias (D-30)',
  '',
  '<b>Curador</b>',
  '- MEs: ' + n('cur.mes_abertas') + ' abertas | ' + n('cur.mes_aprovadas') + ' aprovadas (D-30)',
  '- Tempo medio Aberta -> Aplicada: ' + n('cur.tempo_medio_aplicacao_dias') + ' dias' + (txt('cur.tempo_medio_aplicacao_dias') ? ' (' + escapeHtml(txt('cur.tempo_medio_aplicacao_dias')) + ')' : ''),
  '- Rodadas Q&A medias: ' + n('cur.rodadas_qa_medias'),
  '',
  '<b>Global</b>',
  '- Catalogo: ' + n('glb.artefatos_vivos') + ' Vivos',
  '- ADRs: ' + n('glb.adrs_aceitos') + ' Aceitos',
  '- Aprendizados: ' + n('glb.aprendizados_aplicados') + ' Aplicados',
  '- Workflows ativos: ' + n('glb.workflows_ativos'),
  '',
  '<a href="https://www.notion.so/0e1cffdef0654580828d5f1478c50077">DB Snapshots</a>'
];
return [{ json: { digest_html: linhas.join('\n'), data_snapshot, linhas_novas: first.linhas_novas || metricItems.length } }];`;

const statusCode = String.raw`const ctx = $('[Telemetria] Set Contexto').first().json;
return [{ json: { status: 'ok', execution_id: ctx.execution_id, tenant_id: ctx.tenant_id, data_snapshot: ctx.data_snapshot, versao_consulta: ctx.versao_consulta } }];`;

const notionRead = (id, name, db) => ({
  id,
  name,
  type: 'n8n-nodes-base.notion',
  typeVersion: 2.2,
  position: [0, 0],
  executeOnce: true,
  alwaysOutputData: true,
  parameters: {
    resource: 'databasePage',
    operation: 'getAll',
    databaseId: { __rl: true, mode: 'list', value: db },
    returnAll: true,
    simple: false,
    filterType: 'none',
  },
  credentials: { notionApi: creds.notionApi },
});

const nodes = [
  {
    id: 'telemetria-schedule',
    name: '[Telemetria] Schedule Trigger',
    type: 'n8n-nodes-base.scheduleTrigger',
    typeVersion: 1.3,
    position: [0, 0],
    parameters: { rule: { interval: [{ field: 'days', daysInterval: 1, triggerAtHour: 8, triggerAtMinute: 30 }] } },
  },
  {
    id: 'telemetria-contexto',
    name: '[Telemetria] Set Contexto',
    type: 'n8n-nodes-base.set',
    typeVersion: 3.4,
    position: [224, 0],
    parameters: { mode: 'manual', assignments: { assignments: contextAssignments }, options: {} },
  },
  notionRead('telemetria-clientes', '[Telemetria] Buscar Clientes', '04e34a62624b484cbda546604564b88c'),
  notionRead('telemetria-etapas', '[Telemetria] Buscar Etapas', '6eb4565b4f1d498c8b2978e0c80880fd'),
  notionRead('telemetria-mudancas', '[Telemetria] Buscar Mudancas Escopo', 'bb56ddca-dfad-4aa5-9227-3cf86207bc40'),
  notionRead('telemetria-catalogo', '[Telemetria] Buscar Catalogo', '07623177-4d75-4870-bdc0-4ecd365392a7'),
  notionRead('telemetria-adrs', '[Telemetria] Buscar Decisoes ADR', '237a5e127f5142eeb9c04ddfb16b6400'),
  notionRead('telemetria-aprendizados', '[Telemetria] Buscar Aprendizados', 'aa5d49b2-c2f6-40bc-b883-5cd350a982c7'),
  notionRead('telemetria-snapshots-existentes', '[Telemetria] Buscar Snapshots Existentes', '32404398-6751-4bbd-be28-4ad591e22bf7'),
  {
    id: 'telemetria-merge-pre-calcular',
    name: '[Telemetria] Merge Pre-Calcular',
    type: 'n8n-nodes-base.merge',
    typeVersion: 3,
    position: [560, 0],
    parameters: { mode: 'append', numberInputs: 7 },
  },
  {
    id: 'telemetria-calcular',
    name: '[Telemetria] Calcular Metricas',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [720, 0],
    parameters: { mode: 'runOnceForAllItems', jsCode: metricCode },
  },
  {
    id: 'telemetria-if-tem-novas',
    name: '[Telemetria] IF Tem Novas Linhas',
    type: 'n8n-nodes-base.if',
    typeVersion: 2,
    position: [832, 0],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict' },
        conditions: [
          {
            id: 'cond-linhas-novas',
            leftValue: '={{ $json.linhas_novas }}',
            rightValue: 0,
            operator: { type: 'number', operation: 'gt' },
          },
        ],
        combinator: 'and',
      },
    },
  },
  {
    id: 'telemetria-criar-snapshot',
    name: '[Telemetria] Criar Snapshot',
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position: [944, 0],
    parameters: {
      resource: 'databasePage',
      operation: 'create',
      databaseId: { __rl: true, mode: 'list', value: '32404398-6751-4bbd-be28-4ad591e22bf7' },
      title: '={{ $json.titulo }}',
      simple: false,
      propertiesUi: {
        propertyValues: [
          { key: 'Data|date', date: '={{ $json.data_snapshot }}' },
          { key: 'Area|select', selectValue: '={{ $json.area }}' },
          { key: 'Chave da m\u00e9trica|rich_text', textContent: '={{ $json.chave }}' },
          { key: 'Janela|select', selectValue: '={{ $json.janela }}' },
          { key: 'Valor numero|number', numberValue: '={{ $json.valor_num }}' },
          { key: 'Valor texto|rich_text', textContent: '={{ $json.valor_txt }}' },
          { key: 'Fonte|rich_text', textContent: '={{ $json.fonte }}' },
          { key: 'Vers\u00e3o da consulta|rich_text', textContent: '={{ $json.versao_consulta }}' },
          { key: 'execution_id|rich_text', textContent: '={{ $json.execution_id }}' },
          { key: 'tenant_id|rich_text', textContent: '={{ $json.tenant_id }}' },
        ],
      },
      options: {},
    },
    credentials: { notionApi: creds.notionApi },
  },
  {
    id: 'telemetria-merge-pos-snapshot',
    name: '[Telemetria] Merge Pos-Snapshot',
    type: 'n8n-nodes-base.merge',
    typeVersion: 3,
    position: [1056, 120],
    parameters: { mode: 'append' },
  },
  {
    id: 'telemetria-digest',
    name: '[Telemetria] Montar Digest HTML',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1168, 0],
    parameters: { mode: 'runOnceForAllItems', jsCode: digestCode },
  },
  {
    id: 'telemetria-telegram',
    name: '[Telemetria] Enviar Telegram',
    type: 'n8n-nodes-base.telegram',
    typeVersion: 1.2,
    position: [1392, 0],
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: '<TELEGRAM_CHAT_ID_redacted>',
      text: '={{ $json.digest_html }}',
      additionalFields: { parse_mode: 'HTML', appendAttribution: false },
    },
    credentials: { telegramApi: creds.telegramApi },
  },
  {
    id: 'telemetria-status',
    name: '[Telemetria] Set Status Final',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [1616, 0],
    parameters: { mode: 'runOnceForAllItems', jsCode: statusCode },
  },
];

const positions = {
  '[Telemetria] Buscar Clientes': [448, -360],
  '[Telemetria] Buscar Etapas': [448, -240],
  '[Telemetria] Buscar Mudancas Escopo': [448, -120],
  '[Telemetria] Buscar Catalogo': [448, 0],
  '[Telemetria] Buscar Decisoes ADR': [448, 120],
  '[Telemetria] Buscar Aprendizados': [448, 240],
  '[Telemetria] Buscar Snapshots Existentes': [448, 360],
};
for (const node of nodes) {
  if (positions[node.name]) node.position = positions[node.name];
}

const readNames = [
  '[Telemetria] Buscar Clientes',
  '[Telemetria] Buscar Etapas',
  '[Telemetria] Buscar Mudancas Escopo',
  '[Telemetria] Buscar Catalogo',
  '[Telemetria] Buscar Decisoes ADR',
  '[Telemetria] Buscar Aprendizados',
  '[Telemetria] Buscar Snapshots Existentes',
];

const workflow = {
  id: '<workflow_id_pending_review>',
  name: 'WF-DOC-Telemetria-Diaria',
  active: false,
  isArchived: false,
  tags: [{ name: 'phi' }, { name: 'documentacao' }, { name: 'telemetria' }],
  nodes,
  connections: {
    '[Telemetria] Schedule Trigger': { main: [[{ node: '[Telemetria] Set Contexto', type: 'main', index: 0 }]] },
    '[Telemetria] Set Contexto': { main: [readNames.map((node) => ({ node, type: 'main', index: 0 }))] },
    ...Object.fromEntries(readNames.map((name, index) => [name, { main: [[{ node: '[Telemetria] Merge Pre-Calcular', type: 'main', index }]] }])),
    '[Telemetria] Merge Pre-Calcular': { main: [[{ node: '[Telemetria] Calcular Metricas', type: 'main', index: 0 }]] },
    '[Telemetria] Calcular Metricas': { main: [[{ node: '[Telemetria] IF Tem Novas Linhas', type: 'main', index: 0 }]] },
    '[Telemetria] IF Tem Novas Linhas': {
      main: [
        [{ node: '[Telemetria] Criar Snapshot', type: 'main', index: 0 }],
        [{ node: '[Telemetria] Merge Pos-Snapshot', type: 'main', index: 1 }],
      ],
    },
    '[Telemetria] Criar Snapshot': { main: [[{ node: '[Telemetria] Merge Pos-Snapshot', type: 'main', index: 0 }]] },
    '[Telemetria] Merge Pos-Snapshot': { main: [[{ node: '[Telemetria] Montar Digest HTML', type: 'main', index: 0 }]] },
    '[Telemetria] Montar Digest HTML': { main: [[{ node: '[Telemetria] Enviar Telegram', type: 'main', index: 0 }]] },
    '[Telemetria] Enviar Telegram': { main: [[{ node: '[Telemetria] Set Status Final', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1', availableInMCP: true, timezone: 'America/Sao_Paulo' },
  staticData: { 'node:[Telemetria] Schedule Trigger': { recurrenceRules: [] } },
  meta: null,
  pinData: {},
};

const outDir = __dirname;
const json = JSON.stringify(workflow, null, 2) + '\n';
fs.writeFileSync(path.join(outDir, 'workflow.json'), json, 'utf8');
fs.writeFileSync(path.join(outDir, 'sandbox_export.json'), json, 'utf8');
