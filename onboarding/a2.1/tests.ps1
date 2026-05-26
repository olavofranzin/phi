$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\a2.1\workflow.json'
$deliveryPath = 'C:\tmp\phi_repo\onboarding\a2.1\delivery.md'
$datasetRef = 'origin/claude/agentic-agency-planning-KwJEw:onboarding/etapas-a1.json'

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
$delivery = Get-Content $deliveryPath -Raw
$datasetRaw = git -C 'C:\tmp\phi_repo' show $datasetRef
if (-not $datasetRaw) {
  throw "Missing dataset ref: $datasetRef"
}

$dataset = $datasetRaw | ConvertFrom-Json

if (-not $dataset.etapas -or $dataset.etapas.Count -ne 31) {
  throw "Expected 31 etapas in dataset ref '$datasetRef'"
}

$validTipos = @(
  [string]([char]83+[char]101+[char]116+[char]117+[char]112+[char]32+[char]116+[char]233+[char]99+[char]110+[char]105+[char]99+[char]111),
  [string]([char]65+[char]112+[char]114+[char]111+[char]118+[char]97+[char]231+[char]227+[char]111+[char]32+[char]99+[char]108+[char]105+[char]101+[char]110+[char]116+[char]101),
  [string]([char]68+[char]111+[char]99+[char]117+[char]109+[char]101+[char]110+[char]116+[char]97+[char]231+[char]227+[char]111+[char]32+[char]105+[char]110+[char]116+[char]101+[char]114+[char]110+[char]97),
  [string]([char]77+[char]97+[char]114+[char]99+[char]111+[char]32+[char]100+[char]101+[char]32+[char]99+[char]111+[char]109+[char]117+[char]110+[char]105+[char]99+[char]97+[char]231+[char]227+[char]111),
  'Entrega'
)

$validAguardando = @(
  'Nada',
  'Cliente',
  [string]([char]79+[char]112+[char]101+[char]114+[char]97+[char]231+[char]245+[char]101+[char]115+[char]32+[char]105+[char]110+[char]116+[char]101+[char]114+[char]110+[char]111),
  'Comercial',
  'Fornecedor externo'
)

foreach ($etapa in $dataset.etapas) {
  if ($etapa.tipo_etapa -notin $validTipos) {
    throw "Invalid tipo_etapa in dataset: $($etapa.tipo_etapa)"
  }
  if ($etapa.aguardando -notin $validAguardando) {
    throw "Invalid aguardando in dataset: $($etapa.aguardando)"
  }
}

if ($workflow.name -ne 'Onb - Briefing to Client') {
  throw "Unexpected workflow name: $($workflow.name)"
}

function New-UnicodeString {
  param(
    [int[]]$CodePoints
  )
  return -join ($CodePoints | ForEach-Object { [char]$_ })
}

$strPrazoDiasApos = New-UnicodeString @(80,114,97,122,111,32,40,100,105,97,115,32,97,112,243,115,32,68,61,48,41)
$strSlaAtePrimeiraEntrega = New-UnicodeString @(83,76,65,32,97,116,233,32,49,170,32,101,110,116,114,101,103,97)
$strModeloNegocio = New-UnicodeString @(77,111,100,101,108,111,32,100,101,32,110,101,103,243,99,105,111)
$strInputsNecessarios = New-UnicodeString @(73,110,112,117,116,115,32,110,101,99,101,115,115,225,114,105,111,115)
$strDataInicio = New-UnicodeString @(68,97,116,97,32,100,101,32,105,110,237,99,105,111)
$strServico = New-UnicodeString @(83,101,114,118,105,231,111)
$strObservacoes = New-UnicodeString @(79,98,115,101,114,118,97,231,245,101,115)
$strResponsavelGeral = New-UnicodeString @(82,101,115,112,111,110,115,225,118,101,108,32,103,101,114,97,108)
$strSequencia = New-UnicodeString @(83,101,113,117,234,110,99,105,97)

$nodeNames = @($workflow.nodes | ForEach-Object { $_.name })
$requiredNodes = @(
  '[Onb A2.1] Webhook Briefing',
  '[Onb A2.1] Validar Payload',
  '[Onb A2.1] Payload Valido?',
  '[Onb A2.1] Normalizar Contexto',
  '[Onb A2.1] Buscar Clientes Ativos',
  '[Onb A2.1] Detectar Duplicidade',
  '[Onb A2.1] Duplicado?',
  '[Onb A2.1] Notificar Duplicidade Olavo',
  '[Onb A2.1] Buscar Usuarios Workspace',
  '[Onb A2.1] Resolver Responsavel Geral',
  '[Onb A2.1] Criar Cliente',
  '[Onb A2.1] Ler Etapas A1',
  '[Onb A2.1] Binario para JSON Etapas',
  '[Onb A2.1] Montar Itens Etapas',
  '[Onb A2.1] Criar Etapa',
  '[Onb A2.1] Consolidar Resultado',
  '[Onb A2.1] Falha Parcial Etapas?',
  '[Onb A2.1] Atualizar Cliente Bloqueado',
  '[Onb A2.1] Notificar Falha Etapas Olavo',
  '[Onb A2.1] Responder 400',
  '[Onb A2.1] Responder 409',
  '[Onb A2.1] Responder 201'
)

foreach ($nodeName in $requiredNodes) {
  if ($nodeName -notin $nodeNames) {
    throw "Workflow is missing node '$nodeName'"
  }
}

foreach ($node in $workflow.nodes) {
  if ($node.name -notmatch '^\[Onb A2\.1\] ') {
    throw "Node does not use required prefix: $($node.name)"
  }
}

if (-not $workflow.connections.'[Onb A2.1] Webhook Briefing') {
  throw 'Missing webhook connection graph'
}

$requiredFragments = @(
  'c7867eef-126f-420b-8b80-d52db3854989',
  'df28bb77-997d-43e8-93e7-d9a291f787a6',
  '{{ $env.ONBOARDING_DATA_PATH }}/etapas-a1.json',
  'raw.etapas',
  'Onboarding ativo ja existe para este cliente.',
  'Status=\"Bloqueado\"',
  'responsavel_geral_email',
  'cnpj_normalizado',
  $strPrazoDiasApos,
  'Data prevista',
  $strSlaAtePrimeiraEntrega,
  ($strModeloNegocio + ' (business_model)'),
  ($strSlaAtePrimeiraEntrega + ' (dias)'),
  'Etapas de Onboarding',
  'Nome da etapa',
  $strInputsNecessarios,
  'date-only sem timezone'
)

foreach ($fragment in $requiredFragments) {
  if ($workflowRaw -notmatch [regex]::Escape($fragment)) {
    throw "Workflow JSON is missing required fragment '$fragment'"
  }
}

$forbiddenFragments = @(
  'Ã',
  'Data de inÃ',
  'Modelo de negÃ',
  'ServiÃ',
  'ObservaÃ',
  'SLA atÃ',
  'ResponsÃ',
  'SequÃ',
  'apÃ³s',
  'necessÃ'
)

foreach ($fragment in $forbiddenFragments) {
  if ($workflowRaw -match [regex]::Escape($fragment)) {
    throw "Workflow JSON still contains mojibake fragment '$fragment'"
  }
}

$notionKeys = @()
foreach ($node in $workflow.nodes) {
  if ($node.type -eq 'n8n-nodes-base.notion' -and $node.parameters.propertiesUi) {
    $notionKeys += @($node.parameters.propertiesUi.propertyValues | ForEach-Object { $_.key })
  }
}

$requiredKeys = @(
  ($strDataInicio + '|date'),
  ($strModeloNegocio + ' (business_model)|select'),
  ($strServico + '|multi_select'),
  ($strObservacoes + '|rich_text'),
  ($strSlaAtePrimeiraEntrega + ' (dias)|number'),
  ($strResponsavelGeral + '|people'),
  ($strSequencia + '|number'),
  ($strPrazoDiasApos + '|number'),
  ($strInputsNecessarios + '|rich_text')
)

foreach ($key in $requiredKeys) {
  if ($key -notin $notionKeys) {
    throw "Workflow JSON is missing Notion property key '$key'"
  }
}

if ($delivery -notmatch [regex]::Escape('ONBOARDING_DATA_PATH')) {
  throw 'delivery.md must document ONBOARDING_DATA_PATH'
}

if ($delivery -notmatch [regex]::Escape('filterType:none')) {
  throw 'delivery.md must record the filterType:none tech debt'
}

Write-Output 'Onboarding briefing workflow structural tests passed.'
