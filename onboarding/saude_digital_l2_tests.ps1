$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$ddlDir = Join-Path $root 'docs/strategic-planning/agregador-t28/ddl'
$wfDir = Join-Path $root 'workflows/wf-t28-error-handler'

function Read-Utf8NoBom($path) {
  if (-not (Test-Path $path)) { throw "Missing file: $path" }
  $bytes = [System.IO.File]::ReadAllBytes($path)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    throw "$path has UTF-8 BOM"
  }
  return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Node-Map($workflow) {
  $map = @{}
  foreach ($node in $workflow.nodes) { $map[$node.name] = $node }
  return $map
}

$devPath = Join-Path $ddlDir 'phi_dev_t28_errors.sql'
$prodPath = Join-Path $ddlDir 'phi_prod_t28_errors.sql'
$dev = Read-Utf8NoBom $devPath
$prod = Read-Utf8NoBom $prodPath

if (-not $dev.Contains('CREATE TABLE IF NOT EXISTS `phi_dev.t28_errors`')) {
  throw 'phi_dev_t28_errors.sql must create phi_dev.t28_errors'
}
if (-not $prod.Contains('CREATE TABLE IF NOT EXISTS `phi_prod.t28_errors`')) {
  throw 'phi_prod_t28_errors.sql must create phi_prod.t28_errors'
}
foreach ($snippet in @(
  'error_id           STRING    NOT NULL',
  'execution_id       STRING',
  'workflow_id        STRING    NOT NULL',
  'workflow_name      STRING    NOT NULL',
  'node_name          STRING    NOT NULL',
  'source             STRING',
  'severity           STRING    NOT NULL',
  'error_details      JSON',
  'client_id          STRING',
  'business_date      DATE',
  'occurred_at        TIMESTAMP NOT NULL',
  'resolved           BOOL',
  'PARTITION BY DATE(occurred_at)',
  'CLUSTER BY workflow_id, severity'
)) {
  if (-not $dev.Contains($snippet)) { throw "dev DDL missing snippet: $snippet" }
  if (-not $prod.Contains($snippet)) { throw "prod DDL missing snippet: $snippet" }
}

$normalizedDev = $dev.Replace('phi_dev', '<DATASET>').Replace('DATASET phi_dev', 'DATASET <DATASET>')
$normalizedProd = $prod.Replace('phi_prod', '<DATASET>').Replace('DATASET phi_prod', 'DATASET <DATASET>')
if ($normalizedDev -ne $normalizedProd) {
  throw 't28_errors DDL files must be identical except dataset name'
}

$workflowPath = Join-Path $wfDir 'workflow.json'
$sandboxPath = Join-Path $wfDir 'sandbox_export.json'
$workflowRaw = Read-Utf8NoBom $workflowPath
$sandboxRaw = Read-Utf8NoBom $sandboxPath
if ($workflowRaw -ne $sandboxRaw) {
  throw 'workflow.json and sandbox_export.json must be byte-identical'
}
$forbiddenSecretPatterns = @(
  ('KpPCTs' + 'YPAvGXGfp2'),
  ('pHCHz' + 'ZTP2yReQXb6'),
  ('cZNPIz' + 'F5ZCMrpnDr'),
  ('AI' + 'za'),
  ('tok' + 'en'),
  ('api' + '_' + 'key')
)
foreach ($pattern in $forbiddenSecretPatterns) {
  if ($workflowRaw.Contains($pattern)) { throw "workflow export contains likely secret material: $pattern" }
}
foreach ($placeholder in @('<GOOGLE_BIGQUERY_CREDENTIAL_ID_redacted>', '<credential_id_redacted>', '<TELEGRAM_CREDENTIAL_ID_redacted>', '<TELEGRAM_CHAT_ID_redacted>')) {
  if (-not $workflowRaw.Contains($placeholder)) { throw "workflow export missing redacted placeholder: $placeholder" }
}

$workflow = $workflowRaw | ConvertFrom-Json
if ($workflow.name -ne 'WF-T28-Error-Handler') { throw 'Unexpected workflow name' }
if ($workflow.active -ne $false) { throw 'WF-T28-Error-Handler must be inactive in git export' }
$map = Node-Map $workflow
foreach ($required in @(
  '[ErrHdl] Execute Workflow Trigger',
  '[ErrHdl] Set Contexto',
  '[ErrHdl] BQ Insert t28_errors',
  '[ErrHdl] Notion Criar Tarefa Demanda',
  '[ErrHdl] Telegram Notificar'
)) {
  if (-not $map.ContainsKey($required)) { throw "workflow missing node: $required" }
}

$trigger = $map['[ErrHdl] Execute Workflow Trigger']
if ($trigger.type -ne 'n8n-nodes-base.executeWorkflowTrigger') { throw 'trigger must be Execute Workflow Trigger' }

$bq = $map['[ErrHdl] BQ Insert t28_errors']
if ($bq.type -ne 'n8n-nodes-base.googleBigQuery') { throw 'BQ insert must use googleBigQuery node' }
if ($bq.parameters.operation -ne 'insert') { throw 'BQ node must use insert operation' }
if ($bq.parameters.datasetId.value -ne 'phi_prod') { throw 'BQ insert must hardcode phi_prod dataset' }
if ($bq.parameters.tableId.value -ne 't28_errors') { throw 'BQ insert must target t28_errors' }
if ($bq.parameters.options.batchSize -ne 1) { throw 'BQ insert batchSize must be 1' }

$notion = $map['[ErrHdl] Notion Criar Tarefa Demanda']
if ($notion.type -ne 'n8n-nodes-base.notion') { throw 'Notion node must use native Notion node' }
if ($notion.parameters.operation -ne 'create') { throw 'Notion node must create database page' }
$propKeys = @($notion.parameters.propertiesUi.propertyValues | ForEach-Object { $_.key })
foreach ($key in @('titulo|title', 'tenant_id|rich_text', 'client_id|rich_text', 'tipo|select', 'classe_sla|select', 'estado|select', 'prioridade|number', 'observacoes|rich_text')) {
  if ($propKeys -notcontains $key) { throw "Notion create missing property $key" }
}

$telegram = $map['[ErrHdl] Telegram Notificar']
if ($telegram.type -ne 'n8n-nodes-base.telegram') { throw 'Telegram node type mismatch' }
if ($telegram.continueOnFail -ne $true) { throw 'Telegram node must continueOnFail=true' }
if ($telegram.parameters.additionalFields.parse_mode -ne 'HTML') { throw 'Telegram must use HTML parse mode' }
if (-not ([string]$telegram.parameters.text).Contains('Abrir no Notion')) { throw 'Telegram text must include Notion link label' }

Write-Host 'Saude Digital L2 structural tests passed.'
