@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"

echo.
echo   ====================================
echo    JARVIS - instalacao
echo   ====================================
echo.

where python >nul 2>nul
if errorlevel 1 (
  echo   Python nao encontrado.
  echo.
  echo   Baixe em https://www.python.org/downloads/
  echo   IMPORTANTE: na primeira tela, marque "Add python.exe to PATH".
  echo.
  pause
  exit /b 1
)

for /f "tokens=2" %%v in ('python --version') do set VERSAO=%%v
echo   Python %VERSAO% encontrado.
echo.

if not exist ".venv" (
  echo   Criando o ambiente...
  python -m venv .venv
)
call .venv\Scripts\activate.bat

echo   Instalando o que o Jarvis precisa. Isso leva alguns minutos.
echo.
python -m pip install --upgrade pip --quiet
python -m pip install -r requisitos.txt
if errorlevel 1 (
  echo.
  echo   Algo falhou na instalacao. Leia o erro acima.
  pause
  exit /b 1
)

echo.
echo   Instalando a palavra de ativacao...
python -m pip install openwakeword
if errorlevel 1 (
  echo.
  echo   A palavra de ativacao nao instalou - o erro esta acima.
  echo   O Jarvis funciona assim mesmo, no modo teclado: jarvis.bat --texto
  echo   Me mostre esse erro que eu resolvo.
  echo.
)

echo.
echo   Instalando o navegador que ele controla...
python -m playwright install chromium

echo.
python primeira_vez.py

echo.
echo   Abrindo o arquivo das chaves...
start notepad .env

echo.
echo   Preencha a chave do Claude OU a do Gemini, salve, feche,
echo   e rode: jarvis.bat --checar
echo.
pause
