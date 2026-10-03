$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\a2.3\workflow.json'
$sandboxPath = 'C:\tmp\phi_repo\onboarding\a2.3\sandbox_export.json'

foreach ($path in @($workflowPath, $sandboxPath)) {
  if (-not (Test-Path $path)) {
    throw "Missing required file: $path"
  }
  $bytes = [System.IO.File]::ReadAllBytes($path)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    throw "$path must be UTF-8 without BOM"
  }
}

$workflowRaw = [System.IO.File]::ReadAllText($workflowPath, [System.Text.Encoding]::UTF8)
$workflow = $workflowRaw | ConvertFrom-Json

if ($workflow.name -ne 'Onb - Classifica Briefing Resumo Operacional') {
  throw "Unexpected workflow name: $($workflow.name)"
}
if (-not $workflow.active) {
  throw 'A2.3 workflow export must be active'
}

$nodeMap = @{}
foreach ($node in $workflow.nodes) {
  $nodeMap[$node.name] = $node
  if ($node.name -notmatch '^\[Onb A2\.3\] ') {
    throw "Node does not use required prefix: $($node.name)"
  }
}

$requiredNodeNames = @(
  '[Onb A2.3] Webhook Briefing',
  '[Onb A2.3] Validar Secret',
  '[Onb A2.3] Secret Valido?',
  '[Onb A2.3] Responder 401',
  '[Onb A2.3] Validar Payload',
  '[Onb A2.3] Payload Valido?',
  '[Onb A2.3] Responder 400',
  '[Onb A2.3] Buscar Cliente',
  '[Onb A2.3] Ja Classificado?',
  '[Onb A2.3] Responder Idempotente',
  '[Onb A2.3] Buscar Etapas do Cliente',
  '[Onb A2.3] Localizar Seq 7 e Seq 8',
  '[Onb A2.3] Avaliar via Gemini Pro',
  '[Onb A2.3] Normalizar Decisao',
  '[Onb A2.3] Roteador por Classe',
  '[Onb A2.3] Preparar Atualizacoes Aprovado',
  '[Onb A2.3] Setar Classificacao no Cliente',
  '[Onb A2.3] Criar Sub-pagina Resumo Operacional',
  '[Onb A2.3] Criar Sub-pagina Briefing Original',
  '[Onb A2.3] Atualizar Seq 7',
  '[Onb A2.3] Atualizar Seq 8',
  '[Onb A2.3] Montar Telegram Aprovado',
  '[Onb A2.3] Telegram Aprovado/Lacunas',
  '[Onb A2.3] Responder 200 Aprovado',
  '[Onb A2.3] Preparar Atualizacoes Insuficiente',
  '[Onb A2.3] Setar Classificacao Insuficiente',
  '[Onb A2.3] Criar Sub-pagina Briefing Original Insuf',
  '[Onb A2.3] Atualizar Seq 7 Insuf',
  '[Onb A2.3] Montar Telegram Insuf',
  '[Onb A2.3] Telegram Insuficiente',
  '[Onb A2.3] Responder 200 Insuficiente'
)

foreach ($name in $requiredNodeNames) {
  if (-not $nodeMap.ContainsKey($name)) {
    throw "Workflow is missing node '$name'"
  }
}

$webhook = $nodeMap['[Onb A2.3] Webhook Briefing']
if ($webhook.type -ne 'n8n-nodes-base.webhook' -or $webhook.parameters.httpMethod -ne 'POST' -or $webhook.parameters.path -ne 'a2.3-classifica-briefing' -or $webhook.parameters.responseMode -ne 'responseNode') {
  throw 'Webhook must be POST a2.3-classifica-briefing with responseNode'
}

$secretCode = [string]$nodeMap['[Onb A2.3] Validar Secret'].parameters.jsCode
foreach ($snippet in @('<ONB_WEBHOOK_SECRET_redacted>', 'x-onb-secret', 'onb_secret_valid')) {
  if (-not $secretCode.Contains($snippet)) {
    throw "Validar Secret missing $snippet"
  }
}
if ($workflowRaw -match "const ONB_WEBHOOK_SECRET = '(?!<ONB_WEBHOOK_SECRET_redacted>)[^']+'") {
  throw 'workflow.json must not contain raw ONB_WEBHOOK_SECRET'
}

$payloadCode = [string]$nodeMap['[Onb A2.3] Validar Payload'].parameters.jsCode
foreach ($snippet in @('cliente_page_id', 'briefing_payload', 'Object.keys(briefing).length === 0')) {
  if (-not $payloadCode.Contains($snippet)) {
    throw "Validar Payload missing $snippet"
  }
}

$buscarEtapas = $nodeMap['[Onb A2.3] Buscar Etapas do Cliente']
if ($buscarEtapas.parameters.url -ne 'https://api.notion.com/v1/databases/6eb4565b4f1d498c8b2978e0c80880fd/query') {
  throw 'Buscar Etapas must query DB Etapas'
}
if (-not ([string]$buscarEtapas.parameters.jsonBody).Contains("property: 'Cliente'")) {
  throw 'Buscar Etapas must filter by Cliente relation'
}
if (-not ([string]$buscarEtapas.parameters.jsonBody).Contains("[Onb A2.3] Validar Payload")) {
  throw 'Buscar Etapas must read cliente_page_id from Validar Payload, not current Notion page output'
}

$gemini = $nodeMap['[Onb A2.3] Avaliar via Gemini Pro']
if ($gemini.type -ne '@n8n/n8n-nodes-langchain.googleGemini' -or $gemini.typeVersion -ne 1.2) {
  throw 'Gemini node must use Google Gemini v1.2'
}
if ($gemini.parameters.resource -ne 'text' -or $gemini.parameters.operation -ne 'message' -or $gemini.parameters.modelId.value -ne 'models/gemini-2.5-pro') {
  throw 'Gemini node must use text/message with gemini-2.5-pro'
}
if (-not $gemini.continueOnFail -or -not $gemini.retryOnFail -or [int]$gemini.waitBetweenTries -ne 2000) {
  throw 'Gemini must continueOnFail, retryOnFail and waitBetweenTries=2000'
}
if ([int]$gemini.parameters.options.maxOutputTokens -ne 2048 -or [double]$gemini.parameters.options.temperature -ne 0.1) {
  throw 'Gemini options must use maxOutputTokens=2048 and temperature=0.1'
}
if ($gemini.credentials.googlePalmApi.id -ne '<GEMINI_CREDENTIAL_ID_redacted>') {
  throw 'Gemini credential id must be sanitized'
}

$normalizar = [string]$nodeMap['[Onb A2.3] Normalizar Decisao'].parameters.jsCode
foreach ($snippet in @('data.text', 'data.mergedResponse', 'data.content?.parts', 'JSON.parse', "classificacao: 'Insuficiente'", 'replace(/\*\*/g')) {
  if (-not $normalizar.Contains($snippet)) {
    throw "Normalizar Decisao missing $snippet"
  }
}

$prepAprovado = [string]$nodeMap['[Onb A2.3] Preparar Atualizacoes Aprovado'].parameters.jsCode
$prepInsuf = [string]$nodeMap['[Onb A2.3] Preparar Atualizacoes Insuficiente'].parameters.jsCode
foreach ($snippet in @("Classifica\u00e7\u00e3o do briefing", "Conclu\u00eddo", "Resumo Operacional do Briefing", "Briefing original (resposta do Form)")) {
  if (-not $prepAprovado.Contains($snippet)) {
    throw "Preparar Aprovado missing $snippet"
  }
}
foreach ($snippet in @("Classifica\u00e7\u00e3o do briefing", "Insuficiente", "Conclu\u00eddo", "Briefing original (resposta do Form)")) {
  if (-not $prepInsuf.Contains($snippet)) {
    throw "Preparar Insuficiente missing $snippet"
  }
}

$telegramNames = @('[Onb A2.3] Telegram Aprovado/Lacunas', '[Onb A2.3] Telegram Insuficiente')
$expectedText = "={{ String(`$json.text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }}"
foreach ($name in $telegramNames) {
  $telegram = $nodeMap[$name]
  if ($telegram.parameters.text -ne $expectedText) {
    throw "$name must use canonical HTML escape expression"
  }
  if ($telegram.parameters.chatId -ne '<TELEGRAM_CHAT_ID_redacted>' -or $telegram.parameters.additionalFields.parse_mode -ne 'HTML') {
    throw "$name must use sanitized chat_id and HTML parse mode"
  }
  if ($telegram.parameters.additionalFields.appendAttribution -ne $false) {
    throw "$name must disable n8n attribution"
  }
}

if (-not ([string]$nodeMap['[Onb A2.3] Responder 200 Aprovado'].parameters.responseBody).Contains("[Onb A2.3] Montar Telegram Aprovado")) {
  throw 'Approved 200 response must reference prepared data, not Telegram output'
}
if (-not ([string]$nodeMap['[Onb A2.3] Responder 200 Insuficiente'].parameters.responseBody).Contains("[Onb A2.3] Montar Telegram Insuf")) {
  throw 'Insufficient 200 response must reference prepared data, not Telegram output'
}

if ($workflowRaw -match '930549271|pHCHzZTP2yReQXb6|KpPCTsYPAvGXGfp2|cZNPIzF5ZCMrpnDr|hB6kr|eyJ') {
  throw 'workflow.json contains a live secret or live credential/chat id'
}
if ($workflowRaw -match 'NÃ|Ã§|Ã£|Ã©|Ãª|Ã¡|â') {
  throw 'workflow.json contains mojibake'
}

function Get-NextNodes([object]$wf, [string]$nodeName, [int]$outputIndex = 0) {
  $conn = $wf.connections.$nodeName
  if (-not $conn -or -not $conn.main -or $conn.main.Count -le $outputIndex) {
    return @()
  }
  return ,@($conn.main[$outputIndex] | ForEach-Object { $_.node })
}

$expectedEdges = @(
  @('[Onb A2.3] Webhook Briefing', '[Onb A2.3] Validar Secret', 0),
  @('[Onb A2.3] Validar Secret', '[Onb A2.3] Secret Valido?', 0),
  @('[Onb A2.3] Secret Valido?', '[Onb A2.3] Validar Payload', 0),
  @('[Onb A2.3] Secret Valido?', '[Onb A2.3] Responder 401', 1),
  @('[Onb A2.3] Validar Payload', '[Onb A2.3] Payload Valido?', 0),
  @('[Onb A2.3] Payload Valido?', '[Onb A2.3] Buscar Cliente', 0),
  @('[Onb A2.3] Payload Valido?', '[Onb A2.3] Responder 400', 1),
  @('[Onb A2.3] Buscar Cliente', '[Onb A2.3] Ja Classificado?', 0),
  @('[Onb A2.3] Ja Classificado?', '[Onb A2.3] Responder Idempotente', 0),
  @('[Onb A2.3] Ja Classificado?', '[Onb A2.3] Buscar Etapas do Cliente', 1),
  @('[Onb A2.3] Buscar Etapas do Cliente', '[Onb A2.3] Localizar Seq 7 e Seq 8', 0),
  @('[Onb A2.3] Localizar Seq 7 e Seq 8', '[Onb A2.3] Avaliar via Gemini Pro', 0),
  @('[Onb A2.3] Avaliar via Gemini Pro', '[Onb A2.3] Normalizar Decisao', 0),
  @('[Onb A2.3] Normalizar Decisao', '[Onb A2.3] Roteador por Classe', 0),
  @('[Onb A2.3] Roteador por Classe', '[Onb A2.3] Preparar Atualizacoes Aprovado', 0),
  @('[Onb A2.3] Roteador por Classe', '[Onb A2.3] Preparar Atualizacoes Aprovado', 1),
  @('[Onb A2.3] Roteador por Classe', '[Onb A2.3] Preparar Atualizacoes Insuficiente', 2),
  @('[Onb A2.3] Telegram Aprovado/Lacunas', '[Onb A2.3] Responder 200 Aprovado', 0),
  @('[Onb A2.3] Telegram Insuficiente', '[Onb A2.3] Responder 200 Insuficiente', 0)
)

foreach ($edge in $expectedEdges) {
  $actual = Get-NextNodes $workflow $edge[0] $edge[2]
  if ($actual.Count -ne 1 -or $actual[0] -ne $edge[1]) {
    throw "Unexpected wiring from $($edge[0]) output $($edge[2]): $($actual -join ', ')"
  }
}

Write-Output 'Onboarding A2.3 workflow structural tests passed.'
