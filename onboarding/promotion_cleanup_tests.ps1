$ErrorActionPreference = 'Stop'

$scriptPath = 'C:\tmp\phi_repo\onboarding\a2.1\cleanup_synthetic_clients.ps1'
if (-not (Test-Path $scriptPath)) {
  throw "Missing cleanup script: $scriptPath"
}

$raw = [System.IO.File]::ReadAllText($scriptPath, [System.Text.Encoding]::UTF8)

foreach ($required in @(
  '36db65e5-c72b-81cf-aa85-f011e36b15d1',
  '36eb65e5-c72b-81b0-92d3-e70b4613e2a6',
  'Cliente Sandbox A2.1 Bugfix B',
  'Cliente Sandbox A2.11 Test',
  '$syntheticPrefix',
  'StartsWith($syntheticPrefix',
  'relation',
  'contains',
  '--dry-run'
)) {
  if (-not $raw.Contains($required)) {
    throw "cleanup script missing required text: $required"
  }
}

foreach ($forbidden in @(
  'Retest B',
  'Retest C',
  'Retest E',
  'Get-OrphanSyntheticEtapas',
  'created_time',
  'on_or_after'
)) {
  if ($raw.Contains($forbidden)) {
    throw "cleanup script still contains obsolete cleanup path: $forbidden"
  }
}

Write-Output 'Promotion cleanup script static tests passed.'
