$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\a2.1\workflow.json'
$deliveryPath = 'C:\tmp\phi_repo\onboarding\a2.1\delivery.md'

if (-not (Test-Path $workflowPath)) {
  throw "Missing workflow file: $workflowPath"
}
if (-not (Test-Path $deliveryPath)) {
  throw "Missing delivery file: $deliveryPath"
}

$workflowBytes = [System.IO.File]::ReadAllBytes($workflowPath)
if ($workflowBytes.Length -ge 3 -and $workflowBytes[0] -eq 0xEF -and $workflowBytes[1] -eq 0xBB -and $workflowBytes[2] -eq 0xBF) {
  throw 'workflow.json must be UTF-8 without BOM'
}

$workflowRaw = [System.Text.Encoding]::UTF8.GetString($workflowBytes)
$workflow = $workflowRaw | ConvertFrom-Json
$delivery = [System.IO.File]::ReadAllText($deliveryPath, [System.Text.Encoding]::UTF8)

if ($workflow.name -ne 'Onb - Briefing to Client') {
  throw "Unexpected workflow name: $($workflow.name)"
}

$requiredNodeNames = @(
  '[Onb A2.1] Webhook Briefing',
  '[Onb A2.1] Validar Payload',
  '[Onb A2.1] Buscar Clientes Ativos',
  '[Onb A2.1] Detectar Duplicidade',
  '[Onb A2.1] Notificar Duplicidade Olavo',
  '[Onb A2.1] Criar Cliente',
  '[Onb A2.1] Ler Etapas A1',
  '[Onb A2.1] Binario para JSON Etapas',
  '[Onb A2.1] Montar Itens Etapas',
  '[Onb A2.1] Criar Etapa',
  '[Onb A2.1] Notificar Falha Etapas Olavo',
  '[Onb A2.1] Responder 201',
  '[Onb A2.1] Responder 409'
)

$nodeMap = @{}
foreach ($node in $workflow.nodes) {
  $nodeMap[$node.name] = $node
  if ($node.name -notmatch '^\[Onb A2\.1\] ') {
    throw "Node does not use required prefix: $($node.name)"
  }
}

foreach ($name in $requiredNodeNames) {
  if (-not $nodeMap.ContainsKey($name)) {
    throw "Workflow is missing node '$name'"
  }
}

if ($nodeMap['[Onb A2.1] Buscar Clientes Ativos'].parameters.databaseId.value -ne '04e34a62624b484cbda546604564b88c') {
  throw 'Unexpected clientes DB ID in Buscar Clientes Ativos'
}
if ($nodeMap['[Onb A2.1] Criar Cliente'].parameters.databaseId.value -ne '04e34a62624b484cbda546604564b88c') {
  throw 'Unexpected clientes DB ID in Criar Cliente'
}
if ($nodeMap['[Onb A2.1] Criar Etapa'].parameters.databaseId.value -ne '6eb4565b4f1d498c8b2978e0c80880fd') {
  throw 'Unexpected etapas DB ID in Criar Etapa'
}

$criarEtapaProperties = $nodeMap['[Onb A2.1] Criar Etapa'].parameters.propertiesUi.propertyValues
$clienteRelationProperty = $criarEtapaProperties | Where-Object { $_.key -eq 'Cliente|relation' } | Select-Object -First 1
if (-not $clienteRelationProperty) {
  throw 'Criar Etapa must set Cliente|relation'
}
if ($clienteRelationProperty.PSObject.Properties.Name -contains 'relationValues') {
  throw 'Criar Etapa must not use ignored Notion v2.2 parameter relationValues'
}
if ($clienteRelationProperty.relationValue -ne '={{ [$json.cliente_page_id] }}') {
  throw 'Criar Etapa must set Cliente relation via relationValue array from cliente_page_id'
}

$montarItensCode = $nodeMap['[Onb A2.1] Montar Itens Etapas'].parameters.jsCode
if ($montarItensCode -notmatch [regex]::Escape("throw new Error('cliente.id ausente - nao criar etapas orfas');")) {
  throw 'Montar Itens Etapas must fail fast when cliente.id is absent'
}

if ($nodeMap['[Onb A2.1] Ler Etapas A1'].type -ne 'n8n-nodes-base.code') {
  throw 'Ler Etapas A1 must be a code node in the sandbox export'
}
if ($nodeMap['[Onb A2.1] Binario para JSON Etapas'].type -ne 'n8n-nodes-base.code') {
  throw 'Binario para JSON Etapas must be a code node in the sandbox export'
}
if ($workflowRaw -notmatch [regex]::Escape('const etapas = [')) {
  throw 'Embedded etapas dataset is missing from workflow.json'
}
if ($workflowRaw -notmatch [regex]::Escape('return items;')) {
  throw 'Passthrough code node is missing from workflow.json'
}

if (-not $nodeMap['[Onb A2.1] Notificar Duplicidade Olavo'].continueOnFail) {
  throw 'Notificar Duplicidade Olavo must use continueOnFail'
}
if (-not $nodeMap['[Onb A2.1] Notificar Falha Etapas Olavo'].continueOnFail) {
  throw 'Notificar Falha Etapas Olavo must use continueOnFail'
}

if ($workflowRaw -match [regex]::Escape('c7867eef-126f-420b-8b80-d52db3854989')) {
  throw 'Old clientes DB ID must not remain in workflow.json'
}
if ($workflowRaw -match [regex]::Escape('df28bb77-997d-43e8-93e7-d9a291f787a6')) {
  throw 'Old etapas DB ID must not remain in workflow.json'
}
if ($workflowRaw -match [regex]::Escape('{{ $env.ONBOARDING_DATA_PATH }}/etapas-a1.json')) {
  throw 'Sandbox-final workflow must not depend on ONBOARDING_DATA_PATH'
}

foreach ($requiredText in @('DoD fechado', 'Evolution API status', 'exec_6738.json', 'exec_6739.json')) {
  if ($delivery -notmatch [regex]::Escape($requiredText)) {
    throw "delivery.md is missing required text '$requiredText'"
  }
}

Write-Output 'Onboarding briefing workflow structural tests passed.'
