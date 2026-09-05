$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\a2.9\workflow.json'
$sandboxPath = 'C:\tmp\phi_repo\onboarding\a2.9\sandbox_export.json'
$deliveryPath = 'C:\tmp\phi_repo\onboarding\a2.9\delivery.md'

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

if ($workflow.name -ne 'Onb - Cobrar Acessos Pos-Kickoff') {
  throw "Unexpected workflow name: $($workflow.name)"
}

$nodeMap = @{}
foreach ($node in $workflow.nodes) {
  $nodeMap[$node.name] = $node
  if ($node.name -notmatch '^\[Onb A2\.9\] ') {
    throw "Node does not use required prefix: $($node.name)"
  }
}

$requiredNodeNames = @(
  '[Onb A2.9] Schedule Trigger',
  '[Onb A2.9] Buscar Etapas Kickoff Concluidas',
  '[Onb A2.9] Filtrar Etapas Elegiveis',
  '[Onb A2.9] Obter Cliente da Etapa',
  '[Onb A2.9] Extrair Acessos Pendentes',
  '[Onb A2.9] Montar Mensagem',
  '[Onb A2.9] Enviar Cobranca Evolution',
  '[Onb A2.9] Preparar Update Observacoes',
  '[Onb A2.9] Atualizar Observacoes Etapa',
  '[Onb A2.9] Consolidar Resultado'
)

foreach ($name in $requiredNodeNames) {
  if (-not $nodeMap.ContainsKey($name)) { throw "Workflow is missing node '$name'" }
}

if ($nodeMap['[Onb A2.9] Buscar Etapas Kickoff Concluidas'].parameters.databaseId.value -ne '6eb4565b4f1d498c8b2978e0c80880fd') {
  throw 'Unexpected etapas DB ID'
}

if ($nodeMap['[Onb A2.9] Obter Cliente da Etapa'].parameters.pageId.value -ne '={{ $json.cliente_page_id }}') {
  throw 'Obter Cliente da Etapa must use cliente_page_id'
}

$concluido = 'Conclu' + [char]0x00ED + 'do'
$naoEspecificado = '(n' + [char]0x00E3 + 'o especificado na ata)'
$filterCode = $nodeMap['[Onb A2.9] Filtrar Etapas Elegiveis'].parameters.jsCode
foreach ($requiredSnippet in @('Conduzir call de kickoff e preencher ata', $concluido, 'Acessos pendentes:', 'A2.9 disparada em', 'clienteRelation.length > 0')) {
  if ($filterCode -notmatch [regex]::Escape($requiredSnippet)) { throw "Filter code is missing '$requiredSnippet'" }
}

$extractCode = $nodeMap['[Onb A2.9] Extrair Acessos Pendentes'].parameters.jsCode
foreach ($requiredSnippet in @('pendentes:', $naoEspecificado, 'acessos_pendentes')) {
  if ($extractCode -notmatch [regex]::Escape($requiredSnippet)) { throw "Extract code is missing '$requiredSnippet'" }
}

$messageCode = $nodeMap['[Onb A2.9] Montar Mensagem'].parameters.jsCode
foreach ($requiredSnippet in @('acessos_pendentes', '$env.OLAVO_PHONE')) {
  if ($messageCode -notmatch [regex]::Escape($requiredSnippet) -and $requiredSnippet -eq '$env.OLAVO_PHONE' -and $messageCode -notmatch [regex]::Escape('<OLAVO_PHONE_redacted>')) {
    throw 'Montar Mensagem must use $env.OLAVO_PHONE or sanitized sandbox value'
  } elseif ($requiredSnippet -ne '$env.OLAVO_PHONE' -and $messageCode -notmatch [regex]::Escape($requiredSnippet)) {
    throw "Montar Mensagem is missing '$requiredSnippet'"
  }
}

$updateCode = $nodeMap['[Onb A2.9] Preparar Update Observacoes'].parameters.jsCode
foreach ($requiredSnippet in @('observacoes_atual', 'observacoes_finais', 'A2.9 disparada em', 'Status Evolution:', '\n')) {
  if ($updateCode -notmatch [regex]::Escape($requiredSnippet)) { throw "Update code is missing '$requiredSnippet'" }
}
if ($updateCode -match '<br>') { throw 'A2.9 append must use newline, not <br>' }

$updateProps = $nodeMap['[Onb A2.9] Atualizar Observacoes Etapa'].parameters.propertiesUi.propertyValues
$observacoesKey = 'Observa' + [char]0x00E7 + [char]0x00F5 + 'es|rich_text'
if ($updateProps.Count -ne 1 -or $updateProps[0].key -ne $observacoesKey -or $updateProps[0].textContent -ne '={{ $json.observacoes_finais }}') {
  throw 'Atualizar Observacoes Etapa must update only Observacoes'
}

if ($workflowRaw -match [regex]::Escape('Status|select')) { throw 'A2.9 must not update Status' }
if (-not $nodeMap['[Onb A2.9] Enviar Cobranca Evolution'].continueOnFail) { throw 'Evolution node must use continueOnFail' }

foreach ($forbiddenText in @('relationValues', 'N8N_API_KEY', 'NOTION_API_KEY', 'Apikey ', '5511888880001', '<br>')) {
  if ($workflowRaw -match [regex]::Escape($forbiddenText)) { throw "workflow.json contains forbidden text '$forbiddenText'" }
}

$semanticTitle = 'Valida' + [char]0x00E7 + [char]0x00E3 + 'o sem' + [char]0x00E2 + 'ntica via Notion API'
foreach ($requiredText in @(
  $semanticTitle,
  ('Status PRESERVADO = "' + $concluido + '"'),
  'Acessos pendentes:',
  'A2.9 disparada em',
  'Cliente relation',
  'exec_'
)) {
  if ($delivery -notmatch [regex]::Escape($requiredText)) { throw "delivery.md is missing required text '$requiredText'" }
}

Write-Output 'Onboarding A2.9 workflow structural tests passed.'
