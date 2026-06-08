$env:Path = "C:\Program Files\nodejs;" + [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$backend = Join-Path $root "backend"
$frontend = Join-Path $root "frontend"

Write-Host "=== Installing Python dependencies ===" -ForegroundColor Cyan
Set-Location $backend
python -m pip install -r requirements.txt -q

Write-Host "=== Installing Node dependencies ===" -ForegroundColor Cyan
Set-Location $frontend
if (-not (Test-Path "node_modules")) { npm install --silent }

Write-Host "=== Starting Backend ===" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$backend'; python -m uvicorn app.main:app --reload --port 8000"

Start-Sleep -Seconds 3

Write-Host "=== Starting Frontend ===" -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", `
    '$env:Path = "C:\Program Files\nodejs;" + $env:Path; ' + `
    "Set-Location '$frontend'; npm run dev"

Start-Sleep -Seconds 5

Write-Host ""
Write-Host "===========================================" -ForegroundColor Yellow
Write-Host "  URL:      http://localhost:5173" -ForegroundColor White
Write-Host "  Email:    shelleykeren@gmail.com" -ForegroundColor White
Write-Host "  Password: changeme123" -ForegroundColor White
Write-Host "===========================================" -ForegroundColor Yellow

Start-Process "http://localhost:5173"
