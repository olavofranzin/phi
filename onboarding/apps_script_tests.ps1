$ErrorActionPreference = 'Stop'

$scriptPath = 'C:\tmp\phi_repo\onboarding\apps-script-briefing.gs'
if (-not (Test-Path $scriptPath)) {
  throw "Missing Apps Script file: $scriptPath"
}

$raw = [System.IO.File]::ReadAllText($scriptPath, [System.Text.Encoding]::UTF8)

foreach ($required in @(
  'function onFormSubmit(e)',
  'PropertiesService.getScriptProperties()',
  "getProperty('ONB_WEBHOOK_SECRET')",
  'X-Onb-Secret',
  'UrlFetchApp.fetch',
  "getRequiredValue_(namedValues, 'cliente_nome')",
  "getRequiredValue_(namedValues, 'cnpj_cliente')",
  "getOptionalValue_(namedValues, 'modelo_negocio')",
  "getOptionalValue_(namedValues, 'servico')",
  "Utilities.formatDate(new Date(), 'America/Sao_Paulo', 'yyyy-MM-dd')",
  'cnpj_cliente',
  'cliente_nome',
  'data_inicio',
  'modelo_negocio',
  'servico',
  'origem_comercial',
  'responsavel_geral_email',
  'https://n8n-n8n-editor.1unqx7.easypanel.host/webhook/onb-briefing-to-client'
)) {
  if (-not $raw.Contains($required)) {
    throw "Apps Script missing required text: $required"
  }
}

if ($raw -match 'ONB_WEBHOOK_SECRET\\s*=\\s*["''][A-Za-z0-9_-]{32,}["'']') {
  throw 'Apps Script must not hard-code ONB_WEBHOOK_SECRET'
}

foreach ($forbidden in @(
  "getRequiredValue_(namedValues, 'data_inicio')",
  "getRequiredValue_(namedValues, 'modelo_negocio')",
  "getRequiredValue_(namedValues, 'servico')",
  "getRequiredValue_(namedValues, 'origem_comercial')"
)) {
  if ($raw.Contains($forbidden)) {
    throw "Apps Script still requires optional field: $forbidden"
  }
}

Write-Output 'Apps Script static tests passed.'
