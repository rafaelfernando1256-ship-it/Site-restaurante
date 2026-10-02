@echo off
chcp 65001 >nul
cd /d "%~dp0"
if not exist ".venv" (
  echo   O Jarvis ainda nao foi instalado. Rode instalar.bat primeiro.
  pause
  exit /b 1
)
call .venv\Scripts\activate.bat
python jarvis.py %*
