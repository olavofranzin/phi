$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\a2.11\workflow.json'
$sandboxPath = 'C:\tmp\phi_repo\onboarding\a2.11\sandbox_export.json'
$deliveryPath = 'C:\tmp\phi_repo\onboarding\a2.11\delivery.md'

foreach ($path in @($workflowPath, $sandboxPath, $deliveryPath)) {
  if (-not (Test-Path $path)) { throw "Missing required file: $path" }
}

foreach ($jsonPath in @($workflowPath, $sandboxPath)) {
  $bytes = [System.IO.File]::ReadAllBytes($jsonPath)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    throw "$jsonPath must be UTF-8 without BOM"
  }
}

$workflowRaw = [System.IO.File]::ReadAllText($workflowPath, [System.Text.Encoding]::UTF8)
$workflow = $workflowRaw | ConvertFrom-Json
$delivery = [System.IO.File]::ReadAllText($deliveryPath, [System.Text.Encoding]::UTF8)

if ($workflow.name -ne 'Onb - Disparar CSAT NPS') { throw "Unexpected workflow name: $($workflow.name)" }

$nodeMap = @{}
foreach ($node in $workflow.nodes) {
  $nodeMap[$node.name] = $node
  if ($node.name -notmatch '^\[Onb A2\.11\] ') { throw "Node does not use required prefix: $($node.name)" }
}

$requiredNodeNames = @(
  '[Onb A2.11] Schedule Trigger',
  '[Onb A2.11] Buscar Clientes Concluidos',
  '[Onb A2.11] Filtrar Clientes Elegiveis',
  '[Onb A2.11] Montar Mensagem e Links',
  '[Onb A2.11] Enviar via Evolution',
  '[Onb A2.11] Preparar Update Observacoes',
  '[Onb A2.11] Atualizar Observacoes Cliente',
  '[Onb A2.11] Consolidar Resultado'
)

foreach ($name in $requiredNodeNames) {
  if (-not $nodeMap.ContainsKey($name)) { throw "Workflow is missing node '$name'" }
}

if ($nodeMap['[Onb A2.11] Buscar Clientes Concluidos'].parameters.databaseId.value -ne '04e34a62624b484cbda546604564b88c') {
  throw 'Unexpected clientes DB ID'
}

$concluido = 'Conclu' + [char]0x00ED + 'do'
$filterCode = $nodeMap['[Onb A2.11] Filtrar Clientes Elegiveis'].parameters.jsCode
foreach ($requiredSnippet in @($concluido, 'A2.11 disparada em', 'observacoes_atual', 'cliente_page_id')) {
  if ($filterCode -notmatch [regex]::Escape($requiredSnippet)) { throw "Filter code is missing '$requiredSnippet'" }
}

$messageCode = $nodeMap['[Onb A2.11] Montar Mensagem e Links'].parameters.jsCode
foreach ($requiredSnippet in @('<CSAT_FORM_URL_redacted>', '<NPS_FORM_URL_redacted>', '<OLAVO_PHONE_redacted>', '#cliente=', '&cliente_nome=', 'encodeURIComponent', 'csat_link', 'nps_link')) {
  if ($messageCode -notmatch [regex]::Escape($requiredSnippet)) { throw "Message code is missing '$requiredSnippet'" }
}
foreach ($forbiddenSnippet in @('$env.', '?cliente=', 'form.typeform.com/to/fb87i1MP', 'form.typeform.com/to/q8b4parR')) {
  if ($messageCode -match [regex]::Escape($forbiddenSnippet)) { throw "Message code contains forbidden '$forbiddenSnippet'" }
}

$updateCode = $nodeMap['[Onb A2.11] Preparar Update Observacoes'].parameters.jsCode
foreach ($requiredSnippet in @('observacoes_atual', 'observacoes_finais', 'A2.11 disparada em', 'CSAT:', 'NPS:', 'Status Evolution:', '\n')) {
  if ($updateCode -notmatch [regex]::Escape($requiredSnippet)) { throw "Update code is missing '$requiredSnippet'" }
}
if ($updateCode -match '<br>') { throw 'A2.11 append must use newline, not <br>' }

$updateProps = $nodeMap['[Onb A2.11] Atualizar Observacoes Cliente'].parameters.propertiesUi.propertyValues
$observacoesKey = 'Observa' + [char]0x00E7 + [char]0x00F5 + 'es|rich_text'
if ($updateProps.Count -ne 1 -or $updateProps[0].key -ne $observacoesKey -or $updateProps[0].textContent -ne '={{ $json.observacoes_finais }}') {
  throw 'Atualizar Observacoes Cliente must update only Observacoes'
}

if ($workflowRaw -match [regex]::Escape('Status|select')) { throw 'A2.11 must not update Status' }
if (-not $nodeMap['[Onb A2.11] Enviar via Evolution'].continueOnFail) { throw 'Evolution node must use continueOnFail' }

foreach ($forbiddenText in @('relationValues', 'N8N_API_KEY', 'NOTION_API_KEY', 'Apikey ', '5511888880001', '<br>', '$env.', '?cliente=')) {
  if ($workflowRaw -match [regex]::Escape($forbiddenText)) { throw "workflow.json contains forbidden text '$forbiddenText'" }
}

$semanticTitle = 'Valida' + [char]0x00E7 + [char]0x00E3 + 'o sem' + [char]0x00E2 + 'ntica via Notion API'
foreach ($requiredText in @(
  $semanticTitle,
  ('Status PRESERVADO = "' + $concluido + '"'),
  'A2.11 disparada em',
  '#cliente=',
  'CSAT:',
  'NPS:',
  'exec_'
)) {
  if ($delivery -notmatch [regex]::Escape($requiredText)) { throw "delivery.md is missing required text '$requiredText'" }
}

Write-Output 'Onboarding A2.11 workflow structural tests passed.'
