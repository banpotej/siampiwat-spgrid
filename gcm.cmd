@echo off
setlocal EnableExtensions
cls

REM Actual logic lives in gcm.ps1 (uses claude CLI to write the commit message,
REM falls back to a timestamp if claude is unavailable/not logged in)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0gcm.ps1"

endlocal
