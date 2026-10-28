@echo off
rem Dois cliques aqui: abre a central dos agentes no navegador.
rem Deixe a janela preta aberta enquanto os agentes trabalham.
chcp 65001 >nul
cd /d "%~dp0"
where python >nul 2>nul
if errorlevel 1 (
  echo   Nao achei o Python. Instale em python.org e marque "Add python.exe to PATH".
  pause
  exit /b 1
)
python -c "import playwright" 2>nul
if errorlevel 1 (
  echo   Instalando o que falta - so na primeira vez...
  python -m pip install -r requirements.txt
  python -m playwright install chromium
)
python funil.py central %*
pause
