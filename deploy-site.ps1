# Deploys release\spgrid-site.zip to Cloudflare (Workers static assets, the worker named in wrangler.jsonc).
# The zip is extracted to a temp folder first, so what goes live is exactly the packed file.
# Login: run interactively and wrangler opens the browser the first time, or set CLOUDFLARE_API_TOKEN (and
# CLOUDFLARE_ACCOUNT_ID) for a non-interactive run. Wrangler is fetched by npx; it is not a project dependency.
# Usage: .\deploy-site.ps1 [-Pack] [-DryRun] [-Zip <path>] [-Name <worker>]
param(
    [string]$Zip = (Join-Path $PSScriptRoot 'release\spgrid-site.zip'),
    [string]$Name,
    [string]$WranglerVersion = '4',
    [switch]$Pack,
    [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# Worker name and compatibility date come from wrangler.jsonc (plain JSON, no comments) so the two stay in step.
$config = Get-Content (Join-Path $PSScriptRoot 'wrangler.jsonc') -Raw | ConvertFrom-Json
if (-not $Name) { $Name = $config.name }
$compatDate = $config.compatibility_date
if (-not $Name -or -not $compatDate) { throw 'wrangler.jsonc needs "name" and "compatibility_date".' }

if ($Pack) {
    Write-Host '> .\pack-site.ps1' -ForegroundColor Cyan
    & "$PSScriptRoot\pack-site.ps1"
}
if (-not (Test-Path -LiteralPath $Zip)) { throw "$Zip not found. Run .\pack-site.ps1 (or add -Pack) first." }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$temp = Join-Path ([System.IO.Path]::GetTempPath()) ("spgrid-site-" + [guid]::NewGuid().ToString('N'))
try {
    [System.IO.Compression.ZipFile]::ExtractToDirectory((Resolve-Path -LiteralPath $Zip).Path, $temp)
    if (-not (Test-Path -LiteralPath (Join-Path $temp 'index.html'))) {
        throw "$Zip has no index.html at its root; rebuild it with .\pack-site.ps1."
    }
    $count = @(Get-ChildItem -LiteralPath $temp -Recurse -File).Count

    $wrangler = @('--yes', "wrangler@$WranglerVersion", 'deploy', '--assets', '.', '--name', $Name, '--compatibility-date', $compatDate)
    if ($DryRun) { $wrangler += '--dry-run' }
    Write-Host ("> npx {0}  ({1} files from {2})" -f ($wrangler -join ' '), $count, (Split-Path $Zip -Leaf)) -ForegroundColor Cyan

    # Run inside the extracted folder: no wrangler.jsonc up the tree, so the config's ./site directory is not used.
    Push-Location $temp
    try {
        & npx.cmd @wrangler
        if ($LASTEXITCODE -ne 0) { throw "wrangler deploy failed (exit $LASTEXITCODE)" }
    }
    finally { Pop-Location }
}
finally {
    if (Test-Path -LiteralPath $temp) { Remove-Item -LiteralPath $temp -Recurse -Force }
}

Write-Host $(if ($DryRun) { 'Dry run finished; nothing was deployed.' } else { "Deployed $Name." }) -ForegroundColor Green
