$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\a2.10\workflow.json'
$sandboxPath = 'C:\tmp\phi_repo\onboarding\a2.10\sandbox_export.json'

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

if ($workflow.name -ne 'Onb - Gate Validacao Final PASS FAIL') {
  throw "Unexpected workflow name: $($workflow.name)"
}

$nodeMap = @{}
foreach ($node in $workflow.nodes) {
  $nodeMap[$node.name] = $node
  if ($node.name -notmatch '^\[Onb A2\.10\] ') {
    throw "Node does not use required prefix: $($node.name)"
  }
}

$requiredNodeNames = @(
  '[Onb A2.10] Schedule Trigger',
  '[Onb A2.10] Buscar Etapas',
  '[Onb A2.10] Filtrar Elegiveis',
  '[Onb A2.10] Obter Cliente',
  '[Onb A2.10] Filtrar Cliente Ativo',
  '[Onb A2.10] Buscar seq 22 do Cliente',
  '[Onb A2.10] Buscar Sub-pagina Quadro',
  '[Onb A2.10] Preparar Quadro',
  '[Onb A2.10] Triage Modo',
  '[Onb A2.10] Criar Sub-pagina Template',
  '[Onb A2.10] Telegram Criacao',
  '[Onb A2.10] Ler Conteudo Quadro',
  '[Onb A2.10] Triage Conteudo Quadro',
  '[Onb A2.10] Roteador Conteudo',
  '[Onb A2.10] Telegram Alerta',
  '[Onb A2.10] Extrair Tabela',
  '[Onb A2.10] Avaliar via Gemini',
  '[Onb A2.10] Normalizar Decisao',
  '[Onb A2.10] Resultado PASS?',
  '[Onb A2.10] Atualizar Seq 21 PASS',
  '[Onb A2.10] Destravar Seq 22 se Bloqueada',
  '[Onb A2.10] Restaurar Telegram PASS',
  '[Onb A2.10] Telegram PASS',
  '[Onb A2.10] Atualizar Seq 21 FAIL',
  '[Onb A2.10] Bloquear Seq 22',
  '[Onb A2.10] Restaurar Telegram FAIL',
  '[Onb A2.10] Telegram FAIL'
)

foreach ($name in $requiredNodeNames) {
  if (-not $nodeMap.ContainsKey($name)) {
    throw "Workflow is missing node '$name'"
  }
}

$schedule = @($nodeMap['[Onb A2.10] Schedule Trigger'].parameters.rule.interval)[0]
if ($schedule.field -ne 'days' -or [int]$schedule.daysInterval -ne 1 -or [int]$schedule.triggerAtHour -ne 9) {
  throw 'Schedule Trigger must run daily at 09:00'
}

$etapas = $nodeMap['[Onb A2.10] Buscar Etapas']
if ($etapas.parameters.databaseId.value -ne '6eb4565b4f1d498c8b2978e0c80880fd' -or -not $etapas.parameters.returnAll -or $etapas.parameters.simple -ne $false) {
  throw 'Buscar Etapas must read all pages from DB Etapas with simple=false'
}

$filterCode = [string]$nodeMap['[Onb A2.10] Filtrar Elegiveis'].parameters.jsCode
if (-not $filterCode.Contains("'N\u00e3o iniciado'")) {
  throw "Filtrar Elegiveis must include ASCII-safe active status 'N\u00e3o iniciado'"
}
if ($workflowRaw -match 'N\?o|NÃ|Ã§|Ã£|Ã©|Ãª') {
  throw 'workflow.json contains mojibake'
}

$gemini = $nodeMap['[Onb A2.10] Avaliar via Gemini']
if ($gemini.type -ne '@n8n/n8n-nodes-langchain.googleGemini' -or $gemini.typeVersion -ne 1.2) {
  throw 'Avaliar via Gemini must use Google Gemini node v1.2'
}
if ($gemini.parameters.resource -ne 'text' -or $gemini.parameters.operation -ne 'message') {
  throw 'Gemini must use text/message'
}
if ($gemini.parameters.modelId.value -ne 'models/gemini-2.5-flash') {
  throw 'Gemini must use gemini-2.5-flash'
}
if (-not $gemini.continueOnFail -or -not $gemini.retryOnFail -or [int]$gemini.waitBetweenTries -ne 2000) {
  throw 'Gemini must continueOnFail, retryOnFail and waitBetweenTries=2000'
}
if ($gemini.credentials.googlePalmApi.id -ne '<GEMINI_CREDENTIAL_ID_redacted>') {
  throw 'Gemini must reference placeholder <GEMINI_CREDENTIAL_ID_redacted> (ADR-19 build-time injection)'
}

$normalizar = [string]$nodeMap['[Onb A2.10] Normalizar Decisao'].parameters.jsCode
foreach ($snippet in @('data.text', 'data.mergedResponse', 'data.content?.parts', 'JSON.parse', "resultado: 'FAIL'")) {
  if (-not $normalizar.Contains($snippet)) {
    throw "Normalizar Decisao missing guardrail snippet: $snippet"
  }
}

$telegramNames = @('[Onb A2.10] Telegram Criacao', '[Onb A2.10] Telegram Alerta', '[Onb A2.10] Telegram PASS', '[Onb A2.10] Telegram FAIL')
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

$failCode = [string]$nodeMap['[Onb A2.10] Preparar FAIL'].parameters.jsCode
$passCode = [string]$nodeMap['[Onb A2.10] Preparar PASS'].parameters.jsCode
if (-not $failCode.Contains("name: 'Bloqueado'")) {
  throw 'FAIL path must target Status Bloqueado'
}
if (-not $passCode.Contains("name: 'Pendente'")) {
  throw 'PASS unlock path must target Status Pendente'
}
$unlockIf = $nodeMap['[Onb A2.10] Deve Destravar Seq 22?'] | ConvertTo-Json -Depth 20
$unlock22 = $nodeMap['[Onb A2.10] Destravar Seq 22 se Bloqueada'] | ConvertTo-Json -Depth 20
$block22 = $nodeMap['[Onb A2.10] Bloquear Seq 22'] | ConvertTo-Json -Depth 20
foreach ($pair in @(
  @($unlockIf, 'Preparar PASS'),
  @($unlock22, 'Preparar PASS'),
  @($block22, 'Preparar FAIL')
)) {
  if (-not ([string]$pair[0]).Contains([string]$pair[1])) {
    throw "Post-update node must reference preserved data from $($pair[1])"
  }
}

function Get-NextNodes([object]$wf, [string]$nodeName, [int]$outputIndex = 0) {
  $conn = $wf.connections.$nodeName
  if (-not $conn -or -not $conn.main -or $conn.main.Count -le $outputIndex) {
    return @()
  }
  return ,@($conn.main[$outputIndex] | ForEach-Object { $_.node })
}

$expectedEdges = @(
  @('[Onb A2.10] Schedule Trigger', '[Onb A2.10] Buscar Etapas', 0),
  @('[Onb A2.10] Buscar Etapas', '[Onb A2.10] Filtrar Elegiveis', 0),
  @('[Onb A2.10] Filtrar Elegiveis', '[Onb A2.10] Obter Cliente', 0),
  @('[Onb A2.10] Obter Cliente', '[Onb A2.10] Filtrar Cliente Ativo', 0),
  @('[Onb A2.10] Filtrar Cliente Ativo', '[Onb A2.10] Buscar seq 22 do Cliente', 0),
  @('[Onb A2.10] Buscar seq 22 do Cliente', '[Onb A2.10] Buscar Sub-pagina Quadro', 0),
  @('[Onb A2.10] Buscar Sub-pagina Quadro', '[Onb A2.10] Preparar Quadro', 0),
  @('[Onb A2.10] Preparar Quadro', '[Onb A2.10] Triage Modo', 0),
  @('[Onb A2.10] Triage Modo', '[Onb A2.10] Criar Sub-pagina Template', 0),
  @('[Onb A2.10] Triage Modo', '[Onb A2.10] Ler Conteudo Quadro', 1),
  @('[Onb A2.10] Criar Sub-pagina Template', '[Onb A2.10] Montar Telegram Criacao', 0),
  @('[Onb A2.10] Montar Telegram Criacao', '[Onb A2.10] Telegram Criacao', 0),
  @('[Onb A2.10] Ler Conteudo Quadro', '[Onb A2.10] Triage Conteudo Quadro', 0),
  @('[Onb A2.10] Triage Conteudo Quadro', '[Onb A2.10] Roteador Conteudo', 0),
  @('[Onb A2.10] Roteador Conteudo', '[Onb A2.10] Montar Telegram Alerta', 0),
  @('[Onb A2.10] Roteador Conteudo', '[Onb A2.10] Extrair Tabela', 1),
  @('[Onb A2.10] Extrair Tabela', '[Onb A2.10] Avaliar via Gemini', 0),
  @('[Onb A2.10] Avaliar via Gemini', '[Onb A2.10] Normalizar Decisao', 0),
  @('[Onb A2.10] Normalizar Decisao', '[Onb A2.10] Resultado PASS?', 0),
  @('[Onb A2.10] Resultado PASS?', '[Onb A2.10] Preparar PASS', 0),
  @('[Onb A2.10] Resultado PASS?', '[Onb A2.10] Preparar FAIL', 1),
  @('[Onb A2.10] Preparar PASS', '[Onb A2.10] Atualizar Seq 21 PASS', 0),
  @('[Onb A2.10] Atualizar Seq 21 PASS', '[Onb A2.10] Deve Destravar Seq 22?', 0),
  @('[Onb A2.10] Deve Destravar Seq 22?', '[Onb A2.10] Destravar Seq 22 se Bloqueada', 0),
  @('[Onb A2.10] Deve Destravar Seq 22?', '[Onb A2.10] Restaurar Telegram PASS', 1),
  @('[Onb A2.10] Destravar Seq 22 se Bloqueada', '[Onb A2.10] Restaurar Telegram PASS', 0),
  @('[Onb A2.10] Restaurar Telegram PASS', '[Onb A2.10] Telegram PASS', 0),
  @('[Onb A2.10] Preparar FAIL', '[Onb A2.10] Atualizar Seq 21 FAIL', 0),
  @('[Onb A2.10] Atualizar Seq 21 FAIL', '[Onb A2.10] Bloquear Seq 22', 0),
  @('[Onb A2.10] Bloquear Seq 22', '[Onb A2.10] Restaurar Telegram FAIL', 0),
  @('[Onb A2.10] Restaurar Telegram FAIL', '[Onb A2.10] Telegram FAIL', 0)
)

foreach ($edge in $expectedEdges) {
  $actual = Get-NextNodes $workflow $edge[0] $edge[2]
  if ($actual.Count -ne 1 -or $actual[0] -ne $edge[1]) {
    throw "Unexpected wiring from $($edge[0]) output $($edge[2]): $($actual -join ', ')"
  }
}

Write-Output 'Onboarding A2.10 workflow structural tests passed.'
