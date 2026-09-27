@echo off
title AI Interview Launcher

cd /d "%~dp0"

echo.
echo ==========================================
echo        AI INTERVIEW APPLICATION
echo ==========================================
echo.

echo Starting Database and Backend...
start "AI Interview - Backend" cmd /k "cd /d "%~dp0backend" && call venv\Scripts\activate.bat && python scripts\start_db.py && python -m uvicorn app.main:app --reload --port 8000"

timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "AI Interview - Frontend" cmd /k "cd /d "%~dp0" && npm run dev"

echo.
echo ==========================================
echo Backend  : http://127.0.0.1:8000
echo Frontend : http://localhost:5173
echo ==========================================
echo.
echo Both servers have been started.
echo.
pause
