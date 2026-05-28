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
}

$requiredSanitizedConfig = @{
  'onboarding\a2.1\workflow.json' = @('<OLAVO_PHONE_redacted>')
  'onboarding\a2.2\workflow.json' = @('<OLAVO_PHONE_redacted>')
  'onboarding\a2.5\workflow.json' = @('<OLAVO_PHONE_redacted>')
  'onboarding\a2.9\workflow.json' = @('<OLAVO_PHONE_redacted>')
  'onboarding\a2.11\workflow.json' = @('<OLAVO_PHONE_redacted>', '<CSAT_FORM_URL_redacted>', '<NPS_FORM_URL_redacted>')
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

Write-Output 'Promotion ADR-19 config tests passed.'
