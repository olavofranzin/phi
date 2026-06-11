$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
$workflowPath = Join-Path $PSScriptRoot 'telemetria\workflow.json'
$sandboxPath = Join-Path $PSScriptRoot 'telemetria\sandbox_export.json'
$generatorPath = Join-Path $PSScriptRoot 'telemetria\generate_export.js'

foreach ($path in @($workflowPath, $sandboxPath, $generatorPath)) {
  if (-not (Test-Path $path)) {
    throw "Missing required file: $path"
  }
}

foreach ($jsonPath in @($workflowPath, $sandboxPath, $generatorPath)) {
  $bytes = [System.IO.File]::ReadAllBytes($jsonPath)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    throw "$jsonPath must be UTF-8 without BOM"
  }
}

$workflowRaw = [System.IO.File]::ReadAllText($workflowPath, [System.Text.Encoding]::UTF8)
$sandboxRaw = [System.IO.File]::ReadAllText($sandboxPath, [System.Text.Encoding]::UTF8)
$generatorRaw = [System.IO.File]::ReadAllText($generatorPath, [System.Text.Encoding]::UTF8)
$workflow = $workflowRaw | ConvertFrom-Json
$sandbox = $sandboxRaw | ConvertFrom-Json

if ($workflow.name -ne 'WF-DOC-Telemetria-Diaria') {
  throw "Unexpected workflow name: $($workflow.name)"
}
if ($workflow.active -ne $false) {
  throw 'Workflow export must stay inactive until review and approval'
}
if ($workflow.nodes.Count -ne 16) {
  throw "Workflow must have exactly 16 nodes; found $($workflow.nodes.Count)"
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
  '[Telemetria] IF Tem Novas Linhas',
  '[Telemetria] Criar Snapshot',
  '[Telemetria] Merge Pos-Snapshot',
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
  'sentinel: true',
  'itemsParaCriar',
  'return itemsParaCriar'
)) {
  if (-not $metricCode.Contains($snippet)) {
    throw "Calcular Metricas code is missing '$snippet'"
  }
}
if ($metricCode.Contains('return toCreate.map')) {
  throw 'Calcular Metricas must always emit at least one item, not return toCreate.map directly'
}
if ($metricCode -match 'require\(|import ') {
  throw 'Calcular Metricas must not use external libraries'
}

$ifNovas = $nodeMap['[Telemetria] IF Tem Novas Linhas']
if ($ifNovas.type -ne 'n8n-nodes-base.if') {
  throw 'IF Tem Novas Linhas must use n8n IF node'
}
$ifCondition = $ifNovas.parameters.conditions.conditions[0]
if ([string]$ifCondition.leftValue -ne '={{ $json.linhas_novas }}' -or [int]$ifCondition.rightValue -ne 0 -or $ifCondition.operator.operation -ne 'gt') {
  throw 'IF Tem Novas Linhas must check linhas_novas > 0'
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
$chaveDaMetrica = 'Chave da m' + [char]0x00e9 + 'trica'
if (-not $createJson.Contains($chaveDaMetrica)) {
  throw "Criar Snapshot is missing property 'Chave da metrica' (with accent)"
}

$merge = $nodeMap['[Telemetria] Merge Pos-Snapshot']
if ($merge.type -ne 'n8n-nodes-base.merge') {
  throw 'Merge Pos-Snapshot must use n8n Merge node'
}
if ($merge.parameters.mode -ne 'append') {
  throw 'Merge Pos-Snapshot must use append mode'
}

$digestCode = [string]$nodeMap['[Telemetria] Montar Digest HTML'].parameters.jsCode
foreach ($snippet in @('&amp;', '&lt;', '&gt;', '<b>PHI Telemetria', 'DB Snapshots')) {
  if (-not $digestCode.Contains($snippet)) {
    throw "Montar Digest HTML code is missing '$snippet'"
  }
}
if ($digestCode.Contains('parse_mode=HTML')) {
  throw 'Montar Digest HTML must not include parse_mode=HTML in the Telegram body'
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

if ($workflowRaw.Contains('930549271') -or $sandboxRaw.Contains('930549271') -or $generatorRaw.Contains('930549271')) {
  throw 'Exports must not contain raw Telegram chat_id'
}
if ($workflowRaw -match 'AIza|secret|api[_-]?key|token' -or $sandboxRaw -match 'AIza|secret|api[_-]?key|token' -or $generatorRaw -match 'AIza|secret|api[_-]?key|token') {
  throw 'Exports appear to contain secrets'
}
if ($workflowRaw -match 'NÃ|Ã£|Ã§|Ã©|Ã³' -or $sandboxRaw -match 'NÃ|Ã£|Ã§|Ã©|Ã³' -or $generatorRaw -match 'NÃ|Ã£|Ã§|Ã©|Ã³') {
  throw 'Telemetria files contain mojibake'
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
  @('[Telemetria] Calcular Metricas', '[Telemetria] IF Tem Novas Linhas', 0),
  @('[Telemetria] Criar Snapshot', '[Telemetria] Merge Pos-Snapshot', 0),
  @('[Telemetria] Merge Pos-Snapshot', '[Telemetria] Montar Digest HTML', 0),
  @('[Telemetria] Montar Digest HTML', '[Telemetria] Enviar Telegram', 0),
  @('[Telemetria] Enviar Telegram', '[Telemetria] Set Status Final', 0)
)

foreach ($edge in $expectedLinear) {
  $actual = Get-NextNodes $workflow $edge[0] $edge[2]
  if ($actual.Count -ne 1 -or $actual[0] -ne $edge[1]) {
    throw "Unexpected wiring from $($edge[0]) output $($edge[2]): $($actual -join ', ')"
  }
}

$ifOutputs = $workflow.connections.'[Telemetria] IF Tem Novas Linhas'.main
if ($ifOutputs.Count -ne 2) {
  throw 'IF Tem Novas Linhas must have 2 outputs (true/false)'
}
if ($ifOutputs[0][0].node -ne '[Telemetria] Criar Snapshot') {
  throw 'IF true branch must go to Criar Snapshot'
}
if ($ifOutputs[1][0].node -ne '[Telemetria] Merge Pos-Snapshot') {
  throw 'IF false branch must go to Merge Pos-Snapshot'
}

if ($sandbox.name -ne $workflow.name -or $sandbox.nodes.Count -ne $workflow.nodes.Count) {
  throw 'sandbox_export.json must mirror workflow.json structurally'
}
if ($sandboxRaw -ne $workflowRaw) {
  throw 'sandbox_export.json must match workflow.json exactly'
}

Write-Output 'Telemetria workflow structural tests passed.'
