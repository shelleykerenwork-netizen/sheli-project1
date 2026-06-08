@echo off
title Survey System - Starting
set "PATH=C:\Program Files\nodejs;%PATH%"

echo ==========================================
echo   Survey System - Starting...
echo ==========================================
echo.

python --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed - https://python.org
    pause
    exit /b 1
)

node --version > nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed - https://nodejs.org
    pause
    exit /b 1
)

echo [1/3] Installing Python dependencies...
cd /d "%~dp0backend"
python -m pip install -r requirements.txt -q
echo       Done.

echo [2/3] Installing Node.js dependencies...
cd /d "%~dp0frontend"
if not exist node_modules npm install --silent
echo       Done.

echo [3/3] Starting servers...
start "" "%~dp0run_backend.bat"
timeout /t 3 /nobreak > nul
start "" "%~dp0run_frontend.bat"
timeout /t 5 /nobreak > nul

echo.
echo ==========================================
echo   URL:      http://localhost:5173
echo   Email:    shelleykeren@gmail.com
echo   Password: changeme123
echo ==========================================
echo.

start "" http://localhost:5173
echo You can close this window. Servers keep running.
pause
