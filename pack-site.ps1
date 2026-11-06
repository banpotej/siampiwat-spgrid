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
# Not Compress-Archive: Windows PowerShell 5.1 writes entry names with backslashes ("assets\x.css"), which Linux
# hosts extract as flat files, so /assets/*.css (and every other subfolder) 404s. Zip entries must use "/".
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$siteDir = (Resolve-Path (Join-Path $PSScriptRoot 'site')).Path
$archive = [System.IO.Compression.ZipFile]::Open($zip, 'Create')
try {
    foreach ($file in Get-ChildItem -LiteralPath $siteDir -Recurse -File) {
        $entry = $file.FullName.Substring($siteDir.Length).TrimStart('\', '/').Replace('\', '/')
        $null = [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $file.FullName, $entry, 'Optimal')
    }
}
finally { $archive.Dispose() }

Write-Host ("{0} ({1} KB)" -f $zip, [math]::Round((Get-Item $zip).Length / 1KB)) -ForegroundColor Green
