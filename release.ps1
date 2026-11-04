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

if (-not $SkipCheck) { Invoke-Step npm run check }

# Commit and push pending work through gcm.ps1.
if ($Message) { & "$PSScriptRoot\gcm.ps1" $Message } else { & "$PSScriptRoot\gcm.ps1" }

# Bump package.json / package-lock.json without letting npm commit or tag.
Invoke-Step npm version $Bump --no-git-tag-version
$version = (Get-Content package.json -Raw | ConvertFrom-Json).version

# Turn [Unreleased] into the new version section.
$changelog = Get-Content CHANGELOG.md -Raw
if ($changelog -notmatch '## \[Unreleased\]\s+###') {
    throw 'CHANGELOG.md has no entries under [Unreleased]; add them before releasing.'
}
$heading = "## [Unreleased]`n`n## [$version] - {0:yyyy-MM-dd}" -f (Get-Date)
$changelog = $changelog -replace '## \[Unreleased\]', $heading
[IO.File]::WriteAllText("$PSScriptRoot\CHANGELOG.md", $changelog, (New-Object Text.UTF8Encoding($false)))

Invoke-Step git add package.json package-lock.json CHANGELOG.md
Invoke-Step git commit -m $version
Invoke-Step git tag "v$version"

# Publish first: if it fails nothing has been pushed yet.
Invoke-Step npm publish --access public
Invoke-Step git push --follow-tags

Write-Host "Released v$version" -ForegroundColor Green
