$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\a2.2\workflow.json'
$sandboxPath = 'C:\tmp\phi_repo\onboarding\a2.2\sandbox_export.json'
$deliveryPath = 'C:\tmp\phi_repo\onboarding\a2.2\delivery.md'

foreach ($path in @($workflowPath, $sandboxPath, $deliveryPath)) {
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
$delivery = [System.IO.File]::ReadAllText($deliveryPath, [System.Text.Encoding]::UTF8)

if ($workflow.name -ne 'Onb - Cobrar Form D+1') {
  throw "Unexpected workflow name: $($workflow.name)"
}

$nodeMap = @{}
foreach ($node in $workflow.nodes) {
  $nodeMap[$node.name] = $node
  if ($node.name -notmatch '^\[Onb A2\.2\] ') {
    throw "Node does not use required prefix: $($node.name)"
  }
}

$requiredNodeNames = @(
  '[Onb A2.2] Schedule Trigger',
  '[Onb A2.2] Buscar Etapas Cobranca',
  '[Onb A2.2] Filtrar Etapas Elegiveis',
  '[Onb A2.2] Obter Cliente da Etapa',
  '[Onb A2.2] Montar Mensagem',
  '[Onb A2.2] Enviar Cobranca Evolution',
  '[Onb A2.2] Preparar Update Etapa',
  '[Onb A2.2] Atualizar Status Etapa',
  '[Onb A2.2] Consolidar Resultado'
)

foreach ($name in $requiredNodeNames) {
  if (-not $nodeMap.ContainsKey($name)) {
    throw "Workflow is missing node '$name'"
  }
}

if ($nodeMap['[Onb A2.2] Buscar Etapas Cobranca'].parameters.databaseId.value -ne '6eb4565b4f1d498c8b2978e0c80880fd') {
  throw 'Unexpected etapas DB ID in Buscar Etapas Cobranca'
}

if ($nodeMap['[Onb A2.2] Obter Cliente da Etapa'].parameters.pageId.value -ne '={{ $json.cliente_page_id }}') {
  throw 'Obter Cliente da Etapa must use cliente_page_id'
}

$updateProps = $nodeMap['[Onb A2.2] Atualizar Status Etapa'].parameters.propertiesUi.propertyValues
if (-not ($updateProps | Where-Object { $_.key -eq 'Status|select' -and $_.selectValue -eq 'Em andamento' })) {
  throw 'Atualizar Status Etapa must set Status=Em andamento'
}
$observacoesKey = 'Observa' + [char]0x00E7 + [char]0x00F5 + 'es|rich_text'
if (-not ($updateProps | Where-Object { $_.key -eq $observacoesKey -and $_.textContent -eq '={{ $json.observacoes }}' })) {
  throw 'Atualizar Status Etapa must set Observacoes from observacoes'
}

if (-not $nodeMap['[Onb A2.2] Enviar Cobranca Evolution'].continueOnFail) {
  throw 'Enviar Cobranca Evolution must use continueOnFail'
}

foreach ($forbiddenText in @('relationValues', 'N8N_API_KEY', 'NOTION_API_KEY', 'Apikey ')) {
  if ($workflowRaw -match [regex]::Escape($forbiddenText)) {
    throw "workflow.json contains forbidden text '$forbiddenText'"
  }
}

$semanticTitle = 'Valida' + [char]0x00E7 + [char]0x00E3 + 'o sem' + [char]0x00E2 + 'ntica via Notion API'
foreach ($requiredText in @(
  $semanticTitle,
  'Status = "Em andamento"',
  'Status Evolution:',
  'Cliente relation',
  'exec_'
)) {
  if ($delivery -notmatch [regex]::Escape($requiredText)) {
    throw "delivery.md is missing required text '$requiredText'"
  }
}

Write-Output 'Onboarding A2.2 workflow structural tests passed.'
