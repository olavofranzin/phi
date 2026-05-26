$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onb_briefing_to_client_a2_1.json'
$datasetRef = 'origin/claude/agentic-agency-planning-KwJEw:onboarding/etapas-a1.json'

if (-not (Test-Path $workflowPath)) {
  throw "Missing workflow file: $workflowPath"
}

$workflow = Get-Content $workflowPath -Raw | ConvertFrom-Json
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

$raw = Get-Content $workflowPath -Raw

$requiredFragments = @(
  'c7867eef-126f-420b-8b80-d52db3854989',
  'df28bb77-997d-43e8-93e7-d9a291f787a6',
  '/home/user/phi/onboarding/etapas-a1.json',
  'raw.etapas',
  'Onboarding ativo ja existe para este cliente.',
  'Status=\"Bloqueado\"',
  'responsavel_geral_email',
  'cnpj_normalizado',
  'Prazo (dias após D=0)',
  'Data prevista',
  'SLA até 1ª entrega',
  'Modelo de negócio (business_model)',
  'SLA até 1ª entrega (dias)',
  'Etapas de Onboarding',
  'Nome da etapa',
  'Inputs necessários'
)

foreach ($fragment in $requiredFragments) {
  if ($raw -notmatch [regex]::Escape($fragment)) {
    throw "Workflow JSON is missing required fragment '$fragment'"
  }
}

Write-Output 'Onboarding briefing workflow structural tests passed.'
