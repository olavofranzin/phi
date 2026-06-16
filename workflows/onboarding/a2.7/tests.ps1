$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\a2.7\workflow.json'
$sandboxPath = 'C:\tmp\phi_repo\onboarding\a2.7\sandbox_export.json'

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
$workflow = $workflowRaw | ConvertFrom-Json

if ($workflow.name -ne 'Onb - Digest Diario Onboarding') {
  throw "Unexpected workflow name: $($workflow.name)"
}

$nodeMap = @{}
foreach ($node in $workflow.nodes) {
  $nodeMap[$node.name] = $node
  if ($node.name -notmatch '^\[Onb A2\.7\] ') {
    throw "Node does not use required prefix: $($node.name)"
  }
}

$requiredNodeNames = @(
  '[Onb A2.7] Schedule Trigger',
  '[Onb A2.7] Buscar Clientes Ativos',
  '[Onb A2.7] Buscar Etapas',
  '[Onb A2.7] Filtrar e Agregar',
  '[Onb A2.7] Gerar Digest Gemini',
  '[Onb A2.7] Normalizar Digest',
  '[Onb A2.7] Tem Resposta?',
  '[Onb A2.7] Montar Fallback',
  '[Onb A2.7] Enviar Telegram Olavo'
)

foreach ($name in $requiredNodeNames) {
  if (-not $nodeMap.ContainsKey($name)) {
    throw "Workflow is missing node '$name'"
  }
}

$schedule = @($nodeMap['[Onb A2.7] Schedule Trigger'].parameters.rule.interval)[0]
if ($schedule.field -ne 'days' -or [int]$schedule.daysInterval -ne 1 -or [int]$schedule.triggerAtHour -ne 9 -or [int]$schedule.triggerAtMinute -ne 0) {
  throw 'Schedule Trigger must run daily at 09:00'
}

$clientes = $nodeMap['[Onb A2.7] Buscar Clientes Ativos']
if ($clientes.parameters.databaseId.value -ne '04e34a62624b484cbda546604564b88c' -or -not $clientes.parameters.returnAll -or $clientes.parameters.filterType -ne 'none') {
  throw 'Buscar Clientes Ativos must read all pages from DB Clientes without filters'
}

$etapas = $nodeMap['[Onb A2.7] Buscar Etapas']
if ($etapas.parameters.databaseId.value -ne '6eb4565b4f1d498c8b2978e0c80880fd' -or -not $etapas.parameters.returnAll -or $etapas.parameters.filterType -ne 'none') {
  throw 'Buscar Etapas must read all pages from DB Etapas without filters'
}

$aggregateCode = [string]$nodeMap['[Onb A2.7] Filtrar e Agregar'].parameters.jsCode
foreach ($requiredSnippet in @(
  "'N\u00e3o iniciado'",
  "clientes_ativos",
  "etapas_atrasadas",
  "bloqueios",
  "etapa_atrasada",
  "dias_atrasada"
)) {
  if (-not $aggregateCode.Contains($requiredSnippet)) {
    throw "Filtrar e Agregar code is missing '$requiredSnippet'"
  }
}
if ($aggregateCode -match [regex]::Escape(('N' + '?o iniciado'))) {
  throw 'Filtrar e Agregar must not contain mojibake active status'
}
if ($workflowRaw -match 'NÃ|Ã£|Ã§|Ã©|Ã³') {
  throw 'workflow.json contains mojibake'
}

$gemini = $nodeMap['[Onb A2.7] Gerar Digest Gemini']
if ($gemini.type -ne '@n8n/n8n-nodes-langchain.googleGemini' -or $gemini.typeVersion -ne 1.2) {
  throw 'Gerar Digest Gemini must use Google Gemini node v1.2'
}
if ($gemini.parameters.resource -ne 'text' -or $gemini.parameters.operation -ne 'message') {
  throw 'Gerar Digest Gemini must use text/message operation'
}
if ($gemini.parameters.modelId.value -ne 'models/gemini-2.5-flash') {
  throw 'Gerar Digest Gemini must use gemini-2.5-flash'
}
if (-not $gemini.continueOnFail) {
  throw 'Gerar Digest Gemini must continueOnFail'
}
if ($gemini.credentials.googlePalmApi.id -ne 'cZNPIzF5ZCMrpnDr') {
  throw 'Gerar Digest Gemini must reference credential id cZNPIzF5ZCMrpnDr'
}

$normalizeCode = [string]$nodeMap['[Onb A2.7] Normalizar Digest'].parameters.jsCode
if (-not $normalizeCode.Contains("Array.isArray(data.content?.parts)")) {
  throw 'Normalizar Digest must extract Gemini content.parts without casting content objects'
}
if ($normalizeCode.Contains("|| data.content ||")) {
  throw 'Normalizar Digest must not cast object content to a non-empty string'
}
if (-not $normalizeCode.Contains("replace(/\*\*/g, '')")) {
  throw 'Normalizar Digest must strip heavy markdown markers before Telegram'
}

$ifCondition = [string]$nodeMap['[Onb A2.7] Tem Resposta?'].parameters.conditions.conditions[0].leftValue
if ($ifCondition -ne '={{ String($json.text || "").trim() }}') {
  throw 'Tem Resposta? must check normalized $json.text only'
}

$telegram = $nodeMap['[Onb A2.7] Enviar Telegram Olavo']
$expectedText = "={{ String(`$json.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}"
if ($telegram.parameters.text -ne $expectedText) {
  throw 'Telegram text must use the canonical HTML escape expression'
}
if ($telegram.parameters.chatId -ne '<TELEGRAM_CHAT_ID_redacted>' -or $telegram.parameters.additionalFields.parse_mode -ne 'HTML') {
  throw 'Telegram must use sanitized chat_id and HTML parse mode'
}
if ($telegram.parameters.additionalFields.appendAttribution -ne $false) {
  throw 'Telegram must disable n8n attribution'
}

function Get-NextNodes([object]$wf, [string]$nodeName, [int]$outputIndex = 0) {
  $conn = $wf.connections.$nodeName
  if (-not $conn -or -not $conn.main -or $conn.main.Count -le $outputIndex) {
    return @()
  }
  $nodes = @($conn.main[$outputIndex] | ForEach-Object { $_.node })
  return ,$nodes
}

$expectedLinear = @(
  @('[Onb A2.7] Schedule Trigger', '[Onb A2.7] Buscar Clientes Ativos', 0),
  @('[Onb A2.7] Buscar Clientes Ativos', '[Onb A2.7] Buscar Etapas', 0),
  @('[Onb A2.7] Buscar Etapas', '[Onb A2.7] Filtrar e Agregar', 0),
  @('[Onb A2.7] Filtrar e Agregar', '[Onb A2.7] Gerar Digest Gemini', 0),
  @('[Onb A2.7] Gerar Digest Gemini', '[Onb A2.7] Normalizar Digest', 0),
  @('[Onb A2.7] Normalizar Digest', '[Onb A2.7] Tem Resposta?', 0),
  @('[Onb A2.7] Tem Resposta?', '[Onb A2.7] Enviar Telegram Olavo', 0),
  @('[Onb A2.7] Tem Resposta?', '[Onb A2.7] Montar Fallback', 1),
  @('[Onb A2.7] Montar Fallback', '[Onb A2.7] Enviar Telegram Olavo', 0)
)

foreach ($edge in $expectedLinear) {
  $actual = Get-NextNodes $workflow $edge[0] $edge[2]
  if ($actual.Count -ne 1 -or $actual[0] -ne $edge[1]) {
    throw "Unexpected wiring from $($edge[0]) output $($edge[2]): $($actual -join ', ')"
  }
}

Write-Output 'Onboarding A2.7 workflow structural tests passed.'
