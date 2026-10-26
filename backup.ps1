# Zips the project to D:\backup\datagrid_yyyymmdd_hhmmss.zip (skips node_modules, dist, test reports).
param(
    [string]$Source = $PSScriptRoot,
    [string]$Destination = 'D:\backup'
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression.FileSystem

$exclude = @('node_modules', 'dist', 'playwright-report', 'test-results')
$null = New-Item -ItemType Directory -Force -Path $Destination
$zipPath = Join-Path $Destination ("datagrid_{0:yyyyMMdd_HHmmss}.zip" -f (Get-Date))

$root = (Resolve-Path $Source).Path.TrimEnd('\')
$zip = [System.IO.Compression.ZipFile]::Open($zipPath, 'Create')
try {
    Get-ChildItem -LiteralPath $root -Recurse -File -Force | Where-Object {
        $rel = $_.FullName.Substring($root.Length + 1)
        -not ($exclude | Where-Object { $rel -like "$_\*" })
    } | ForEach-Object {
        $rel = $_.FullName.Substring($root.Length + 1).Replace('\', '/')
        $null = [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $rel, 'Optimal')
    }
}
finally {
    $zip.Dispose()
}

Write-Host "Backup created: $zipPath ($([math]::Round((Get-Item $zipPath).Length / 1KB)) KB)"
