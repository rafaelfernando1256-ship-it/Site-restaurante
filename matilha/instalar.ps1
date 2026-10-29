# ═══════════════════════════════════════════════════════════════════
#  INSTALAR (OU ATUALIZAR) A MATILHA — com o Jarvis dentro.
#
#  Você não abre este arquivo. Você cola UMA linha no PowerShell (ela
#  está no COMECE-AQUI.txt) e a linha chama este roteiro. Ele:
#
#    1. acha os arquivos da Matilha que acabaram de ser extraídos;
#    2. decide onde instalar: se você já tem a Matilha (o atalho da área
#       de trabalho diz onde), atualiza ali mesmo, sem tocar nos seus
#       clientes, chaves e na sessão do WhatsApp; senão, cria a pasta
#       Matilha dentro da sua pasta de usuário;
#    3. tira a marca de "veio da internet" da pasta;
#    4. instala o Node.js, se faltar (o Windows pede permissão uma vez);
#    5. instala o Claude Code, se faltar;
#    6. chama o INSTALAR.mjs, que baixa o resto, cria o atalho "Matilha"
#       na área de trabalho e abre o painel.
#
#  Por que colar uma linha em vez de clicar num instalador: o Windows 11
#  (Controle de Aplicativo Inteligente) bloqueia instalador, .bat, .cmd e
#  roteiro que vieram da internet, e não tem como liberar um só. Texto
#  colado não "veio da internet": é você digitando.
#
#  Pode rodar quantas vezes quiser: o que já está feito ele só confere.
# ═══════════════════════════════════════════════════════════════════

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'   # a barra de progresso do PowerShell 5 deixa o download 10x mais lento
try { [Console]::OutputEncoding = [Text.Encoding]::UTF8 } catch {}
try { [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 } catch {}

function Passo([string]$t) { Write-Host ''; Write-Host "  · $t" -ForegroundColor Cyan }
function Ok([string]$t) { Write-Host "    ✓ $t" -ForegroundColor Green }
function Diz([string]$t) { Write-Host "    $t" }
function Desiste([string]$t, [string]$conserto) {
  Write-Host ''
  Write-Host "  ✗ $t" -ForegroundColor Red
  if ($conserto) { Write-Host "    $conserto" }
  Write-Host ''
  Write-Host '    Se não entender, tire uma foto desta janela e me mande.'
  throw 'A instalação parou.'
}
function RecarregaPath {
  $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User')
  $npmGlobal = Join-Path $env:APPDATA 'npm'
  if ((Test-Path $npmGlobal) -and ($env:Path -notlike "*$npmGlobal*")) { $env:Path += ";$npmGlobal" }
}
function VersaoDoNode {
  try { $v = (& node --version) 2>$null; if ($v -match '^v(\d+)') { return [int]$Matches[1] } } catch {}
  return 0
}
function AreaDeTrabalho { [Environment]::GetFolderPath('Desktop') }

Write-Host ''
Write-Host '  ═══ MATILHA + JARVIS ═══════════════════════════════════' -ForegroundColor Yellow
Write-Host '  Não precisa fazer nada. Se o Windows pedir permissão, clique em Sim.'

# ── 1 · de onde ────────────────────────────────────────────────────
$origem = if ($MatilhaOrigem) { $MatilhaOrigem } else { (Get-Location).Path }
if (-not (Test-Path (Join-Path $origem 'servidor.mjs'))) {
  $dentro = Join-Path $origem 'matilha'
  if (Test-Path (Join-Path $dentro 'servidor.mjs')) { $origem = $dentro }
  else { Desiste 'Não achei os arquivos da Matilha.' 'Baixe o matilha.zip de novo, deixe na pasta Downloads e cole a linha outra vez.' }
}

# ── 2 · para onde ──────────────────────────────────────────────────
Passo 'Vendo onde a Matilha fica'
$destino = $null
$atalho = Join-Path (AreaDeTrabalho) 'Matilha.lnk'
if (Test-Path $atalho) {
  try {
    $pasta = (New-Object -ComObject WScript.Shell).CreateShortcut($atalho).WorkingDirectory
    if ($pasta -and (Test-Path (Join-Path $pasta 'servidor.mjs'))) { $destino = $pasta }
  } catch {}
}
# Quem vem do Órbita: o atalho antigo diz onde estão os clientes, as chaves e o WhatsApp.
$atalhoVelho = Join-Path (AreaDeTrabalho) 'Orbita.lnk'
if (Test-Path $atalhoVelho) {
  try {
    $velha = (New-Object -ComObject WScript.Shell).CreateShortcut($atalhoVelho).WorkingDirectory
    if ($velha -and (Test-Path (Join-Path $velha 'ABRIR-ORBITA.mjs'))) { $env:MATILHA_ORBITA = $velha }
  } catch {}
}
$atualizando = [bool]$destino
if (-not $destino) { $destino = Join-Path $HOME 'Matilha' }
if ($atualizando) { Ok "você já tem a Matilha em $destino — vou atualizar ali (seus clientes, chaves e WhatsApp ficam)" }
else { Ok "vou instalar em $destino" }

# A Matilha aberta segura os arquivos: fecha antes de trocar.
try {
  $ocupada = Get-NetTCPConnection -LocalPort 8899 -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($ocupada) {
    $proc = Get-Process -Id $ocupada.OwningProcess -ErrorAction SilentlyContinue
    if ($proc -and $proc.ProcessName -eq 'node') {
      Diz 'a Matilha está aberta: fechando para atualizar'
      Stop-Process -Id $proc.Id -Force
      Start-Sleep -Seconds 2
    }
  }
} catch {}

# ── 3 · os arquivos ────────────────────────────────────────────────
if ((Resolve-Path $origem).Path -ne $destino) {
  Passo 'Copiando os arquivos'
  New-Item -ItemType Directory -Force -Path $destino | Out-Null
  # Só copia o que veio no zip: nada é apagado (os dados, as chaves e o WhatsApp não vêm no zip).
  & robocopy $origem $destino /E /NFL /NDL /NJH /NJS /NP /R:2 /W:1 | Out-Null
  if ($LASTEXITCODE -ge 8) { Desiste 'Não consegui copiar os arquivos.' "Feche a Matilha (a janela preta) e cole a linha de novo." }
  Ok 'arquivos no lugar'
}
Get-ChildItem -LiteralPath $destino -Recurse -File -ErrorAction SilentlyContinue | Unblock-File -ErrorAction SilentlyContinue
Ok 'marca de "veio da internet" tirada'

# ── 4 · o Node.js ──────────────────────────────────────────────────
Passo 'Conferindo o Node.js (o motor da Matilha)'
RecarregaPath
if ((VersaoDoNode) -lt 18) {
  Diz 'não tem: instalando a versão LTS (uns 2 minutos; o Windows vai pedir permissão)'
  if (Get-Command winget -ErrorAction SilentlyContinue) {
    & winget install --id OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements | Out-Host
    RecarregaPath
  }
  if ((VersaoDoNode) -lt 18) {
    # Sem o winget (Windows mais antigo): o instalador oficial do site do Node.
    $lts = (Invoke-RestMethod 'https://nodejs.org/dist/index.json') | Where-Object { $_.lts } | Select-Object -First 1
    $arq = if ($env:PROCESSOR_ARCHITECTURE -eq 'ARM64') { 'arm64' } else { 'x64' }
    $msi = Join-Path $env:TEMP "node-$($lts.version)-$arq.msi"
    Invoke-WebRequest "https://nodejs.org/dist/$($lts.version)/node-$($lts.version)-$arq.msi" -OutFile $msi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$msi`" /passive /norestart" -Wait -Verb RunAs
    RecarregaPath
  }
  if ((VersaoDoNode) -lt 18) { Desiste 'O Node.js não instalou.' 'Instale a versão LTS em https://nodejs.org (Avançar, Avançar, Concluir) e cole a linha de novo.' }
}
Ok "Node $(& node --version)"

# ── 5 · o Claude Code ──────────────────────────────────────────────
Passo 'Conferindo o Claude Code (quem faz os sites e os projetos do Jarvis)'
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  Diz 'não tem: instalando'
  # npm.cmd, não npm: o npm.ps1 é bloqueado pela política de roteiros do Windows.
  & npm.cmd install -g @anthropic-ai/claude-code 2>&1 | Out-Host
  RecarregaPath
}
if (Get-Command claude -ErrorAction SilentlyContinue) { Ok 'Claude Code instalado (você conecta a sua conta na tela Começar do painel)' }
else { Diz '(não instalou agora — não trava nada: dá para instalar depois pela tela Começar do painel)' }

# ── 6 · o resto, o atalho e o painel ───────────────────────────────
Passo 'Baixando o resto e abrindo o painel'
Diz 'Esta janela É a Matilha rodando. Para desligar, feche esta janela.'
Diz 'Da próxima vez, abra pelo atalho "Matilha" na área de trabalho.'
Set-Location -LiteralPath $destino
& node INSTALAR.mjs
