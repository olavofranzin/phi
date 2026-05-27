[CmdletBinding()]
param(
    [Parameter(ValueFromRemainingArguments = $true)]
    [string[]]$RemainingArgs
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$DryRun = $false
if ($RemainingArgs -contains '--dry-run' -or $RemainingArgs -contains '-DryRun') {
    $DryRun = $true
}
$AssumeYes = $false
if ($RemainingArgs -contains '--yes' -or $RemainingArgs -contains '-Yes') {
    $AssumeYes = $true
}

$clientesDatabaseId = '04e34a62624b484cbda546604564b88c'
$etapasDatabaseId = '6eb4565b4f1d498c8b2978e0c80880fd'
$notionVersion = '2022-06-28'
$syntheticPrefix = 'Cliente Sandbox'
$createdOnOrAfter = '2026-05-26T00:00:00.000Z'
$etapasFixturePath = 'C:\tmp\phi_repo\onboarding\etapas-a1.json'

$targets = @(
    @{ Nome = 'Cliente Sandbox A2.1 Retest'; PageId = '36cb65e5-c72b-8161-bbf0-da0a4416e2aa' },
    @{ Nome = 'Cliente Sandbox A2.1 Retest B'; PageId = '36cb65e5-c72b-818b-ae4d-ee918908d49e' },
    @{ Nome = 'Cliente Sandbox A2.1 Retest C'; PageId = '36cb65e5-c72b-814c-808d-dd142f112a1e' },
    @{ Nome = 'Cliente Sandbox A2.1 Retest E'; PageId = '36cb65e5-c72b-8105-9cd2-f37366abfdff' }
)

if ([string]::IsNullOrWhiteSpace($env:NOTION_API_KEY)) {
    throw 'NOTION_API_KEY is required in the environment.'
}

$etapasFixture = Get-Content -Raw -Encoding UTF8 -LiteralPath $etapasFixturePath | ConvertFrom-Json
$KnownEtapaNames = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::Ordinal)
foreach ($etapa in $etapasFixture.etapas) {
    [void]$KnownEtapaNames.Add([string]$etapa.nome)
}

$headers = @{
    Authorization   = "Bearer $($env:NOTION_API_KEY)"
    'Notion-Version' = $notionVersion
    'Content-Type'  = 'application/json'
}

function Invoke-NotionJson {
    param(
        [Parameter(Mandatory = $true)][ValidateSet('GET', 'POST', 'PATCH')] [string]$Method,
        [Parameter(Mandatory = $true)][string]$Path,
        [object]$Body
    )

    $uri = "https://api.notion.com/v1/$Path"
    if ($PSBoundParameters.ContainsKey('Body')) {
        $jsonBody = $Body | ConvertTo-Json -Depth 20 -Compress
        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body $jsonBody
    }

    return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers
}

function Get-NotionPageTitle {
    param(
        [Parameter(Mandatory = $true)][object]$Page
    )

    foreach ($property in $Page.properties.PSObject.Properties.Value) {
        if ($property.type -eq 'title') {
            return ($property.title | ForEach-Object { $_.plain_text }) -join ''
        }
    }

    throw "Page $($Page.id) does not contain a title property."
}

function Get-ClientPage {
    param(
        [Parameter(Mandatory = $true)][string]$PageId
    )

    return Invoke-NotionJson -Method GET -Path "pages/$PageId"
}

function Get-CandidateEtapas {
    $results = @()
    $nextCursor = $null

    do {
        $body = @{
            page_size = 100
            filter = @{
                and = @(
                    @{
                        timestamp = 'created_time'
                        created_time = @{
                            on_or_after = '2026-05-26T00:00:00.000Z'
                        }
                    },
                    @{
                        property = 'Status'
                        select = @{
                            equals = 'Pendente'
                        }
                    }
                )
            }
        }

        if ($nextCursor) {
            $body.start_cursor = $nextCursor
        }

        $response = Invoke-NotionJson -Method POST -Path "databases/$etapasDatabaseId/query" -Body $body
        $results += @($response.results)
        $nextCursor = $response.next_cursor
    } while ($response.has_more)

    return $results
}

function Get-OrphanSyntheticEtapas {
    $candidateEtapas = @(Get-CandidateEtapas)
    $orphanEtapas = @()
    $linkedKnownEtapas = 0

    foreach ($etapa in $candidateEtapas) {
        $title = Get-NotionPageTitle -Page $etapa
        if (-not $KnownEtapaNames.Contains($title)) {
            throw "Safety check failed for etapa $($etapa.id): title '$title' is not in etapas-a1.json."
        }

        $clienteRelation = @($etapa.properties.Cliente.relation)
        if ($clienteRelation.Count -eq 0) {
            $orphanEtapas += $etapa
        }
        else {
            $linkedKnownEtapas += 1
        }
    }

    return [pscustomobject]@{
        CandidateEtapas = $candidateEtapas.Count
        OrphanEtapas    = $orphanEtapas
        LinkedKnownEtapas = $linkedKnownEtapas
    }
}

function Archive-NotionPage {
    param(
        [Parameter(Mandatory = $true)][string]$PageId
    )

    $body = @{
        archived = $true
    }

    [void](Invoke-NotionJson -Method PATCH -Path "pages/$PageId" -Body $body)
}

$summary = New-Object System.Collections.Generic.List[object]
$orphanResult = Get-OrphanSyntheticEtapas
$orphanEtapas = @($orphanResult.OrphanEtapas)

foreach ($target in $targets) {
    $clientPage = Get-ClientPage -PageId $target.PageId
    $clientTitle = Get-NotionPageTitle -Page $clientPage

    if (-not $clientTitle.StartsWith($syntheticPrefix, [System.StringComparison]::Ordinal)) {
        throw "Safety check failed for page $($target.PageId): title '$clientTitle' does not start with '$syntheticPrefix'."
    }

    $status = 'pending'

    if ($DryRun) {
        $status = 'dry-run'
        Write-Host "[dry-run] Cliente $clientTitle sera arquivado. Nenhuma alteracao aplicada."
    }
    else {
        $confirmation = if ($AssumeYes) { 'y' } else { Read-Host "Cliente $clientTitle. Confirmar archive? [y/N]" }
        if ($confirmation -ceq 'y') {
            Archive-NotionPage -PageId $target.PageId
            $status = 'archived'
            Write-Host "Archived cliente $clientTitle."
        }
        else {
            $status = 'skipped'
            Write-Host "Skipped cliente $clientTitle."
        }
    }

    $summary.Add([pscustomobject]@{
        Cliente          = $clientTitle
        ClientePageId    = $target.PageId
        EtapasArchivadas = 0
        Status           = $status
    })
}

$etapasStatus = 'pending'
if ($DryRun) {
    $etapasStatus = 'dry-run'
    Write-Host "[dry-run] $($orphanEtapas.Count) etapas orfas conhecidas seriam arquivadas. Nenhuma alteracao aplicada."
}
else {
    $confirmation = if ($AssumeYes) { 'y' } else { Read-Host "$($orphanEtapas.Count) etapas orfas conhecidas. Confirmar archive? [y/N]" }
    if ($confirmation -ceq 'y') {
        foreach ($etapa in $orphanEtapas) {
            Archive-NotionPage -PageId $etapa.id
        }
        $etapasStatus = 'archived'
        Write-Host "Archived $($orphanEtapas.Count) etapas orfas conhecidas."
    }
    else {
        $etapasStatus = 'skipped'
        Write-Host "Skipped etapas orfas conhecidas."
    }
}

$summary.Add([pscustomobject]@{
    Cliente          = '[orphan etapas]'
    ClientePageId    = ''
    EtapasArchivadas = $orphanEtapas.Count
    Status           = $etapasStatus
})

Write-Host "Candidate etapas: $($orphanResult.CandidateEtapas); orphan known etapas: $($orphanEtapas.Count); linked known etapas skipped: $($orphanResult.LinkedKnownEtapas)."
$summary | Format-Table -AutoSize
