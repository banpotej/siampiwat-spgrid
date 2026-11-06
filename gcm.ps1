$ErrorActionPreference = "Stop"

Write-Host "=============== git commit all starting ============"

git pull
git add .

git diff --cached --quiet
if ($LASTEXITCODE -ne 0) {
    Write-Host "Generating commit message with Claude..."

    $instructions = "Read the git diff provided as input and write ONE single-line git commit message summarizing it, using conventional commit style (feat:, fix:, chore:, refactor:, docs:). Output ONLY the commit message text - no quotes, no markdown, no explanation, no extra lines."

    $msg = $null
    try {
        $msg = (git diff --cached | claude -p $instructions --tools "" --no-session-persistence 2>$null | Out-String).Trim()
    } catch {
        $msg = $null
    }

    if ($msg) {
        $msg = ($msg -split "`n" | Where-Object { $_.Trim() -ne "" } | Select-Object -First 1)
    }

    if (-not $msg) {
        Write-Host "Claude did not return a message, falling back to timestamp."
        $msg = Get-Date -Format "yyyyMMddHHmmss"
    }

    Write-Host "Commit message: $msg"
    git commit -m "$msg"
}
else {
    Write-Host "No changes to commit."
}

git push

Write-Host "=============== git commit all completed ============"
