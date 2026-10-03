$ErrorActionPreference = 'Stop'

$workflowPath = 'C:\tmp\phi_repo\onboarding\a2.1\workflow.json'
$deliveryPath = 'C:\tmp\phi_repo\onboarding\a2.1\delivery.md'
$cleanupPath = 'C:\tmp\phi_repo\onboarding\a2.1\cleanup_synthetic_clients.ps1'
$etapasFixturePath = 'C:\tmp\phi_repo\onboarding\etapas-a1.json'

if (-not (Test-Path $workflowPath)) {
  throw "Missing workflow file: $workflowPath"
}
if (-not (Test-Path $deliveryPath)) {
  throw "Missing delivery file: $deliveryPath"
}
if (-not (Test-Path $cleanupPath)) {
  throw "Missing cleanup file: $cleanupPath"
}

$workflowBytes = [System.IO.File]::ReadAllBytes($workflowPath)
if ($workflowBytes.Length -ge 3 -and $workflowBytes[0] -eq 0xEF -and $workflowBytes[1] -eq 0xBB -and $workflowBytes[2] -eq 0xBF) {
  throw 'workflow.json must be UTF-8 without BOM'
}

$workflowRaw = [System.Text.Encoding]::UTF8.GetString($workflowBytes)
$workflow = $workflowRaw | ConvertFrom-Json
$delivery = [System.IO.File]::ReadAllText($deliveryPath, [System.Text.Encoding]::UTF8)
$cleanup = [System.IO.File]::ReadAllText($cleanupPath, [System.Text.Encoding]::UTF8)

if ($workflow.name -ne 'Onb - Briefing to Client') {
  throw "Unexpected workflow name: $($workflow.name)"
}

$requiredNodeNames = @(
  '[Onb A2.1] Webhook Briefing',
  '[Onb A2.1] Validar Secret',
  '[Onb A2.1] Secret Valido?',
  '[Onb A2.1] Responder 401',
  '[Onb A2.1] Validar Payload',
  '[Onb A2.1] Buscar Clientes Ativos',
  '[Onb A2.1] Detectar Duplicidade',
  '[Onb A2.1] Notificar Duplicidade Olavo',
  '[Onb A2.1] Criar Cliente',
  '[Onb A2.1] Disparar A2.3',
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

$validarSecretCode = $nodeMap['[Onb A2.1] Validar Secret'].parameters.jsCode
foreach ($requiredSecretSnippet in @(
  '<ONB_WEBHOOK_SECRET_redacted>',
  'x-onb-secret',
  'onb_secret_valid',
  'headers'
)) {
  if ($validarSecretCode -notmatch [regex]::Escape($requiredSecretSnippet)) {
    throw "Validar Secret is missing required text '$requiredSecretSnippet'"
  }
}
if ($workflowRaw -match "const ONB_WEBHOOK_SECRET = '(?!<ONB_WEBHOOK_SECRET_redacted>)[^']+'") {
  throw 'workflow.json must not contain raw ONB_WEBHOOK_SECRET'
}

$validarPayloadCode = $nodeMap['[Onb A2.1] Validar Payload'].parameters.jsCode
foreach ($requiredPayloadSnippet in @(
  "const required = ['cnpj_cliente', 'cliente_nome'];",
  'if (payload.data_inicio',
  'if (payload.modelo_negocio',
  'if (payload.servico'
)) {
  if ($validarPayloadCode -notmatch [regex]::Escape($requiredPayloadSnippet)) {
    throw "Validar Payload is missing minimum-contract text '$requiredPayloadSnippet'"
  }
}
foreach ($forbiddenPayloadSnippet in @(
  "'data_inicio', 'modelo_negocio'",
  "'servico', 'origem_comercial'"
)) {
  if ($validarPayloadCode -match [regex]::Escape($forbiddenPayloadSnippet)) {
    throw "Validar Payload still requires optional field group '$forbiddenPayloadSnippet'"
  }
}

$normalizarCode = $nodeMap['[Onb A2.1] Normalizar Contexto'].parameters.jsCode
foreach ($requiredNormalizarSnippet in @(
  'America/Sao_Paulo',
  'payload.data_inicio || currentDateBr',
  'modelo_negocio: normalizarTexto(payload.modelo_negocio)',
  'origem_comercial: normalizarTexto(payload.origem_comercial)',
  'active_statuses: [''Em andamento'', ''N\u00e3o iniciado'', ''Bloqueado'']'
)) {
  if ($normalizarCode -notmatch [regex]::Escape($requiredNormalizarSnippet)) {
    throw "Normalizar Contexto is missing minimum-contract text '$requiredNormalizarSnippet'"
  }
}
if ($normalizarCode -match [regex]::Escape('N?o iniciado')) {
  throw 'Normalizar Contexto must not contain corrupted active status N?o iniciado'
}

$responder401 = $nodeMap['[Onb A2.1] Responder 401']
if ($responder401.type -ne 'n8n-nodes-base.respondToWebhook') {
  throw 'Responder 401 must be a respondToWebhook node'
}
if ([string]$responder401.parameters.options.responseCode -ne '401') {
  throw 'Responder 401 must return HTTP 401'
}
if ($responder401.parameters.responseBody -notmatch 'unauthorized') {
  throw 'Responder 401 must return unauthorized body'
}

$dispatchA23 = $nodeMap['[Onb A2.1] Disparar A2.3']
if ($dispatchA23.type -ne 'n8n-nodes-base.httpRequest' -or [string]$dispatchA23.typeVersion -ne '4.3') {
  throw 'Disparar A2.3 must be an HTTP Request v4.3 node'
}
if ($dispatchA23.parameters.method -ne 'POST' -or $dispatchA23.parameters.url -ne '<A2_3_WEBHOOK_URL_redacted>') {
  throw 'Disparar A2.3 must POST to sanitized A2.3 webhook URL'
}
$dispatchHeader = @($dispatchA23.parameters.headerParameters.parameters | Where-Object { $_.name -eq 'X-Onb-Secret' }) | Select-Object -First 1
if (-not $dispatchHeader -or $dispatchHeader.value -ne '<ONB_WEBHOOK_SECRET_redacted>') {
  throw 'Disparar A2.3 must send sanitized X-Onb-Secret'
}
if ($dispatchA23.continueOnFail -ne $true -or $dispatchA23.retryOnFail -ne $false -or [int]$dispatchA23.parameters.options.timeout -ne 10000) {
  throw 'Disparar A2.3 must use continueOnFail=true, retryOnFail=false and timeout=10000'
}
$dispatchBody = [string]$dispatchA23.parameters.jsonBody
foreach ($requiredDispatchBody in @('cliente_page_id', 'briefing_payload', '[Onb A2.1] Criar Cliente', '[Onb A2.1] Normalizar Contexto', 'raw_payload')) {
  if (-not $dispatchBody.Contains($requiredDispatchBody)) {
    throw "Disparar A2.3 body is missing $requiredDispatchBody"
  }
}
$criarClienteNext = @($workflow.connections.'[Onb A2.1] Criar Cliente'.main[0] | ForEach-Object { $_.node })
if ($criarClienteNext.Count -ne 2 -or -not ($criarClienteNext -contains '[Onb A2.1] Tem Servico?') -or -not ($criarClienteNext -contains '[Onb A2.1] Disparar A2.3')) {
  throw 'Criar Cliente must connect to Tem Servico? and Disparar A2.3'
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

$criarClienteProperties = $nodeMap['[Onb A2.1] Criar Cliente'].parameters.propertiesUi.propertyValues
$modeloProperty = $criarClienteProperties | Where-Object { $_.key -like 'Modelo de neg*cio (business_model)|select' } | Select-Object -First 1
$servicoProperty = $criarClienteProperties | Where-Object { $_.key -like 'Servi*o|multi_select' } | Select-Object -First 1
if (-not $modeloProperty -or $modeloProperty.selectValue -notmatch 'undefined') {
  throw 'Criar Cliente must omit Modelo de negocio when optional value is absent'
}
if (-not $servicoProperty -or $servicoProperty.multiSelectValue -notmatch [regex]::Escape('cliente_properties.servico')) {
  throw 'Criar Cliente must set Servico through Notion multiSelectValue singular'
}
if ($servicoProperty.PSObject.Properties.Name -contains 'multiSelectValues') {
  throw 'Criar Cliente must not use ignored Notion v2.2 parameter multiSelectValues'
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

foreach ($requiredCleanupText in @(
  '36db65e5-c72b-81cf-aa85-f011e36b15d1',
  '36eb65e5-c72b-81b0-92d3-e70b4613e2a6',
  'Cliente Sandbox A2.1 Bugfix B',
  'Cliente Sandbox A2.11 Test',
  "property = 'Cliente'",
  "contains = `$ClientPageId",
  "StartsWith(`$syntheticPrefix",
  "RemainingArgs -contains '--yes'"
)) {
  if ($cleanup -notmatch [regex]::Escape($requiredCleanupText)) {
    throw "cleanup_synthetic_clients.ps1 is missing required text '$requiredCleanupText'"
  }
}

foreach ($requiredText in @('DoD CLOSED', 'Evolution API status', 'exec_6738.json', 'exec_6739.json')) {
  if ($delivery -notmatch [regex]::Escape($requiredText)) {
    throw "delivery.md is missing required text '$requiredText'"
  }
}

Write-Output 'Onboarding briefing workflow structural tests passed.'
