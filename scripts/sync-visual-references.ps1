$projectDirectory = Split-Path $PSScriptRoot -Parent
$referenceDirectory = Join-Path $projectDirectory 'docs/referencias-visuais'
$publicDirectory = Join-Path $projectDirectory '../pingo-front-crm/public/referencias'
foreach ($assetGroup in @('pingo', 'graficos')) {
    $sourceDirectory = Join-Path $referenceDirectory $assetGroup
    $targetDirectory = Join-Path $publicDirectory $assetGroup
    New-Item -ItemType Directory -Force -Path $targetDirectory | Out-Null
    Get-ChildItem -LiteralPath $sourceDirectory -File | ForEach-Object {
        if (($assetGroup -eq 'graficos' -and $_.Extension -eq '.svg') -or
            ($assetGroup -eq 'pingo' -and $_.Name -match '^pingo-(normal|pensando|insight)\.png$')) {
            Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $targetDirectory $_.Name)
        }
    }
}
Write-Output 'Assets de referência sincronizados para o frontend.'
