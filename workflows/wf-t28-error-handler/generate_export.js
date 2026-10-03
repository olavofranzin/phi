const fs = require('fs');
const path = require('path');

const fromEnvOrRedacted = (envName, redacted) => {
  const value = process.env[envName];
  return (typeof value === 'string' && value.length > 0) ? value : redacted;
};

const creds = {
  googleApi: { id: fromEnvOrRedacted('GOOGLE_BIGQUERY_CRED_ID', '<GOOGLE_BIGQUERY_CREDENTIAL_ID_redacted>'), name: 'Google BigQuery account' },
  notionApi: { id: fromEnvOrRedacted('NOTION_CRED_ID', '<credential_id_redacted>'), name: 'Notion account' },
  telegramApi: { id: fromEnvOrRedacted('TELEGRAM_CRED_ID', '<TELEGRAM_CREDENTIAL_ID_redacted>'), name: 'Telegram account' },
};

const TELEGRAM_CHAT_ID = fromEnvOrRedacted('TELEGRAM_CHAT_ID', '<TELEGRAM_CHAT_ID_redacted>');
const PROJECT_ID = fromEnvOrRedacted('GOOGLE_BIGQUERY_PROJECT_ID', 'project-0e7c58d4-656f-49e8-807');
const DB_DEMANDAS_PAGE = 'a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b';
const DB_DEMANDAS_NAME = 'PHI - Demandas';

const setContextCode = String.raw`const severityRank = { warn: 10, error: 50, critical: 100 };
const normalizeSeverity = (value) => {
  const s = String(value || 'error').toLowerCase();
  return ['warn', 'error', 'critical'].includes(s) ? s : 'error';
};
const htmlEscape = (value) => String(value ?? '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;');
const asDate = (value) => {
  if (!value) return null;
  const s = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
};

return $input.all().map((item, index) => {
  const input = item.json || {};
  const severity = normalizeSeverity(input.severity);
  const errorId = (globalThis.crypto?.randomUUID?.() || ('EXEC-ERRHDL-' + $execution.id + '-' + index));
  const details = input.error_details ?? input.error ?? input;
  const message = String(input.error_message || input.message || details?.message || 'unknown').slice(0, 1000);
  const notionTitle = '[ERR] ' + String(input.node_name || 'unknown node').slice(0, 80) + ' (' + String(input.source || 'other').slice(0, 30) + '): ' + message.slice(0, 60);
  const notionUrl = input.notion_url || '';
  const payload = {
    error_id: errorId,
    execution_id: input.execution_id || null,
    workflow_id: String(input.workflow_id || 'unknown'),
    workflow_name: String(input.workflow_name || 'unknown'),
    node_name: String(input.node_name || 'unknown'),
    source: String(input.source || 'other').toLowerCase(),
    severity,
    error_message: message,
    error_details: JSON.stringify(details),
    client_id: input.client_id || null,
    business_date: asDate(input.business_date),
    occurred_at: new Date().toISOString(),
    resolved: null,
    tenant_id: 'phi-agencia',
    demanda_titulo: notionTitle,
    demanda_tipo: 'Investigar anomalia',
    demanda_classe_sla: severity === 'critical' ? 'Critica' : (severity === 'warn' ? 'Ad-hoc padrao' : 'Recorrente diaria'),
    demanda_estado: 'Aberta',
    demanda_prioridade: severityRank[severity],
    demanda_observacoes: [
      'error_id=' + errorId,
      'execution_id=' + (input.execution_id || ''),
      'workflow_id=' + (input.workflow_id || ''),
      'workflow_name=' + (input.workflow_name || ''),
      'node_name=' + (input.node_name || ''),
      'source=' + (input.source || 'other'),
      'severity=' + severity,
      'message=' + message,
      'details=' + JSON.stringify(details).slice(0, 1200)
    ].join('; '),
  };
  payload.telegram_text = [
    'ALERTA <b>' + htmlEscape(severity) + '</b> - ' + htmlEscape(payload.workflow_name),
    'Node: <code>' + htmlEscape(payload.node_name) + '</code>',
    'Source: ' + htmlEscape(payload.source),
    'Cliente: ' + htmlEscape(payload.client_id || 'n/a') + ' (' + htmlEscape(payload.business_date || 'n/a') + ')',
    'Erro: <code>' + htmlEscape(message.slice(0, 200)) + '</code>',
    'ID: ' + htmlEscape(errorId),
    'Tarefa: <a href="' + htmlEscape(notionUrl) + '">Abrir no Notion</a>'
  ].join('\n');
  return { json: payload };
});`;

const nodes = [
  {
    id: 'errhdl-trigger',
    name: '[ErrHdl] Execute Workflow Trigger',
    type: 'n8n-nodes-base.executeWorkflowTrigger',
    typeVersion: 1.2,
    position: [0, 0],
    parameters: {
      inputSource: 'workflowInputs',
      workflowInputs: {
        values: [
          { name: 'workflow_id', type: 'string' },
          { name: 'workflow_name', type: 'string' },
          { name: 'node_name', type: 'string' },
          { name: 'source', type: 'string' },
          { name: 'severity', type: 'string' },
          { name: 'error_message', type: 'string' },
          { name: 'error_details', type: 'object' },
          { name: 'client_id', type: 'string' },
          { name: 'business_date', type: 'string' },
          { name: 'execution_id', type: 'string' },
        ],
      },
    },
  },
  {
    id: 'errhdl-set-contexto',
    name: '[ErrHdl] Set Contexto',
    type: 'n8n-nodes-base.code',
    typeVersion: 2,
    position: [280, 0],
    parameters: { mode: 'runOnceForAllItems', jsCode: setContextCode },
  },
  {
    id: 'errhdl-bq-insert',
    name: '[ErrHdl] BQ Insert t28_errors',
    type: 'n8n-nodes-base.googleBigQuery',
    typeVersion: 2.1,
    position: [560, -140],
    parameters: {
      operation: 'insert',
      projectId: { __rl: true, mode: 'list', value: PROJECT_ID, cachedResultName: 'phi-production' },
      datasetId: { __rl: true, mode: 'id', value: 'phi_prod' },
      tableId: { __rl: true, mode: 'id', value: 't28_errors' },
      dataMode: 'define',
      fieldsUi: {
        values: [
          'error_id', 'execution_id', 'workflow_id', 'workflow_name', 'node_name', 'source',
          'severity', 'error_message', 'error_details', 'client_id', 'business_date',
          'occurred_at', 'resolved',
        ].map((field) => ({ fieldId: field, fieldValue: `={{ $json.${field} }}` })),
      },
      options: { batchSize: 1, ignoreUnknownValues: false, skipInvalidRows: false },
    },
    credentials: { googleApi: creds.googleApi },
  },
  {
    id: 'errhdl-notion-create',
    name: '[ErrHdl] Notion Criar Tarefa Demanda',
    type: 'n8n-nodes-base.notion',
    typeVersion: 2.2,
    position: [560, 80],
    parameters: {
      resource: 'databasePage',
      operation: 'create',
      databaseId: { __rl: true, mode: 'list', value: DB_DEMANDAS_PAGE, cachedResultName: DB_DEMANDAS_NAME },
      simple: false,
      propertiesUi: {
        propertyValues: [
          { key: 'titulo|title', type: 'title', title: '={{ $json.demanda_titulo }}' },
          { key: 'tenant_id|rich_text', type: 'rich_text', textContent: '={{ $json.tenant_id }}' },
          { key: 'client_id|rich_text', type: 'rich_text', textContent: '={{ $json.client_id || "" }}' },
          { key: 'tipo|select', type: 'select', selectValue: '={{ $json.demanda_tipo }}' },
          { key: 'classe_sla|select', type: 'select', selectValue: '={{ $json.demanda_classe_sla }}' },
          { key: 'estado|select', type: 'select', selectValue: '={{ $json.demanda_estado }}' },
          { key: 'prioridade|number', type: 'number', numberValue: '={{ $json.demanda_prioridade }}' },
          { key: 'prioridade_origem|select', type: 'select', selectValue: 'agente' },
          { key: 'quality_gate|select', type: 'select', selectValue: 'pendente' },
          { key: 'sla_version|rich_text', type: 'rich_text', textContent: 'error-handler-l2' },
          { key: 'observacoes|rich_text', type: 'rich_text', textContent: '={{ $json.demanda_observacoes }}' },
        ],
      },
      blockUi: {
        blockValues: [
          { type: 'paragraph', textContent: '={{ "```json\\n" + $json.error_details + "\\n```" }}' },
        ],
      },
    },
    credentials: { notionApi: creds.notionApi },
  },
  {
    id: 'errhdl-telegram',
    name: '[ErrHdl] Telegram Notificar',
    type: 'n8n-nodes-base.telegram',
    typeVersion: 1.2,
    position: [840, 80],
    parameters: {
      resource: 'message',
      operation: 'sendMessage',
      chatId: TELEGRAM_CHAT_ID,
      text: '={{ String($json.telegram_text || "Abrir no Notion").replace(/href=""/g, "href=\\"https://app.notion.com/\\"") }}',
      additionalFields: { parse_mode: 'HTML', appendAttribution: false },
    },
    credentials: { telegramApi: creds.telegramApi },
    continueOnFail: true,
  },
];

const workflow = {
  id: 'rTS5pE34eElfuMPl',
  name: 'WF-T28-Error-Handler',
  active: false,
  isArchived: false,
  nodes,
  connections: {
    '[ErrHdl] Execute Workflow Trigger': { main: [[{ node: '[ErrHdl] Set Contexto', type: 'main', index: 0 }]] },
    '[ErrHdl] Set Contexto': { main: [[{ node: '[ErrHdl] BQ Insert t28_errors', type: 'main', index: 0 }, { node: '[ErrHdl] Notion Criar Tarefa Demanda', type: 'main', index: 0 }]] },
    '[ErrHdl] Notion Criar Tarefa Demanda': { main: [[{ node: '[ErrHdl] Telegram Notificar', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1', availableInMCP: true, timezone: 'America/Sao_Paulo' },
  staticData: null,
  meta: null,
  pinData: {},
  tags: [{ name: 'phi' }, { name: 'saude-digital' }, { name: 'l2-error-handler' }],
  description: 'Sub-WF acionado via onError dos nodes criticos. Grava t28_errors + cria tarefa Demanda + Telegram. ADR Aceito 2026-06-22.',
};

function writeIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf8');
    if (existing === content || existing.replace(/\r\n/g, '\n') === content) return;
  }
  fs.writeFileSync(filePath, content, 'utf8');
}

const outDir = __dirname;
const json = JSON.stringify(workflow, null, 2) + '\n';
writeIfChanged(path.join(outDir, 'workflow.json'), json);
writeIfChanged(path.join(outDir, 'sandbox_export.json'), json);
