$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$base = Join-Path $PSScriptRoot 'execucao/lote1'
$workflowDirs = @(
  'intake-pacing',
  'orquestrador',
  'qualitygate-pacing'
)

function Read-Workflow($dir) {
  $workflowPath = Join-Path $base "$dir/workflow.json"
  $sandboxPath = Join-Path $base "$dir/sandbox_export.json"
  if (-not (Test-Path $workflowPath)) { throw "Missing workflow.json for $dir" }
  if (-not (Test-Path $sandboxPath)) { throw "Missing sandbox_export.json for $dir" }

  $workflowHash = (Get-FileHash -Algorithm SHA256 $workflowPath).Hash
  $sandboxHash = (Get-FileHash -Algorithm SHA256 $sandboxPath).Hash
  if ($workflowHash -ne $sandboxHash) {
    throw "workflow.json and sandbox_export.json must be byte-identical for $dir"
  }

  $bytes = [System.IO.File]::ReadAllBytes($workflowPath)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    throw "$dir workflow has UTF-8 BOM"
  }

  $raw = [System.Text.Encoding]::UTF8.GetString($bytes)
  $forbiddenPatterns = @(
    ('AI' + 'za'),
    ('api' + '_' + 'key'),
    ('tok' + 'en'),
    ('N' + [char]0x00c3),
    ([string][char]0x00c3 + [char]0x00a3),
    ([string][char]0x00c3 + [char]0x00a7),
    ([string][char]0x00c3 + [char]0x00a9),
    ([string][char]0x00c3 + [char]0x00b3)
  )
  foreach ($forbidden in $forbiddenPatterns) {
    if ($raw.Contains($forbidden)) { throw "$dir contains forbidden text: $forbidden" }
  }
  if ($raw -match 'KpPCTsYPAvGXGfp2|pHCHzZTP2yReQXb6|cZNPIzF5ZCMrpnDr') {
    throw "$dir contains live credential ids"
  }
  if ($raw -match 'notionApi' -and $raw -notmatch '<credential_id_redacted>') {
    throw "$dir must use redacted Notion credential placeholder"
  }
  if ($raw -match 'telegramApi' -and $raw -notmatch '<TELEGRAM_CREDENTIAL_ID_redacted>') {
    throw "$dir must use redacted Telegram credential placeholder"
  }
  if ($raw -match 'googlePalmApi' -and $raw -notmatch '<GEMINI_CREDENTIAL_ID_redacted>') {
    throw "$dir must use redacted Gemini credential placeholder"
  }

  return ($raw | ConvertFrom-Json)
}

function Node-Map($workflow) {
  $map = @{}
  foreach ($node in $workflow.nodes) { $map[$node.name] = $node }
  return $map
}

function Incoming-Main($workflow, $targetName) {
  $incoming = @()
  foreach ($from in $workflow.connections.PSObject.Properties.Name) {
    $main = $workflow.connections.$from.main
    for ($outputIndex = 0; $outputIndex -lt $main.Count; $outputIndex++) {
      foreach ($edge in $main[$outputIndex]) {
        if ($edge.node -eq $targetName) {
          $incoming += [pscustomobject]@{ From = $from; InputIndex = [int]$edge.index; OutputIndex = $outputIndex }
        }
      }
    }
  }
  return $incoming
}

function Assert-ActiveFalse($workflow, $dir) {
  if ($workflow.active -ne $false) { throw "$dir must have active:false" }
}

function Assert-CodeNodesSingleInput($workflow, $dir) {
  foreach ($node in $workflow.nodes | Where-Object { $_.type -in @('n8n-nodes-base.code', 'n8n-nodes-base.function', 'n8n-nodes-base.functionItem') }) {
    $incoming = @(Incoming-Main $workflow $node.name)
    if ($incoming.Count -gt 1) {
      throw "$dir Code/Function node '$($node.name)' receives $($incoming.Count) direct inputs without consolidating Merge"
    }
  }
}

function Assert-TelegramHtml($node, $dir) {
  if ($node.type -ne 'n8n-nodes-base.telegram') { throw "$dir node $($node.name) must be Telegram" }
  if ($node.parameters.chatId -ne '<TELEGRAM_CHAT_ID_redacted>') { throw "$dir Telegram chatId must be redacted" }
  if ($node.parameters.additionalFields.parse_mode -ne 'HTML') { throw "$dir Telegram must use parse_mode HTML" }
  if ($node.parameters.text -isnot [string]) { throw "$dir Telegram text must be a single string expression" }
}

$intake = Read-Workflow 'intake-pacing'
$orq = Read-Workflow 'orquestrador'
$qg = Read-Workflow 'qualitygate-pacing'
$intakeWf = Join-Path $base 'intake-pacing/workflow.json'
$orqWf = Join-Path $base 'orquestrador/workflow.json'
$qgWf = Join-Path $base 'qualitygate-pacing/workflow.json'

foreach ($pair in @(@($intake, 'intake-pacing'), @($orq, 'orquestrador'), @($qg, 'qualitygate-pacing'))) {
  Assert-ActiveFalse $pair[0] $pair[1]
  Assert-CodeNodesSingleInput $pair[0] $pair[1]
}

$intakeMap = Node-Map $intake
foreach ($required in @(
  '[Exec Intake] Webhook Pacing Alert',
  '[Exec Intake] Validar Secret',
  '[Exec Intake] Secret Valido?',
  '[Exec Intake] Buscar SOP Vigente',
  '[Exec Intake] Normalizar SOP Vigente',
  '[Exec Intake] Buscar Demandas Existentes',
  '[Exec Intake] Preparar Demanda e Evento',
  '[Exec Intake] Criar Demanda',
  '[Exec Intake] Criar Evento demanda.criada',
  '[Exec Intake] Enviar Telegram Critico'
)) {
  if (-not $intakeMap.ContainsKey($required)) { throw "Intake missing node $required" }
}
if ($intakeMap['[Exec Intake] Webhook Pacing Alert'].parameters.path -ne 'pacing-alert') {
  throw 'Intake webhook path must be pacing-alert'
}
$secretCode = [string]$intakeMap['[Exec Intake] Validar Secret'].parameters.jsCode
foreach ($snippet in @('<EXEC_WEBHOOK_KEY_redacted>', 'x-pacing-secret', 'secret_present', 'ok_pre_inject')) {
  if (-not $secretCode.Contains($snippet)) { throw "Intake secret guard missing snippet $snippet" }
}
$secretOutputs = $intake.connections.'[Exec Intake] Secret Valido?'.main
if ($secretOutputs.Count -ne 2) {
  throw 'Intake Secret Valido? must have true/false outputs'
}
if ($secretOutputs[0][0].node -ne '[Exec Intake] Validar Payload') {
  throw 'Intake Secret Valido? true branch must go to Validar Payload'
}
if ($secretOutputs[1][0].node -ne '[Exec Intake] Responder 401') {
  throw 'Intake Secret Valido? false branch must go to Responder 401'
}
$intakeCode = [string]$intakeMap['[Exec Intake] Preparar Demanda e Evento'].parameters.jsCode
foreach ($snippet in @('Pacing/verba', 'Critica', 'v0.3-2026-06-14', '23:59:00-03:00', 'existingKeys', 'versao_sop_aplicada', 'tenant_id', 'client_id', 'execution_id')) {
  if (-not $intakeCode.Contains($snippet)) { throw "Intake code missing snippet $snippet" }
}
Assert-TelegramHtml $intakeMap['[Exec Intake] Enviar Telegram Critico'] 'intake-pacing'

$orqMap = Node-Map $orq
foreach ($required in @(
  '[Exec Orq] Schedule 08 BR',
  '[Exec Orq] Manual Trigger',
  '[Exec Orq] Buscar SOP Vigente',
  '[Exec Orq] Buscar Demandas Abertas',
  '[Exec Orq] Calcular Prioridade Pro',
  '[Exec Orq] Atualizar Demanda Priorizada',
  '[Exec Orq] Criar Evento demanda.priorizada'
)) {
  if (-not $orqMap.ContainsKey($required)) { throw "Orquestrador missing node $required" }
}
$orqCode = [string]$orqMap['[Exec Orq] Calcular Prioridade Pro'].parameters.jsCode
foreach ($snippet in @('Critica', '100', 'Recorrente diaria', '50', 'Recorrente semanal', '30', 'Ad-hoc padrao', '20', 'prioridade_origem', 'agente', 'demanda.priorizada', 'tier_agente: ''pro''')) {
  if (-not $orqCode.Contains($snippet)) { throw "Orquestrador code missing snippet $snippet" }
}
$geminiPro = $orq.nodes | Where-Object { $_.name -eq '[Exec Orq] Gemini Pro Sequencia do Dia' }
if (-not $geminiPro -or $geminiPro.parameters.modelId.value -notmatch 'pro') {
  throw 'Orquestrador must declare Gemini Pro tier node'
}

# === a04-orq ===
$orqWf = Join-Path $base 'orquestrador/workflow.json'
$rawOrq = [System.IO.File]::ReadAllText($orqWf, [System.Text.Encoding]::UTF8)
$wfOrq = $rawOrq | ConvertFrom-Json
$orqMap = @{}
foreach ($n in $wfOrq.nodes) { $orqMap[$n.name] = $n }

# 0 HTTP Request pra api.notion.com no Orq
$httpNotionOrq = $wfOrq.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.httpRequest' -and
  $_.parameters.url -is [string] -and
  $_.parameters.url.Contains('api.notion.com')
}
if ($httpNotionOrq) { throw "orquestrador/workflow.json still has HTTP Request to api.notion.com (a04-orq refactor incomplete)" }

# 1 Notion update + 1 Notion create
$notionUpdate = @($wfOrq.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'update'
})
$notionCreate = @($wfOrq.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'create'
})
if ($notionUpdate.Count -ne 1) { throw "Orq expected 1 Notion update node, got $($notionUpdate.Count)" }
if ($notionCreate.Count -ne 1) { throw "Orq expected 1 Notion create node, got $($notionCreate.Count)" }

foreach ($n in $notionUpdate) {
  if (-not $n.parameters.pageId) { throw "Orq Notion update '$($n.name)' missing pageId" }
  if ($n.parameters.pageId.mode -ne 'id') { throw "Orq Notion update '$($n.name)' pageId.mode != 'id'" }
}
foreach ($n in $notionCreate) {
  $dbVal = $n.parameters.databaseId.value
  if (-not ($dbVal -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) {
    throw "Orq Notion node '$($n.name)' databaseId.value not UUID: $dbVal"
  }
  if ($dbVal -eq '3423df0d-77df-4834-bdda-c08ddbae40ff') {
    throw "Orq Notion '$($n.name)' uses Eventos data_source_id ($dbVal) instead of page_id (c64f600e-...)"
  }
}

# alwaysOutputData false/ausente nos 2 search nodes
$searchOrq = $wfOrq.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'getAll'
}
foreach ($n in $searchOrq) {
  if ($n.alwaysOutputData -eq $true) {
    throw "Orq node '$($n.name)' has alwaysOutputData=true (a04-orq fix #1)"
  }
}

# Calcular Prioridade Pro: sem update_body, sem event_body, com guards
$prioridadeCode = [string]$orqMap['[Exec Orq] Calcular Prioridade Pro'].parameters.jsCode
if ($prioridadeCode.Contains('update_body')) {
  throw "Orq Calcular Prioridade Pro ainda tem update_body  refactor incompleto"
}
if ($prioridadeCode.Contains('event_body')) {
  throw "Orq Calcular Prioridade Pro ainda tem event_body  refactor incompleto"
}
if (-not $prioridadeCode.Contains('if (!demanda_id) throw')) {
  throw "Orq Calcular Prioridade Pro sem guard demanda_id (fix #4)"
}
if (-not $prioridadeCode.Contains('.toISOString().slice(0, 10)')) {
  throw "Orq Calcular Prioridade Pro utcNow nao date-only (fix #3)"
}
if (-not $prioridadeCode.Contains("novo_estado: 'Priorizada'")) {
  throw "Orq Calcular Prioridade Pro sem novo_estado no top-level"
}

# Restaurar Payload Priorizacao preservado
$restaurarCode = [string]$orqMap['[Exec Orq] Restaurar Payload Priorizacao'].parameters.jsCode
if (-not $restaurarCode.Contains("`$('[Exec Orq] Calcular Prioridade Pro').all().map")) {
  throw "Orq Restaurar Payload Priorizacao foi alterado (deveria estar intocado)"
}

# Criar Evento Notion create usa .all().find() pareando por demanda_id
$createEvent = $orqMap['[Exec Orq] Criar Evento demanda.priorizada']
$dynamicWithFind = 0
foreach ($p in $createEvent.parameters.propertiesUi.propertyValues) {
  if ($p.key -eq 'entidade_area|select') { continue }
  $val = if ($p.title) { $p.title } elseif ($p.textContent) { $p.textContent } elseif ($p.selectValue) { $p.selectValue } elseif ($p.date) { $p.date } else { '' }
  if ($val -is [string] -and $val.StartsWith('=')) {
    if (-not $val.Contains("`$('[Exec Orq] Restaurar Payload Priorizacao').all().find")) {
      throw "Orq Criar Evento property '$($p.key)' nao usa .all().find (fix #2)"
    }
    if (-not $val.Contains("o.json.demanda_id === `$json.id")) {
      throw "Orq Criar Evento property '$($p.key)' nao pareia por demanda_id (fix #2)"
    }
    $dynamicWithFind++
  }
}
if ($dynamicWithFind -ne 8) {
  throw "Orq Criar Evento esperava 8 expressions dinamicos via .all().find(), got $dynamicWithFind"
}

$qgMap = Node-Map $qg
foreach ($required in @(
  '[Exec QG] Schedule 5 min',
  '[Exec QG] Buscar SOP Vigente',
  '[Exec QG] Buscar Demandas Em Revisao',
  '[Exec QG] Montar Evento demanda.em_revisao',
  '[Exec QG] Criar Evento demanda.em_revisao',
  '[Exec QG] Validar DoD Pacing Flash',
  '[Exec QG] Resultado PASS?',
  '[Exec QG] Marcar Entregue',
  '[Exec QG] Criar Evento demanda.entregue',
  '[Exec QG] Reabrir Demanda',
  '[Exec QG] Criar Evento demanda.reaberta',
  '[Exec QG] Telegram Checklist FAIL'
)) {
  if (-not $qgMap.ContainsKey($required)) { throw "QualityGate missing node $required" }
}
$qgCode = [string]$qgMap['[Exec QG] Validar DoD Pacing Flash'].parameters.jsCode
foreach ($snippet in @('Diagnostico da anomalia', 'Acao tomada OU justificativa', 'Registro de impacto esperado', 'Audit (execution_id + fonte)', 'quality_gate', 'pass', 'fail', 'demanda.entregue', 'demanda.reaberta', 'tier_agente: ''flash''')) {
  if (-not $qgCode.Contains($snippet)) { throw "QualityGate code missing snippet $snippet" }
}
$geminiFlash = $qg.nodes | Where-Object { $_.name -eq '[Exec QG] Gemini Flash DoD Pacing' }
if (-not $geminiFlash -or $geminiFlash.parameters.modelId.value -notmatch 'flash') {
  throw 'QualityGate must declare Gemini Flash tier node'
}
Assert-TelegramHtml $qgMap['[Exec QG] Telegram Checklist FAIL'] 'qualitygate-pacing'

# === a04-intake ===
$intakeWf = Join-Path $base 'intake-pacing/workflow.json'
$rawIntake = [System.IO.File]::ReadAllText($intakeWf, [System.Text.Encoding]::UTF8)
$wfIntake = $rawIntake | ConvertFrom-Json
$intakeMap = @{}
foreach ($n in $wfIntake.nodes) { $intakeMap[$n.name] = $n }

# 0 HTTP Request pra api.notion.com no Intake
$httpNotionIntake = $wfIntake.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.httpRequest' -and
  $_.parameters.url -is [string] -and
  $_.parameters.url.Contains('api.notion.com')
}
if ($httpNotionIntake) { throw "intake-pacing/workflow.json still has HTTP Request to api.notion.com (a04-intake refactor incomplete)" }

# 2 Notion novos (1 create Demandas + 1 create Eventos) + 2 search preservados (getAll)
$notionCreate = $wfIntake.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'create'
}
if ($notionCreate.Count -ne 2) { throw "Intake expected 2 Notion create nodes, got $($notionCreate.Count)" }

foreach ($n in $notionCreate) {
  $dbVal = $n.parameters.databaseId.value
  if (-not ($dbVal -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) {
    throw "Intake Notion node '$($n.name)' databaseId.value not UUID: $dbVal"
  }
  if ($dbVal -eq '3423df0d-77df-4834-bdda-c08ddbae40ff') {
    throw "Intake Notion '$($n.name)' uses Eventos data_source_id ($dbVal) instead of page_id (c64f600e-...)"
  }
}

# alwaysOutputData false/ausente nos 2 search nodes
$searchIntake = $wfIntake.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'getAll'
}
foreach ($n in $searchIntake) {
  if ($n.alwaysOutputData -eq $true) {
    throw "Intake node '$($n.name)' has alwaysOutputData=true (a04-intake fix #1)"
  }
}

# Preparar Demanda e Evento: sem demanda_body, sem event aninhado
$prepCode = [string]$intakeMap['[Exec Intake] Preparar Demanda e Evento'].parameters.jsCode
if ($prepCode.Contains('demanda_body')) {
  throw "Intake Preparar Demanda e Evento ainda tem demanda_body  refactor incompleto"
}
if (-not $prepCode.Contains('demanda_titulo')) {
  throw "Intake Preparar Demanda e Evento sem demanda_titulo no top-level"
}
if (-not $prepCode.Contains('prioridade: 100')) {
  throw "Intake Preparar Demanda e Evento sem prioridade no top-level"
}

# Montar Evento demanda.criada: sem event_body, com guard page.id, utcNow date-only
$montarCode = [string]$intakeMap['[Exec Intake] Montar Evento demanda.criada'].parameters.jsCode
if ($montarCode.Contains('event_body')) {
  throw "Intake Montar Evento ainda tem event_body  refactor incompleto"
}
if (-not $montarCode.Contains('if (!demanda_id) throw')) {
  throw "Intake Montar Evento sem guard demanda_id (fix #4)"
}
if (-not $montarCode.Contains('.toISOString().slice(0, 10)')) {
  throw "Intake Montar Evento utcNow nao date-only (fix #3)"
}

# Telegram com fallback (sem texto) + lookup via Montar Evento
$telegramText = [string]$intakeMap['[Exec Intake] Enviar Telegram Critico'].parameters.text
if (-not $telegramText.Contains("`$('[Exec Intake] Montar Evento demanda.criada').first()")) {
  throw "Intake Telegram nao referencia Montar Evento via .first() (fix #2)"
}
if (-not $telegramText.Contains("'(sem texto)'")) {
  throw "Intake Telegram sem fallback '(sem texto)' (fix #5)"
}

# Responder 201 usa lookup ao Montar Evento
$resp201 = [string]$intakeMap['[Exec Intake] Responder 201'].parameters.responseBody
if (-not $resp201.Contains("`$('[Exec Intake] Montar Evento demanda.criada').first().json.demanda_id")) {
  throw "Intake Responder 201 ainda usa `$json.demanda_id direto  Notion native substituiu o item upstream"
}

# generate_export.js: DB_DEMANDAS_PAGE/DB_DEMANDAS_NAME presentes
$generatorPath = Join-Path $base 'generate_export.js'
$generator = [System.IO.File]::ReadAllText($generatorPath, [System.Text.Encoding]::UTF8)
if (-not $generator.Contains("DB_DEMANDAS_PAGE = 'a5c6b6ae-3e9c-4619-a3c3-48e58c75c25b'")) {
  throw "generate_export.js sem DB_DEMANDAS_PAGE"
}
if (-not $generator.Contains("DB_DEMANDAS_NAME = 'PHI - Demandas'")) {
  throw "generate_export.js sem DB_DEMANDAS_NAME"
}

# a04-qg: QualityGate must use native Notion nodes instead of direct Notion HTTP calls.
$rawQg = [System.IO.File]::ReadAllText($qgWf, [System.Text.Encoding]::UTF8)
$wfQg = $rawQg | ConvertFrom-Json

$httpNotion = $wfQg.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.httpRequest' -and
  $_.parameters.url -is [string] -and
  $_.parameters.url.Contains('api.notion.com')
}
if ($httpNotion) { throw "qualitygate-pacing/workflow.json still has HTTP Request to api.notion.com (a04-qg refactor incomplete)" }

$notionCreate = $wfQg.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'create'
}
foreach ($n in $notionCreate) {
  $dbVal = $n.parameters.databaseId.value
  if (-not ($dbVal -match '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')) {
    throw "QG Notion node '$($n.name)' databaseId.value not UUID: $dbVal"
  }
  if ($dbVal -eq '3423df0d-77df-4834-bdda-c08ddbae40ff') {
    throw "QG Notion '$($n.name)' uses Eventos data_source_id ($dbVal) instead of page_id (c64f600e-...)"
  }
}

$notionUpdate = $wfQg.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'update'
}
foreach ($n in $notionUpdate) {
  if (-not $n.parameters.pageId) { throw "QG Notion update '$($n.name)' missing pageId" }
  if ($n.parameters.pageId.mode -ne 'id') { throw "QG Notion update '$($n.name)' pageId.mode != 'id'" }
}

if ($notionCreate.Count -ne 3) { throw "QG expected 3 Notion create nodes, got $($notionCreate.Count)" }
if ($notionUpdate.Count -ne 2) { throw "QG expected 2 Notion update nodes, got $($notionUpdate.Count)" }

$preserved = @(
  '[Exec QG] Schedule 5 min',
  '[Exec QG] Buscar SOP Vigente',
  '[Exec QG] Buscar Demandas Em Revisao',
  '[Exec QG] Montar Evento demanda.em_revisao',
  '[Exec QG] Gemini Flash DoD Pacing',
  '[Exec QG] Validar DoD Pacing Flash',
  '[Exec QG] Restaurar Payload DoD',
  '[Exec QG] Resultado PASS?',
  '[Exec QG] Telegram Checklist FAIL'
)
foreach ($name in $preserved) {
  if (-not ($wfQg.nodes | Where-Object { $_.name -eq $name })) {
    throw "QG missing preserved node: $name"
  }
}

if (-not ($wfQg.connections.'[Exec QG] Resultado PASS?'.main[0][0].node -eq '[Exec QG] Marcar Entregue')) {
  throw "QG PASS branch connection broken"
}
if (-not ($wfQg.connections.'[Exec QG] Resultado PASS?'.main[1][0].node -eq '[Exec QG] Reabrir Demanda')) {
  throw "QG FAIL branch connection broken"
}

$qgReviewCode = [string]($wfQg.nodes | Where-Object { $_.name -eq '[Exec QG] Montar Evento demanda.em_revisao' }).parameters.jsCode
foreach ($snippet in @('evento_tipo', 'entidade_id', 'payload_json', 'timestamp', 'execution_id', 'tenant_id', 'tier_agente', 'versao_sop_aplicada')) {
  if (-not $qgReviewCode.Contains($snippet)) { throw "QG review event code missing field $snippet" }
}
if ($qgReviewCode.Contains('event_body') -or $qgReviewCode.Contains('eventBody(')) {
  throw 'QG review event code still builds event_body'
}

$qgValidateNativeCode = [string]($wfQg.nodes | Where-Object { $_.name -eq '[Exec QG] Validar DoD Pacing Flash' }).parameters.jsCode
foreach ($snippet in @('novo_estado', 'payload_json', 'demanda.entregue', 'demanda.reaberta', 'Entregue', 'Em execucao')) {
  if (-not $qgValidateNativeCode.Contains($snippet)) { throw "QG validate code missing native Notion field $snippet" }
}
if ($qgValidateNativeCode.Contains('update_body') -or $qgValidateNativeCode.Contains('event_body') -or $qgValidateNativeCode.Contains('eventBody(')) {
  throw 'QG validate code still builds update_body/event_body'
}

# === a04-qg-fix-1 ===

$searchNodes = $wfQg.nodes | Where-Object {
  $_.type -eq 'n8n-nodes-base.notion' -and $_.parameters.operation -eq 'getAll'
}
foreach ($n in $searchNodes) {
  if ($n.alwaysOutputData -eq $true) {
    throw "QG node '$($n.name)' has alwaysOutputData=true (a04-qg-fix-1 #7/#8 - remover ou setar false)"
  }
}

$validarCode = [string]$qgMap['[Exec QG] Validar DoD Pacing Flash'].parameters.jsCode
if (-not $validarCode.Contains("`$('[Exec QG] Buscar Demandas Em Revisao').all()")) {
  throw "QG Validar DoD deve ler de `$('[Exec QG] Buscar Demandas Em Revisao').all() (a04-qg-fix-1 #1)"
}
if ($validarCode.Contains('for (const item of $input.all())')) {
  throw "QG Validar DoD ainda tem 'for (const item of `$input.all())' - fix #1 nao aplicado"
}

foreach ($nodeName in @('[Exec QG] Validar DoD Pacing Flash', '[Exec QG] Montar Evento demanda.em_revisao')) {
  $code = [string]$qgMap[$nodeName].parameters.jsCode
  if (-not $code.Contains(".toISOString().slice(0, 10)")) {
    throw "QG node '$nodeName' utcNow nao date-only (fix #2/#10)"
  }
}

$montarCode = [string]$qgMap['[Exec QG] Montar Evento demanda.em_revisao'].parameters.jsCode
if (-not $montarCode.Contains("if (!page.id) throw")) {
  throw "QG Montar Evento sem guard page.id (fix #9)"
}
if (-not $validarCode.Contains("if (!demanda_id) throw")) {
  throw "QG Validar DoD sem guard demanda_id (fix #3)"
}

if ($montarCode.Contains('...page')) {
  throw "QG Montar Evento ainda tem ...page no output (fix #9 cleanup)"
}

$createEntregue = $qgMap['[Exec QG] Criar Evento demanda.entregue']
$createReaberta = $qgMap['[Exec QG] Criar Evento demanda.reaberta']
foreach ($n in @($createEntregue, $createReaberta)) {
  $props = $n.parameters.propertiesUi.propertyValues
  $dynamicProps = $props | Where-Object { $_.key -ne 'entidade_area|select' }
  foreach ($p in $dynamicProps) {
    $val = if ($p.title) { $p.title } elseif ($p.textContent) { $p.textContent } elseif ($p.selectValue) { $p.selectValue } elseif ($p.date) { $p.date } else { '' }
    if ($val -is [string] -and $val.StartsWith('=')) {
      if ($val.Contains("`$json.") -and -not $val.Contains("`$('[Exec QG] Restaurar Payload DoD').all().find")) {
        throw "QG '$($n.name)' property '$($p.key)' ainda usa `$json.<X> (fix #4/#5 - trocar por .all().find)"
      }
      if (-not $val.Contains("o.json.demanda_id === `$json.id")) {
        throw "QG '$($n.name)' property '$($p.key)' nao pareia por demanda_id (fix #4/#5)"
      }
    }
  }
}

$telegramText = [string]$qgMap['[Exec QG] Telegram Checklist FAIL'].parameters.text
if (-not $telegramText.Contains("`$('[Exec QG] Restaurar Payload DoD').all().find")) {
  throw "QG Telegram text nao usa .all().find (fix #6)"
}
if (-not $telegramText.Contains("entidade_id.rich_text[0].text.content")) {
  throw "QG Telegram text nao pareia por entidade_id.rich_text (fix #6)"
}
if (-not $telegramText.Contains("'(sem texto)'")) {
  throw "QG Telegram text sem fallback '(sem texto)' (fix #6)"
}

$schemaPath = Join-Path $base 'notion_phi_eventos_schema.md'
if (-not (Test-Path $schemaPath)) { throw 'Missing PHI Eventos creation instructions' }
$schema = Get-Content -Raw $schemaPath
foreach ($snippet in @('PHI - Eventos', '9d6b65e5-c72b-82e7-856d-81bc34933316', 'tipo', 'entidade_id', 'payload_json', 'tier_agente', 'versao_sop_aplicada')) {
  if (-not $schema.Contains($snippet)) { throw "PHI Eventos schema instructions missing $snippet" }
}

foreach ($path in @($intakeWf, $orqWf, $qgWf)) {
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  if ($raw -match '\$env\.') {
    throw "$path must not use `$env (violates ADR-19; runtime n8n blocks `$env)"
  }
  if ($raw -match 'versao_sop_aplicada"\s*:\s*\{\s*"relation"') {
    throw "$path uses versao_sop_aplicada as relation; schema is rich_text"
  }
}

$intakeRaw = [System.IO.File]::ReadAllText($intakeWf, [System.Text.Encoding]::UTF8)
if (-not $intakeRaw.Contains('<EXEC_WEBHOOK_KEY_redacted>')) {
  throw 'Intake-Pacing must use <EXEC_WEBHOOK_KEY_redacted> placeholder (ADR-19 build-time injection)'
}
if (-not $intakeRaw.Contains('x-pacing-secret')) {
  throw 'Intake-Pacing must check x-pacing-secret header'
}

$orqRaw = [System.IO.File]::ReadAllText($orqWf, [System.Text.Encoding]::UTF8)
foreach ($snippet in @("classe_sla === 'Critica'", "classe_sla === 'Recorrente diaria'", "classe_sla === 'Recorrente semanal'", "classe_sla === 'Ad-hoc padrao'")) {
  if (-not $orqRaw.Contains($snippet)) {
    throw "Orquestrador priorityFor missing snippet: $snippet"
  }
}
if ($orqRaw -match "tipo === 'Recorrente diaria'" -or $orqRaw -match "tipo === 'Semanal'" -or $orqRaw -match "tipo === 'Ad-hoc'") {
  throw "Orquestrador priorityFor still uses 'tipo' or wrong class names"
}

$legacyEventosPaths = @($intakeWf) + @((Join-Path $base 'generate_export.js'))
foreach ($path in $legacyEventosPaths) {
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  if ($raw.Contains('PHI_EVENTOS_DATA_SOURCE_ID_pending_creation')) {
    throw "$path still contains PHI_EVENTOS placeholder"
  }
  if (-not $raw.Contains('3423df0d-77df-4834-bdda-c08ddbae40ff')) {
    throw "$path missing PHI - Eventos data source ID"
  }
}
if ($rawQg.Contains('PHI_EVENTOS_DATA_SOURCE_ID_pending_creation')) {
  throw "$qgWf still contains PHI_EVENTOS placeholder"
}
if ($rawQg.Contains('3423df0d-77df-4834-bdda-c08ddbae40ff')) {
  throw "$qgWf still uses PHI - Eventos data source ID instead of native page ID"
}
if (-not $rawQg.Contains('c64f600e-4f46-4b2b-ac22-c1e425c8966e')) {
  throw "$qgWf missing PHI - Eventos native page ID"
}
if (-not $rawOrq.Contains('c64f600e-4f46-4b2b-ac22-c1e425c8966e')) {
  throw "$orqWf missing PHI - Eventos native page ID"
}

# === a05-relations ===
# versao_sop_aplicada é relation nos 4 nodes do DB Demandas
$relationNodes = @{
  'intake' = '[Exec Intake] Criar Demanda'
  'orq' = '[Exec Orq] Atualizar Demanda Priorizada'
  'qg_entregue' = '[Exec QG] Marcar Entregue'
  'qg_reabrir' = '[Exec QG] Reabrir Demanda'
}

foreach ($key in $relationNodes.Keys) {
  $nodeName = $relationNodes[$key]
  if ($key -eq 'intake') { $wf = $wfIntake }
  elseif ($key -eq 'orq') { $wf = $wfOrq }
  else { $wf = $wfQg }
  $node = $wf.nodes | Where-Object { $_.name -eq $nodeName }
  if (-not $node) { throw "Node $nodeName not found" }
  $prop = $node.parameters.propertiesUi.propertyValues | Where-Object { $_.key -like 'versao_sop_aplicada*' }
  if (-not $prop) { throw "${nodeName}: missing versao_sop_aplicada propertyValue" }
  if ($prop.key -ne 'versao_sop_aplicada|relation') {
    throw "${nodeName}: versao_sop_aplicada key not 'relation' (got '$($prop.key)')"
  }
  if ($prop.type -ne 'relation') {
    throw "${nodeName}: versao_sop_aplicada type not 'relation' (got '$($prop.type)')"
  }
}

# versao_sop_aplicada nos eventos continua rich_text
$eventNodes = @(
  '[Exec Intake] Criar Evento demanda.criada',
  '[Exec Orq] Criar Evento demanda.priorizada',
  '[Exec QG] Criar Evento demanda.em_revisao',
  '[Exec QG] Criar Evento demanda.entregue',
  '[Exec QG] Criar Evento demanda.reaberta'
)
foreach ($evName in $eventNodes) {
  $node = $null
  foreach ($wfTmp in @($wfIntake, $wfOrq, $wfQg)) {
    $found = $wfTmp.nodes | Where-Object { $_.name -eq $evName }
    if ($found) { $node = $found; break }
  }
  if (-not $node) { throw "Event node $evName not found" }
  $prop = $node.parameters.propertiesUi.propertyValues | Where-Object { $_.key -like 'versao_sop_aplicada*' }
  if (-not $prop) { throw "${evName}: missing versao_sop_aplicada propertyValue" }
  if ($prop.key -ne 'versao_sop_aplicada|rich_text') {
    throw "${evName}: versao_sop_aplicada in events must stay rich_text (got '$($prop.key)')"
  }
}

Write-Host 'Execucao Lote 1 workflow structural tests passed.'
