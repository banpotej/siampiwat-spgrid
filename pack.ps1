# Builds the two release files into .\release\ : siampiwat-spgrid-<version>.tgz (for npm) and siampiwat-spgrid-<version>.zip (the same
# package unzipped, for people without npm), plus SHA256SUMS.txt and INSTALL.md (how another app installs these files).
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

    # 3. INSTALL.md: how another app installs exactly these files (the version and the checksums are filled in)
    $tgzSum = ($sums | Where-Object { $_ -like "*$tgzName" }) -replace '\s.*$', ''
    $install = @"
# Install @siampiwat/spgrid $version

Files in this folder: ``$tgzName`` (npm package), ``$zipName`` (the same, for people without npm), ``SHA256SUMS.txt``.

## 1. Check the file (optional)

PowerShell: ``(Get-FileHash .\$tgzName -Algorithm SHA256).Hash.ToLower()`` must print
``$tgzSum``

## 2. Install in the app

``````sh
npm install ./$tgzName                 # from a copy of the file (adjust the path)
# or, from the GitHub Release (a private repo needs a token):
# npm install https://github.com/banpotej/siampiwat-spgrid/releases/download/v$version/$tgzName
``````

Check: ``npm ls @siampiwat/spgrid`` shows ``$version``.

## 3. Use it (browser only; in Next.js / React create the grid in ``useEffect`` of a client component)

``````js
import { SPGrid, thaiLabels } from '@siampiwat/spgrid'; // the stylesheet comes with it
const grid = new SPGrid(document.querySelector('#app'), { rowKey: 'id', columns, rows, labels: thaiLabels, searchable: true });
// grid.destroy() when the element goes away
``````

## 4. Tell the coding agent (Claude Code or another)

Add to the app's ``CLAUDE.md`` / ``AGENTS.md``:

``````md
## SPGrid
ตารางข้อมูลใช้ @siampiwat/spgrid ห้ามเขียนตารางเอง
@node_modules/@siampiwat/spgrid/docs/AGENT_GUIDE.md
ตัวเลือกที่ไม่อยู่ในคู่มือย่อ ดู node_modules/@siampiwat/spgrid/docs/API.md
``````

The guide describes version $version; it says which options need which version.

## Upgrading from 2.0.x

Nothing breaks. Two things users may notice (see CHANGELOG.md): the Thai label ``clear`` is now "ล้างเฉพาะคำค้นหา", and rows that take
``onRowActivate`` / ``selectable`` are one Tab stop (arrow keys move between rows) instead of every row being a Tab stop.
"@
    Set-Content -LiteralPath (Join-Path $OutDir 'INSTALL.md') -Value $install -Encoding utf8

    Write-Host ''
    foreach ($file in $tgz, $zip) {
        Write-Host ("{0} ({1} KB)" -f $file, [math]::Round((Get-Item $file).Length / 1KB)) -ForegroundColor Green
    }
    $sums | ForEach-Object { Write-Host $_ }
}
finally {
    Remove-Item -LiteralPath $stage -Recurse -Force -ErrorAction SilentlyContinue
}
