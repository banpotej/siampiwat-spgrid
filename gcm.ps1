# Fetch, pull, stage everything, commit and push the current branch.
# Usage: .\gcm.ps1 "feat: my message"   (message defaults to a timestamp)
param(
    [string]$Message = ("chore: update {0:yyyy-MM-dd HH:mm:ss}" -f (Get-Date))
)

$ErrorActionPreference = 'Stop'

function Invoke-Git {
    Write-Host "> git $($args -join ' ')" -ForegroundColor Cyan
    & git @args
    if ($LASTEXITCODE -ne 0) { throw "git $($args -join ' ') failed (exit $LASTEXITCODE)" }
}

Invoke-Git fetch
Invoke-Git pull
Invoke-Git add .

if (git status --porcelain) {
    Invoke-Git commit -m $Message
}
else {
    Write-Host 'Nothing to commit.' -ForegroundColor Yellow
}

Invoke-Git push
