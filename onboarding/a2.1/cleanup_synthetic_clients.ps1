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

$targets = @(
    @{
        Nome = 'Cliente Sandbox A2.1 Bugfix B'
        PageId = '36db65e5-c72b-81cf-aa85-f011e36b15d1'
        ArchiveLinkedEtapas = $true
    },
    @{
        Nome = 'Cliente Sandbox A2.11 Test'
        PageId = '36eb65e5-c72b-81b0-92d3-e70b4613e2a6'
        ArchiveLinkedEtapas = $true
    }
)

if ([string]::IsNullOrWhiteSpace($env:NOTION_API_KEY)) {
    throw 'NOTION_API_KEY is required in the environment.'
}

$headers = @{
    Authorization    = "Bearer $($env:NOTION_API_KEY)"
    'Notion-Version' = $notionVersion
    'Content-Type'   = 'application/json'
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
        return Invoke-RestMethod -Method $Method -Uri $uri -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($jsonBody))
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

function Get-LinkedEtapas {
    param(
        [Parameter(Mandatory = $true)][string]$ClientPageId
    )

    $results = @()
    $nextCursor = $null

    do {
        $body = @{
            page_size = 100
            filter = @{
                property = 'Cliente'
                relation = @{
                    contains = $ClientPageId
                }
            }
        }

        if ($nextCursor) {
            $body.start_cursor = $nextCursor
        }

        $response = Invoke-NotionJson -Method POST -Path "databases/$etapasDatabaseId/query" -Body $body
        $results += @($response.results)
        $nextCursor = $response.next_cursor
    } while ($response.has_more)

    return @($results | Where-Object { -not $_.archived })
}

function Assert-SyntheticClient {
    param(
        [Parameter(Mandatory = $true)][object]$ClientPage,
        [Parameter(Mandatory = $true)][string]$ExpectedPageId
    )

    $clientTitle = Get-NotionPageTitle -Page $ClientPage
    if (-not $clientTitle.StartsWith($syntheticPrefix, [System.StringComparison]::Ordinal)) {
        throw "Safety check failed for page $ExpectedPageId`: title '$clientTitle' does not start with '$syntheticPrefix'."
    }

    return $clientTitle
}

function Archive-NotionPage {
    param(
        [Parameter(Mandatory = $true)][string]$PageId
    )

    [void](Invoke-NotionJson -Method PATCH -Path "pages/$PageId" -Body @{ archived = $true })
}

$summary = New-Object System.Collections.Generic.List[object]
$totalEtapas = 0

foreach ($target in $targets) {
    $clientPage = Get-ClientPage -PageId $target.PageId
    $clientTitle = Assert-SyntheticClient -ClientPage $clientPage -ExpectedPageId $target.PageId
    $linkedEtapas = @()
    if ($target.ArchiveLinkedEtapas) {
        $linkedEtapas = @(Get-LinkedEtapas -ClientPageId $target.PageId)
    }
    $totalEtapas += $linkedEtapas.Count

    if ($DryRun) {
        Write-Host "[dry-run] Cliente $clientTitle seria arquivado."
        Write-Host "[dry-run] $($linkedEtapas.Count) etapas vinculadas a $clientTitle seriam arquivadas."
        $status = 'dry-run'
    }
    else {
        $confirmation = if ($AssumeYes) { 'y' } else { Read-Host "Cliente $clientTitle + $($linkedEtapas.Count) etapas vinculadas. Confirmar archive? [y/N]" }
        if ($confirmation -ceq 'y') {
            foreach ($etapa in $linkedEtapas) {
                Archive-NotionPage -PageId $etapa.id
            }
            Archive-NotionPage -PageId $target.PageId
            Write-Host "Archived cliente $clientTitle e $($linkedEtapas.Count) etapas vinculadas."
            $status = 'archived'
        }
        else {
            Write-Host "Skipped cliente $clientTitle."
            $status = 'skipped'
        }
    }

    $summary.Add([pscustomobject]@{
        Cliente       = $clientTitle
        ClientePageId = $target.PageId
        EtapasAtivasVinculadas = $linkedEtapas.Count
        Status        = $status
    })
}

$totalClientes = $summary.Count
$totalPaginas = $totalClientes + $totalEtapas

Write-Host "Total clientes alvo: $totalClientes"
Write-Host "Total etapas vinculadas ativas: $totalEtapas"
Write-Host "Total paginas afetadas: $totalPaginas"
$summary | Format-Table -AutoSize
