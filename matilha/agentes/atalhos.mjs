/**
 * OS ATALHOS DO JARVIS, EM QUALQUER PROGRAMA DO WINDOWS.
 *
 *   · Segure Ctrl+Alt+Espaço e fale: é o Jarvis, de qualquer tela. No
 *     instante em que você aperta, ele tira um print (só fica guardado
 *     no notebook; vai para leitura apenas se a pergunta for sobre a
 *     tela). A resposta vem falada pela voz do Windows.
 *   · Segure Ctrl+Alt+D e fale: é o ditado. Quando você solta, o texto
 *     aparece onde o cursor está (Word, e-mail, WhatsApp Web…).
 *
 * Quem escuta as teclas e grava o microfone é um PowerShell que fica
 * rodando junto com a Matilha: o próprio Windows registra o atalho
 * (RegisterHotKey) e grava pelo MCI (winmm), sem instalar nada e sem
 * precisar da página do Jarvis aberta. Ele avisa o servidor com uma
 * linha de JSON por gravação.
 */
import { spawn } from 'node:child_process';
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { platform } from 'node:os';

import { PS_PRINT } from './tela.mjs';

export const TECLAS = { jarvis: 'Ctrl+Alt+Espaço', ditado: 'Ctrl+Alt+D' };

const SCRIPT = (pasta) => `
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8
${PS_PRINT}
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public static class Atalho {
  [DllImport("user32.dll")] public static extern bool RegisterHotKey(IntPtr h, int id, uint mod, uint vk);
  [DllImport("user32.dll")] public static extern bool PeekMessage(out MSG m, IntPtr h, uint a, uint b, uint remove);
  [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vk);
  [DllImport("winmm.dll", CharSet = CharSet.Unicode)] public static extern int mciSendString(string cmd, StringBuilder ret, int len, IntPtr cb);
  [StructLayout(LayoutKind.Sequential)] public struct MSG { public IntPtr hwnd; public uint message; public IntPtr wParam; public IntPtr lParam; public uint time; public int x; public int y; }
}
"@
$pasta = '${pasta.replace(/'/g, "''")}'
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
function Diz($obj) { [Console]::Out.WriteLine(($obj | ConvertTo-Json -Compress)); [Console]::Out.Flush() }
# Ctrl (2) + Alt (1) + sem repetir (0x4000). Espaço = 0x20, D = 0x44.
$teclas = @{ 1 = 0x20; 2 = 0x44 }
$ok1 = [Atalho]::RegisterHotKey([IntPtr]::Zero, 1, 0x4003, 0x20)
$ok2 = [Atalho]::RegisterHotKey([IntPtr]::Zero, 2, 0x4003, 0x44)
Diz @{ evento = 'pronto'; jarvis = $ok1; ditado = $ok2 }
$m = New-Object Atalho+MSG
while ($true) {
  if (-not [Atalho]::PeekMessage([ref]$m, [IntPtr]::Zero, 0, 0, 1)) { Start-Sleep -Milliseconds 40; continue }
  if ($m.message -ne 0x0312) { continue }
  $id = [int]$m.wParam
  $modo = if ($id -eq 1) { 'jarvis' } else { 'ditado' }
  $marca = [DateTime]::Now.Ticks
  $tela = $null
  if ($modo -eq 'jarvis') {
    # O print primeiro: é a tela do jeito que estava quando você apertou.
    try { $tela = Join-Path $pasta "tela-$marca.jpg"; Tira-Print $tela } catch { $tela = $null }
  }
  $audio = Join-Path $pasta "fala-$marca.wav"
  $nada = New-Object System.Text.StringBuilder 128
  [void][Atalho]::mciSendString('close jv', $nada, 128, [IntPtr]::Zero)
  [void][Atalho]::mciSendString('open new type waveaudio alias jv', $nada, 128, [IntPtr]::Zero)
  [void][Atalho]::mciSendString('set jv time format ms bitspersample 16 channels 1 samplespersec 16000 bytespersec 32000 alignment 2', $nada, 128, [IntPtr]::Zero)
  [void][Atalho]::mciSendString('record jv', $nada, 128, [IntPtr]::Zero)
  try { [console]::Beep(880, 70) } catch {}
  $inicio = Get-Date
  # Grava enquanto a tecla estiver segura (no máximo 40 segundos).
  while ((([Atalho]::GetAsyncKeyState($teclas[$id]) -band 0x8000) -ne 0) -and (((Get-Date) - $inicio).TotalSeconds -lt 40)) { Start-Sleep -Milliseconds 30 }
  [void][Atalho]::mciSendString('stop jv', $nada, 128, [IntPtr]::Zero)
  [void][Atalho]::mciSendString("save jv \`"$audio\`"", $nada, 128, [IntPtr]::Zero)
  [void][Atalho]::mciSendString('close jv', $nada, 128, [IntPtr]::Zero)
  try { [console]::Beep(620, 70) } catch {}
  $segundos = ((Get-Date) - $inicio).TotalSeconds
  Diz @{ evento = 'gravou'; modo = $modo; audio = $audio; tela = $tela; segundos = $segundos }
}
`;

export class Atalhos {
  /**
   * `aoFalar({ modo, audio, tela })`: chamado a cada gravação. `audio` é um
   * Buffer WAV; `tela` é o nome do print (ou null).
   */
  constructor({ pasta, aoFalar, diz = () => {} }) {
    this.pasta = pasta; // dados/telas (os prints e os áudios ficam juntos)
    this.aoFalar = aoFalar;
    this.diz = diz;
    this.processo = null;
    this.situacao = { ligado: false, jarvis: false, ditado: false, erro: platform() === 'win32' ? '' : 'só no Windows' };
  }

  async liga() {
    if (platform() !== 'win32' || this.processo || this.desligado) return this.situacao;
    await mkdir(this.pasta, { recursive: true });
    const arquivo = join(this.pasta, '..', 'atalhos.ps1');
    // Com BOM: o PowerShell 5 lê o acento do arquivo certo assim.
    await writeFile(arquivo, `﻿${SCRIPT(this.pasta)}`, 'utf8');
    const filho = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-STA', '-WindowStyle', 'Hidden', '-File', arquivo], { windowsHide: true });
    this.processo = filho;
    let resto = '';
    filho.stdout.on('data', (p) => {
      resto += p;
      const linhas = resto.split(/\r?\n/);
      resto = linhas.pop();
      for (const linha of linhas) this._linha(linha.trim());
    });
    let erro = '';
    filho.stderr.on('data', (p) => { erro += p; });
    filho.on('close', () => {
      this.processo = null;
      this.situacao = { ...this.situacao, ligado: false, erro: erro.trim().split('\n').pop()?.slice(0, 200) || 'os atalhos pararam' };
      this.diz(`  ⚠ atalhos do Jarvis pararam: ${this.situacao.erro}`);
      // Volta sozinho (um antivírus que matou o PowerShell, um erro passageiro), até 3 vezes por hora.
      if (this.desligado) return;
      this.quedas = (this.quedas || []).filter((t) => Date.now() - t < 3600_000);
      if (this.quedas.length < 3) {
        this.quedas.push(Date.now());
        setTimeout(() => { this.liga().catch(() => {}); }, 15_000);
      }
    });
    return this.situacao;
  }

  desliga() { this.desligado = true; this.processo?.kill(); this.processo = null; }

  async _linha(linha) {
    if (!linha.startsWith('{')) return;
    let ev;
    try { ev = JSON.parse(linha); } catch { return; }
    if (ev.evento === 'pronto') {
      this.situacao = { ligado: true, jarvis: Boolean(ev.jarvis), ditado: Boolean(ev.ditado), erro: '' };
      const falhou = [!ev.jarvis && TECLAS.jarvis, !ev.ditado && TECLAS.ditado].filter(Boolean);
      if (falhou.length) this.situacao.erro = `outro programa já usa ${falhou.join(' e ')}`;
      this.diz(`  ✦ atalhos do Jarvis: ${TECLAS.jarvis} (falar) e ${TECLAS.ditado} (ditado)${falhou.length ? ` · ${this.situacao.erro}` : ''}`);
      return;
    }
    if (ev.evento !== 'gravou') return;
    let audio = null;
    try { audio = await readFile(ev.audio); } catch { audio = null; }
    unlink(ev.audio).catch(() => {});
    // Toque rápido sem fala (menos de meio segundo) não é pedido.
    if (!audio || ev.segundos < 0.5) return;
    const tela = ev.tela ? ev.tela.split(/[\\/]/).pop() : null;
    try { await this.aoFalar({ modo: ev.modo, audio, tela }); } catch (e) { this.diz(`  ⚠ atalho do Jarvis: ${e.message}`); }
  }
}
