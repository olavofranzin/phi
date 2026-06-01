$ErrorActionPreference = 'Stop'

$repo = 'C:\tmp\phi_repo'
$workflowPaths = @(
  'onboarding\a2.1\workflow.json',
  'onboarding\a2.2\workflow.json',
  'onboarding\a2.5\workflow.json',
  'onboarding\a2.9\workflow.json',
  'onboarding\a2.11\workflow.json'
)

foreach ($relativePath in $workflowPaths) {
  $path = Join-Path $repo $relativePath
  if (-not (Test-Path $path)) {
    throw "Missing workflow export: $relativePath"
  }

  $bytes = [System.IO.File]::ReadAllBytes($path)
  if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    throw "$relativePath must be UTF-8 without BOM"
  }

  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  if ($raw -match '\$env\.') {
    throw "$relativePath still contains runtime env reference"
  }

  $workflow = $raw | ConvertFrom-Json
  if (-not $workflow.nodes -or $workflow.nodes.Count -eq 0) {
    throw "$relativePath has no nodes"
  }

  if (-not $workflow.active) {
    throw "$relativePath must be active for production promotion"
  }
}

$requiredSanitizedConfig = @{
  'onboarding\a2.1\workflow.json' = @('<TELEGRAM_CHAT_ID_redacted>')
  'onboarding\a2.2\workflow.json' = @('<TELEGRAM_CHAT_ID_redacted>')
  'onboarding\a2.5\workflow.json' = @('<TELEGRAM_CHAT_ID_redacted>')
  'onboarding\a2.9\workflow.json' = @('<TELEGRAM_CHAT_ID_redacted>')
  'onboarding\a2.11\workflow.json' = @('<TELEGRAM_CHAT_ID_redacted>', '<OLAVO_PHONE_redacted>', '<CSAT_FORM_URL_redacted>', '<NPS_FORM_URL_redacted>')
}

foreach ($entry in $requiredSanitizedConfig.GetEnumerator()) {
  $path = Join-Path $repo $entry.Key
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  foreach ($token in $entry.Value) {
    if (-not $raw.Contains($token)) {
      throw "$($entry.Key) missing sanitized config token $token"
    }
  }
}

$canonicalCredentialNames = @('Notion account', 'Telegram account')
$retiredCredentialNames = @('Phi Notion', 'Evolution API', 'Evolution API Header Auth')

foreach ($relativePath in $workflowPaths) {
  $path = Join-Path $repo $relativePath
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  $workflow = $raw | ConvertFrom-Json
  $credentialNames = @()
  foreach ($node in $workflow.nodes) {
    if ($node.credentials) {
      $node.credentials.PSObject.Properties | ForEach-Object {
        $credentialNames += $_.Value.name
      }
    }
  }

  foreach ($retiredName in $retiredCredentialNames) {
    if ($credentialNames -contains $retiredName) {
      throw "$relativePath still references retired credential name $retiredName"
    }
  }

  foreach ($canonicalName in $canonicalCredentialNames) {
    if ($credentialNames -notcontains $canonicalName) {
      throw "$relativePath does not reference canonical credential $canonicalName"
    }
  }

  $unexpectedNames = $credentialNames | Where-Object { $canonicalCredentialNames -notcontains $_ } | Sort-Object -Unique
  if ($unexpectedNames.Count -gt 0) {
    throw "$relativePath references unexpected credential(s): $($unexpectedNames -join ', ')"
  }
}

$scheduleWorkflowPaths = @(
  'onboarding\a2.2\workflow.json',
  'onboarding\a2.5\workflow.json',
  'onboarding\a2.9\workflow.json',
  'onboarding\a2.11\workflow.json'
)

foreach ($relativePath in $scheduleWorkflowPaths) {
  $path = Join-Path $repo $relativePath
  $workflow = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8) | ConvertFrom-Json
  $scheduleNodes = @($workflow.nodes | Where-Object { $_.type -eq 'n8n-nodes-base.scheduleTrigger' })
  if ($scheduleNodes.Count -ne 1) {
    throw "$relativePath must contain exactly one schedule trigger"
  }

  $interval = @($scheduleNodes[0].parameters.rule.interval)[0]
  if ($interval.field -ne 'days' -or [int]$interval.daysInterval -ne 1 -or [int]$interval.triggerAtHour -ne 9 -or [int]$interval.triggerAtMinute -ne 0) {
    throw "$relativePath schedule must run daily at 09:00"
  }
}

$a21Workflow = [System.IO.File]::ReadAllText((Join-Path $repo 'onboarding\a2.1\workflow.json'), [System.Text.Encoding]::UTF8) | ConvertFrom-Json
$webhookNodes = @($a21Workflow.nodes | Where-Object { $_.type -eq 'n8n-nodes-base.webhook' })
if ($webhookNodes.Count -ne 1 -or $webhookNodes[0].parameters.httpMethod -ne 'POST' -or $webhookNodes[0].parameters.path -ne 'onb-briefing-to-client') {
  throw 'A2.1 must expose POST webhook path onb-briefing-to-client'
}

foreach ($relativePath in @('onboarding\a2.1\workflow.json', 'onboarding\a2.1\sandbox_export.json')) {
  $path = Join-Path $repo $relativePath
  $raw = [System.IO.File]::ReadAllText($path, [System.Text.Encoding]::UTF8)
  $workflow = $raw | ConvertFrom-Json

  $nodeMap = @{}
  foreach ($node in $workflow.nodes) {
    $nodeMap[$node.name] = $node
  }

  foreach ($requiredHardeningNode in @(
    '[Onb A2.1] Validar Secret',
    '[Onb A2.1] Secret Valido?',
    '[Onb A2.1] Responder 401'
  )) {
    if (-not $nodeMap.ContainsKey($requiredHardeningNode)) {
      throw "$relativePath missing A2.1 hardening node $requiredHardeningNode"
    }
  }

  $validarSecretCode = [string]$nodeMap['[Onb A2.1] Validar Secret'].parameters.jsCode
  if ($validarSecretCode -notmatch 'ONB_WEBHOOK_SECRET|x-onb-secret') {
    throw "$relativePath Validar Secret must check ONB_WEBHOOK_SECRET or x-onb-secret"
  }

  $webhookNext = @($workflow.connections.'[Onb A2.1] Webhook Briefing'.main[0] | ForEach-Object { $_.node })
  if ($webhookNext.Count -ne 1 -or $webhookNext[0] -ne '[Onb A2.1] Validar Secret') {
    throw "$relativePath must connect Webhook Briefing directly to Validar Secret"
  }

  $secretTrue = @($workflow.connections.'[Onb A2.1] Secret Valido?'.main[0] | ForEach-Object { $_.node })
  $secretFalse = @($workflow.connections.'[Onb A2.1] Secret Valido?'.main[1] | ForEach-Object { $_.node })
  if ($secretTrue.Count -ne 1 -or $secretTrue[0] -ne '[Onb A2.1] Validar Payload') {
    throw "$relativePath must route valid secret to Validar Payload"
  }
  if ($secretFalse.Count -ne 1 -or $secretFalse[0] -ne '[Onb A2.1] Responder 401') {
    throw "$relativePath must route invalid secret to Responder 401"
  }

  $validarPayloadCode = [string]$nodeMap['[Onb A2.1] Validar Payload'].parameters.jsCode
  if ($validarPayloadCode -notmatch [regex]::Escape("const required = ['cnpj_cliente', 'cliente_nome'];")) {
    throw "$relativePath Validar Payload must require exactly cnpj_cliente and cliente_nome"
  }
  foreach ($forbiddenRequiredField in @('data_inicio', 'modelo_negocio', 'servico', 'origem_comercial')) {
    $requiredListMatch = [regex]::Match($validarPayloadCode, "const required = \[(.*?)\];", 'Singleline')
    if ($requiredListMatch.Success -and $requiredListMatch.Groups[1].Value -match [regex]::Escape($forbiddenRequiredField)) {
      throw "$relativePath Validar Payload must not require optional field $forbiddenRequiredField"
    }
  }

  foreach ($requiredServicoNode in @('[Onb A2.1] Tem Servico?', '[Onb A2.1] Atualizar Servico Cliente')) {
    if (-not $nodeMap.ContainsKey($requiredServicoNode)) {
      throw "$relativePath missing A2.1 optional service node $requiredServicoNode"
    }
  }

  $criarClienteNext = @($workflow.connections.'[Onb A2.1] Criar Cliente'.main[0] | ForEach-Object { $_.node })
  if ($criarClienteNext.Count -ne 1 -or $criarClienteNext[0] -ne '[Onb A2.1] Tem Servico?') {
    throw "$relativePath must connect Criar Cliente directly to Tem Servico?"
  }

  $normalizarCode = [string]$nodeMap['[Onb A2.1] Normalizar Contexto'].parameters.jsCode
  if ($normalizarCode -notmatch [regex]::Escape("'N\u00e3o iniciado'")) {
    throw "$relativePath Normalizar Contexto must keep ASCII-safe active status N\u00e3o iniciado"
  }
  if ($normalizarCode -match [regex]::Escape(('N' + '?o iniciado'))) {
    throw "$relativePath Normalizar Contexto must not contain mojibake active status"
  }
}

Write-Output 'Promotion ADR-19 config and credential tests passed.'
