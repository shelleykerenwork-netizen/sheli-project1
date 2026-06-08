@echo off
title Backend - FastAPI :8000
cd /d "%~dp0backend"
python -m uvicorn app.main:app --reload --port 8000
pause
