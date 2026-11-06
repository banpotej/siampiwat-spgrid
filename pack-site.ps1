# Builds the landing page + demos (`npm run build:site`) and zips the contents of .\site\ into .\release\spgrid-site.zip
# for a manual upload of static files (Cloudflare dashboard > Workers & Pages > Upload assets, or any static host).
# The zip has index.html at its root, so upload/extract it as-is.
# Usage: .\pack-site.ps1
param(
    [string]$OutDir = (Join-Path $PSScriptRoot 'release')
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

Write-Host '> npm run build:site' -ForegroundColor Cyan
& npm.cmd run build:site
if ($LASTEXITCODE -ne 0) { throw "npm run build:site failed (exit $LASTEXITCODE)" }

$null = New-Item -ItemType Directory -Force -Path $OutDir
$zip = Join-Path $OutDir 'spgrid-site.zip'
if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
Compress-Archive -Path (Join-Path $PSScriptRoot 'site\*') -DestinationPath $zip -CompressionLevel Optimal

Write-Host ("{0} ({1} KB)" -f $zip, [math]::Round((Get-Item $zip).Length / 1KB)) -ForegroundColor Green
