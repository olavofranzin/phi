$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\telemetria\workflow.json'
$sandboxPath = 'C:\tmp\phi_repo\onboarding\telemetria\sandbox_export.json'

foreach ($path in @($workflowPath, $sandboxPath)) {
  if (-not (Test-Path $path)) {
    throw "Missing required file: $path"
  }
}

foreach ($jsonPath in @($workflowPath, $sandboxPath)) {
  $bytes = [System.IO.File]::ReadAllBytes($jsonPath)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    throw "$jsonPath must be UTF-8 without BOM"
  }
}

$workflowRaw = [System.IO.File]::ReadAllText($workflowPath, [System.Text.Encoding]::UTF8)
$sandboxRaw = [System.IO.File]::ReadAllText($sandboxPath, [System.Text.Encoding]::UTF8)
$workflow = $workflowRaw | ConvertFrom-Json
$sandbox = $sandboxRaw | ConvertFrom-Json

if ($workflow.name -ne 'WF-DOC-Telemetria-Diaria') {
  throw "Unexpected workflow name: $($workflow.name)"
}
if ($workflow.active -ne $false) {
  throw 'Workflow export must stay inactive until review and approval'
}
if ($workflow.nodes.Count -ne 14) {
  throw "Workflow must have exactly 14 nodes; found $($workflow.nodes.Count)"
}
if ($workflow.settings.timezone -ne 'America/Sao_Paulo') {
  throw 'Workflow timezone must be America/Sao_Paulo'
}

$nodeMap = @{}
foreach ($node in $workflow.nodes) {
  $nodeMap[$node.name] = $node
  if ($node.name -notmatch '^\[Telemetria\] ') {
    throw "Node does not use required prefix: $($node.name)"
  }
}

$requiredNodeNames = @(
  '[Telemetria] Schedule Trigger',
  '[Telemetria] Set Contexto',
  '[Telemetria] Buscar Clientes',
  '[Telemetria] Buscar Etapas',
  '[Telemetria] Buscar Mudancas Escopo',
  '[Telemetria] Buscar Catalogo',
  '[Telemetria] Buscar Decisoes ADR',
  '[Telemetria] Buscar Aprendizados',
  '[Telemetria] Buscar Snapshots Existentes',
  '[Telemetria] Calcular Metricas',
  '[Telemetria] Criar Snapshot',
  '[Telemetria] Montar Digest HTML',
  '[Telemetria] Enviar Telegram',
  '[Telemetria] Set Status Final'
)

foreach ($name in $requiredNodeNames) {
  if (-not $nodeMap.ContainsKey($name)) {
    throw "Workflow is missing node '$name'"
  }
}

$schedule = @($nodeMap['[Telemetria] Schedule Trigger'].parameters.rule.interval)[0]
if ($schedule.field -ne 'days' -or [int]$schedule.daysInterval -ne 1 -or [int]$schedule.triggerAtHour -ne 8 -or [int]$schedule.triggerAtMinute -ne 30) {
  throw 'Schedule Trigger must run daily at 08:30'
}

$setContext = $nodeMap['[Telemetria] Set Contexto']
$assignments = @($setContext.parameters.assignments.assignments)
$assignmentNames = @($assignments | ForEach-Object { $_.name })
foreach ($field in @('execution_id', 'tenant_id', 'data_snapshot', 'versao_consulta')) {
  if ($assignmentNames -notcontains $field) {
    throw "Set Contexto is missing assignment '$field'"
  }
}
$executionAssignment = $assignments | Where-Object { $_.name -eq 'execution_id' } | Select-Object -First 1
if ([string]$executionAssignment.value -notmatch 'EXEC-TELEMETRIA-') {
  throw 'execution_id must use EXEC-TELEMETRIA prefix'
}

$notionReads = @(
  @('[Telemetria] Buscar Clientes', '04e34a62624b484cbda546604564b88c'),
  @('[Telemetria] Buscar Etapas', '6eb4565b4f1d498c8b2978e0c80880fd'),
  @('[Telemetria] Buscar Mudancas Escopo', 'bb56ddca-dfad-4aa5-9227-3cf86207bc40'),
  @('[Telemetria] Buscar Catalogo', '07623177-4d75-4870-bdc0-4ecd365392a7'),
  @('[Telemetria] Buscar Decisoes ADR', '237a5e127f5142eeb9c04ddfb16b6400'),
  @('[Telemetria] Buscar Aprendizados', 'aa5d49b2-c2f6-40bc-b883-5cd350a982c7'),
  @('[Telemetria] Buscar Snapshots Existentes', '32404398-6751-4bbd-be28-4ad591e22bf7')
)

foreach ($read in $notionReads) {
  $node = $nodeMap[$read[0]]
  if ($node.type -ne 'n8n-nodes-base.notion' -or $node.parameters.resource -ne 'databasePage' -or $node.parameters.operation -ne 'getAll') {
    throw "$($read[0]) must use Notion databasePage/getAll"
  }
  if ($node.parameters.databaseId.value -ne $read[1]) {
    throw "$($read[0]) must read database/data source $($read[1])"
  }
  if (-not $node.parameters.returnAll) {
    throw "$($read[0]) must use returnAll for pagination"
  }
}

$metricCode = [string]$nodeMap['[Telemetria] Calcular Metricas'].parameters.jsCode
foreach ($snippet in @(
  'existingKeys',
  'data_snapshot + ''|'' + chave + ''|'' + janela',
  'EXEC-TELEMETRIA',
  'tenant_id',
  'versao_consulta',
  'onb.briefings_intake',
  'glb.workflows_ativos',
  'return toCreate.map'
)) {
  if (-not $metricCode.Contains($snippet)) {
    throw "Calcular Metricas code is missing '$snippet'"
  }
}
if ($metricCode -match 'require\(|import ') {
  throw 'Calcular Metricas must not use external libraries'
}

$create = $nodeMap['[Telemetria] Criar Snapshot']
if ($create.type -ne 'n8n-nodes-base.notion' -or $create.parameters.resource -ne 'databasePage' -or $create.parameters.operation -ne 'create') {
  throw 'Criar Snapshot must use Notion databasePage/create'
}
if ($create.parameters.databaseId.value -ne '32404398-6751-4bbd-be28-4ad591e22bf7') {
  throw 'Criar Snapshot must write only to DB Snapshots'
}
$createJson = $create | ConvertTo-Json -Depth 50
$versaoConsulta = 'Vers' + [char]0x00e3 + 'o da consulta'
foreach ($required in @('execution_id', 'tenant_id', $versaoConsulta)) {
  if (-not $createJson.Contains($required)) {
    throw "Criar Snapshot is missing property '$required'"
  }
}

$digestCode = [string]$nodeMap['[Telemetria] Montar Digest HTML'].parameters.jsCode
foreach ($snippet in @('&amp;', '&lt;', '&gt;', '<b>PHI Telemetria', 'DB Snapshots', 'parse_mode')) {
  if (-not $digestCode.Contains($snippet)) {
    throw "Montar Digest HTML code is missing '$snippet'"
  }
}

$telegram = $nodeMap['[Telemetria] Enviar Telegram']
if ($telegram.parameters.additionalFields.parse_mode -ne 'HTML') {
  throw 'Telegram must use HTML parse mode'
}
if ($telegram.parameters.chatId -ne '<TELEGRAM_CHAT_ID_redacted>') {
  throw 'Telegram chat_id must be redacted in canonical exports'
}
if ($telegram.parameters.text -ne '={{ $json.digest_html }}') {
  throw 'Telegram must send the single digest_html string'
}

if ($workflowRaw.Contains('930549271') -or $sandboxRaw.Contains('930549271')) {
  throw 'Exports must not contain raw Telegram chat_id'
}
if ($workflowRaw -match 'AIza|secret|api[_-]?key|token' -or $sandboxRaw -match 'AIza|secret|api[_-]?key|token') {
  throw 'Exports appear to contain secrets'
}
if ($workflowRaw -match 'NÃ|Ã£|Ã§|Ã©|Ã³') {
  throw 'workflow.json contains mojibake'
}

function Get-NextNodes([object]$wf, [string]$nodeName, [int]$outputIndex = 0) {
  $conn = $wf.connections.$nodeName
  if (-not $conn -or -not $conn.main -or $conn.main.Count -le $outputIndex) {
    return @()
  }
  return ,@($conn.main[$outputIndex] | ForEach-Object { $_.node })
}

$fanOut = Get-NextNodes $workflow '[Telemetria] Set Contexto'
$expectedFanOut = $requiredNodeNames[2..8]
foreach ($name in $expectedFanOut) {
  if ($fanOut -notcontains $name) {
    throw "Set Contexto must connect to parallel node '$name'"
  }
}

foreach ($name in $expectedFanOut) {
  $next = Get-NextNodes $workflow $name
  if ($next.Count -ne 1 -or $next[0] -ne '[Telemetria] Calcular Metricas') {
    throw "$name must connect to Calcular Metricas"
  }
}

$expectedLinear = @(
  @('[Telemetria] Schedule Trigger', '[Telemetria] Set Contexto', 0),
  @('[Telemetria] Calcular Metricas', '[Telemetria] Criar Snapshot', 0),
  @('[Telemetria] Criar Snapshot', '[Telemetria] Montar Digest HTML', 0),
  @('[Telemetria] Montar Digest HTML', '[Telemetria] Enviar Telegram', 0),
  @('[Telemetria] Enviar Telegram', '[Telemetria] Set Status Final', 0)
)

foreach ($edge in $expectedLinear) {
  $actual = Get-NextNodes $workflow $edge[0] $edge[2]
  if ($actual.Count -ne 1 -or $actual[0] -ne $edge[1]) {
    throw "Unexpected wiring from $($edge[0]) output $($edge[2]): $($actual -join ', ')"
  }
}

if ($sandbox.name -ne $workflow.name -or $sandbox.nodes.Count -ne $workflow.nodes.Count) {
  throw 'sandbox_export.json must mirror workflow.json structurally'
}

Write-Output 'Telemetria workflow structural tests passed.'
