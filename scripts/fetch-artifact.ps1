# RusCraft: загрузка артефакта CI (www/) с этой машины.
# Требуется установленный gh (winget install --id GitHub.cli) и `gh auth login`.
# Использование:  powershell -File scripts\fetch-artifact.ps1 [-Run <run_id>]
param([string]$Run = "")

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root

if ($Run -eq "") {
    Write-Host "Последние запуски ruscraft-build:"
    gh run list --workflow ruscraft-build.yml --limit 5
    $Run = (gh run list --workflow ruscraft-build.yml --limit 1 --json databaseId --jq '.[0].databaseId')
    if (-not $Run) { Write-Error "Нет ни одного завершённого запуска ruscraft-build"; exit 1 }
}
Write-Host "Скачиваю артефакт из забега $Run ..."
$tmp = Join-Path $root "www-tmp"
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
gh run download $Run -n ruscraft-www -D $tmp
if (-not (Test-Path (Join-Path $tmp "index.html"))) {
    Write-Error "В артефакте нет index.html — что-то не так со структурой www/"
    exit 1
}
Remove-Item -Recurse -Force (Join-Path $root "www") -ErrorAction SilentlyContinue
Move-Item $tmp (Join-Path $root "www")
Write-Host "OK: www/ обновлён. Запуск: node scripts/serve.js"
Pop-Location
