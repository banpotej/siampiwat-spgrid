# Check, commit pending work, bump version, publish to npm and push commit + tag.
# Usage: .\release.ps1 [-Bump patch|minor|major] [-Message "feat: ..."] [-SkipCheck]
param(
    [ValidateSet('patch', 'minor', 'major')]
    [string]$Bump = 'patch',
    [string]$Message,
    [switch]$SkipCheck
)

$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

function Invoke-Step {
    Write-Host "> $($args -join ' ')" -ForegroundColor Cyan
    $cmd, $rest = $args
    & $cmd @rest
    if ($LASTEXITCODE -ne 0) { throw "$($args -join ' ') failed (exit $LASTEXITCODE)" }
}

$branch = (git rev-parse --abbrev-ref HEAD).Trim()
if ($branch -ne 'main') { throw "Release from main only (current: $branch)." }

# Fail before anything changes: a release needs entries under [Unreleased].
if ((Get-Content CHANGELOG.md -Raw) -notmatch '## \[Unreleased\]\s+###') {
    throw 'CHANGELOG.md has no entries under [Unreleased]; add them before releasing.'
}

if (-not $SkipCheck) { Invoke-Step npm run check }

# Commit and push pending work through gcm.ps1.
if ($Message) { & "$PSScriptRoot\gcm.ps1" $Message } else { & "$PSScriptRoot\gcm.ps1" }

# Bump package.json / package-lock.json without letting npm commit or tag.
Invoke-Step npm version $Bump --no-git-tag-version
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version

# The install examples in README.md and index.html spell out the version; keep them on the new one.
foreach ($file in 'README.md', 'index.html') {
    $text = Get-Content "$PSScriptRoot\$file" -Raw -Encoding UTF8
    $text = $text -replace '(download/v|siampiwat-datagrid-)\d+\.\d+\.\d+', "`${1}$version"
    $text = $text -replace '(datagrid@(?:<span class="npm-version">)?)\d+\.\d+\.\d+', "`${1}$version"
    [IO.File]::WriteAllText("$PSScriptRoot\$file", $text, (New-Object Text.UTF8Encoding($false)))
}

# Turn [Unreleased] into the new version section.
$changelog = Get-Content CHANGELOG.md -Raw
$heading = "## [Unreleased]`n`n## [$version] - {0:yyyy-MM-dd}" -f (Get-Date)
$changelog = $changelog -replace '## \[Unreleased\]', $heading
[IO.File]::WriteAllText("$PSScriptRoot\CHANGELOG.md", $changelog, (New-Object Text.UTF8Encoding($false)))

Invoke-Step git add package.json package-lock.json CHANGELOG.md README.md index.html
Invoke-Step git commit -m $version
Invoke-Step git tag "v$version"

# Publish first: if it fails nothing has been pushed yet.
Invoke-Step npm publish --access public
Invoke-Step git push --follow-tags

Write-Host "Released v$version" -ForegroundColor Green
