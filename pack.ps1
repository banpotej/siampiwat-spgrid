# Builds the two release files into .\release\ : siampiwat-spgrid-<version>.tgz (for npm) and siampiwat-spgrid-<version>.zip (the same
# package unzipped, for people without npm), plus SHA256SUMS.txt.
# Usage: .\pack.ps1              runs `npm run check` first (lint, types, tests, build, e2e), then packs
#        .\pack.ps1 -SkipCheck   only builds and packs
param(
    [string]$OutDir = (Join-Path $PSScriptRoot 'release'),
    [switch]$SkipCheck
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Invoke-Native {
    Write-Host "> $($args -join ' ')" -ForegroundColor Cyan
    & $args[0] @($args | Select-Object -Skip 1)
    if ($LASTEXITCODE -ne 0) { throw "$($args -join ' ') failed (exit $LASTEXITCODE)" }
}

$version = (Get-Content -Raw -LiteralPath 'package.json' | ConvertFrom-Json).version
$tgzName = "siampiwat-spgrid-$version.tgz"
$zipName = "siampiwat-spgrid-$version.zip"

if ($SkipCheck) { Invoke-Native npm.cmd run build } else { Invoke-Native npm.cmd run check }

$null = New-Item -ItemType Directory -Force -Path $OutDir
$stage = Join-Path ([IO.Path]::GetTempPath()) ("spgrid-pack-" + [guid]::NewGuid().ToString('N'))
$null = New-Item -ItemType Directory -Force -Path $stage
try {
    # 1. the npm tarball (what `npm install <file>` takes)
    Invoke-Native npm.cmd pack --pack-destination $OutDir --silent
    $tgz = Join-Path $OutDir $tgzName
    if (-not (Test-Path -LiteralPath $tgz)) { throw "npm pack did not make $tgzName" }

    # 2. the same files as a zip: dist\ (spgrid.js, spgrid.css, ...), docs\, README.md, package.json ...
    Invoke-Native tar.exe -xzf $tgz -C $stage
    Rename-Item -LiteralPath (Join-Path $stage 'package') -NewName "spgrid-$version"
    $zip = Join-Path $OutDir $zipName
    if (Test-Path -LiteralPath $zip) { Remove-Item -LiteralPath $zip -Force }
    Compress-Archive -Path (Join-Path $stage "spgrid-$version") -DestinationPath $zip -CompressionLevel Optimal

    $sums = foreach ($file in $tgz, $zip) {
        "{0}  {1}" -f (Get-FileHash -LiteralPath $file -Algorithm SHA256).Hash.ToLower(), (Split-Path $file -Leaf)
    }
    Set-Content -LiteralPath (Join-Path $OutDir 'SHA256SUMS.txt') -Value $sums -Encoding ascii

    Write-Host ''
    foreach ($file in $tgz, $zip) {
        Write-Host ("{0} ({1} KB)" -f $file, [math]::Round((Get-Item $file).Length / 1KB)) -ForegroundColor Green
    }
    $sums | ForEach-Object { Write-Host $_ }
}
finally {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
