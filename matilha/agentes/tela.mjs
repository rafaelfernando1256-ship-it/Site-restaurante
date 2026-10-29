/**
 * OS OLHOS, A MÃO E A VOZ DO JARVIS NO WINDOWS.
 *
 *   · capturaTela: um print de todas as telas (vira JPEG de até 1600 px).
 *   · leTela: o que tem no print. Primeiro o Groq (um modelo que vê
 *     imagem, em uns 2 segundos); se ele não der conta, ou se o Rafael
 *     pedir "com calma", o Claude Code olha, com a assinatura.
 *   · cola: escreve um texto no programa que está na frente (ou no que
 *     for nomeado), pela área de transferência, que aceita acento.
 *   · falaNoNotebook: a voz do Windows, para responder quando o pedido
 *     veio de um atalho e a página do Jarvis pode nem estar aberta.
 *
 * O print só sai do notebook quando o Rafael pergunta sobre a tela. Os
 * prints ficam em dados/telas e são apagados depois de um dia.
 */
import { spawn } from 'node:child_process';
import { mkdir, readdir, readFile, stat, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { platform } from 'node:os';

import { rodaClaude } from './claude-cli.mjs';
import { pedeJson, texto } from './comum.mjs';

const WINDOWS = platform() === 'win32';
const GROQ = 'https://api.groq.com/openai/v1';

/** PowerShell sem perfil, com o comando em base64 (aspas e acentos não quebram nada). */
export function powershell(comando, { ms = 30_000 } = {}) {
  return new Promise((ok) => {
    if (!WINDOWS) { ok({ codigo: -1, saida: '', erro: 'só no Windows' }); return; }
    let saida = ''; let erro = '';
    const filho = spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-EncodedCommand',
      Buffer.from(`[Console]::OutputEncoding=[Text.Encoding]::UTF8\n${comando}`, 'utf16le').toString('base64')], { windowsHide: true });
    const relogio = setTimeout(() => filho.kill(), ms);
    filho.stdout.on('data', (p) => { saida += p; });
    filho.stderr.on('data', (p) => { erro += p; });
    filho.on('error', (e) => { clearTimeout(relogio); ok({ codigo: -1, saida, erro: e.message }); });
    filho.on('close', (codigo) => { clearTimeout(relogio); ok({ codigo: codigo ?? -1, saida, erro }); });
  });
}
const aspas = (t) => `'${String(t).replace(/'/g, "''")}'`;

/** O trecho de PowerShell que tira o print de todas as telas e grava em `$arquivo`. Também é usado pelo atalho. */
export const PS_PRINT = `
Add-Type -AssemblyName System.Windows.Forms, System.Drawing
# Sem isto, num notebook com a tela em 125% ou 150% o print sai cortado (pega só um pedaço).
Add-Type @"
using System; using System.Runtime.InteropServices;
public static class Dpi { [DllImport("user32.dll")] public static extern bool SetProcessDPIAware(); }
"@
[void][Dpi]::SetProcessDPIAware()
function Tira-Print([string]$arquivo) {
  $v = [System.Windows.Forms.SystemInformation]::VirtualScreen
  $bmp = New-Object System.Drawing.Bitmap $v.Width, $v.Height
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CopyFromScreen($v.Left, $v.Top, 0, 0, $bmp.Size)
  $g.Dispose()
  $escala = [Math]::Min(1, 1600 / $v.Width)
  $w = [int]($v.Width * $escala); $h = [int]($v.Height * $escala)
  $menor = New-Object System.Drawing.Bitmap $bmp, $w, $h
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $p = New-Object System.Drawing.Imaging.EncoderParameters 1
  $p.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), 82L
  $menor.Save($arquivo, $codec, $p)
  $menor.Dispose(); $bmp.Dispose()
}`;

export class Tela {
  constructor({ pasta }) {
    this.pasta = pasta; // dados/telas
    this.modeloDeVisao = undefined;
  }

  /** Apaga os prints com mais de um dia. */
  async limpa() {
    const nomes = await readdir(this.pasta).catch(() => []);
    for (const n of nomes) {
      const c = join(this.pasta, n);
      const s = await stat(c).catch(() => null);
      if (s && Date.now() - s.mtimeMs > 24 * 3600_000) await unlink(c).catch(() => {});
    }
  }

  /** Tira um print agora. Devolve o nome do arquivo (dentro de dados/telas). */
  async captura() {
    if (!WINDOWS) throw new Error('ver a tela só funciona no Windows');
    await mkdir(this.pasta, { recursive: true });
    this.limpa();
    const nome = `tela-${Date.now()}.jpg`;
    const r = await powershell(`${PS_PRINT}\nTira-Print ${aspas(join(this.pasta, nome))}`, { ms: 20_000 });
    if (r.codigo !== 0) throw new Error(`não consegui tirar o print (${texto(r.erro, 120)})`);
    return nome;
  }

  /** O modelo do Groq que enxerga imagem (procurado uma vez na lista de modelos da sua conta). */
  async modeloDoGroq(chave) {
    if (this.modeloDeVisao !== undefined) return this.modeloDeVisao;
    try {
      const r = await pedeJson(`${GROQ}/models`, { headers: { authorization: `Bearer ${chave}` } }, 20);
      const ids = (r?.data || []).map((m) => m.id);
      this.modeloDeVisao = ids.find((i) => /llama-4-maverick/i.test(i)) || ids.find((i) => /llama-4-scout/i.test(i))
        || ids.find((i) => /vision|-vl\b|vl-/i.test(i)) || null;
    } catch { this.modeloDeVisao = null; }
    return this.modeloDeVisao;
  }

  /**
   * O que tem no print `nome`, respondendo `pergunta`. `comCalma` vai direto
   * para o Claude Code. Devolve { resposta, quem }.
   */
  async le(nome, pergunta, { comCalma = false } = {}) {
    const arquivo = join(this.pasta, nome);
    const instrucao = `Este é um print da tela do notebook do Rafael (Windows). Responda em português do Brasil, \
direto e curto (até 5 frases): ${pergunta || 'o que está na tela?'}. Se for um erro, diga o que significa e o que fazer. \
Se tiver senha, dado de cartão ou documento visível, não repita esses dados.`;
    const chave = (process.env.GROQ_API_KEY || '').trim();
    if (!comCalma && chave) {
      const modelo = await this.modeloDoGroq(chave);
      if (modelo) {
        try {
          const b64 = (await readFile(arquivo)).toString('base64');
          const r = await pedeJson(`${GROQ}/chat/completions`, {
            method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${chave}` },
            body: JSON.stringify({ model: modelo, temperature: 0.2, max_tokens: 900, messages: [{ role: 'user', content: [
              { type: 'text', text: instrucao }, { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } }] }] }),
          }, 60);
          const resposta = texto(r?.choices?.[0]?.message?.content, 2000);
          // "Não consigo ver", "não está legível": aí o Claude olha.
          if (resposta && !/n[ãa]o (consigo|d[áa] para) (ver|ler|identificar)|ileg[íi]vel|n[ãa]o est[áa] claro/i.test(resposta)) return { resposta, quem: 'Groq' };
        } catch { /* vai para o Claude */ }
      }
    }
    const pergunta2 = `Abra a imagem ${nome} (nesta pasta) com a ferramenta Read. ${instrucao}`;
    const pede = async (modelo) => {
      const r = await rodaClaude(['-p', '--output-format', 'json', ...(modelo ? ['--model', modelo] : []), '--allowedTools', 'Read', '--max-turns', '4'],
        { ms: 120_000, cwd: this.pasta, entrada: pergunta2 });
      try { return JSON.parse(String(r.saida).trim().split('\n').filter(Boolean).pop() || ''); } catch { return { is_error: true, result: `${r.erro}` }; }
    };
    // O Sonnet é o mais rápido para isso; se a sua conta não tiver esse modelo, vai o padrão do seu Claude Code.
    let lido = await pede('claude-sonnet-5-5');
    if (lido?.is_error && /model|modelo|not.?found|invalid/i.test(String(lido.result))) lido = await pede('');
    if (!lido?.result || lido.is_error) throw new Error('nem o Groq nem o Claude conseguiram ler o print agora');
    return { resposta: texto(lido.result, 2000), quem: 'Claude' };
  }
}

/**
 * Escreve `t` no programa da frente (ou ativa `programa` pelo nome da
 * janela antes). Vai pela área de transferência e devolve o que estava
 * nela. Nunca termina com Enter: num terminal, um Enter executaria o texto.
 */
export async function cola(t, { programa = '', recusaTerminal = true } = {}) {
  if (!WINDOWS) return 'Escrever em outro programa só funciona no Windows.';
  const limpo = String(t || '').replace(/[\r\n]+$/g, '');
  if (!limpo) return 'Não havia nada para escrever.';
  const r = await powershell(`
Add-Type -AssemblyName System.Windows.Forms
Add-Type @"
using System; using System.Runtime.InteropServices;
public static class Frente { [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr h, out uint p);
  [DllImport("user32.dll")] public static extern short GetAsyncKeyState(int vk); }
"@
$texto = ${aspas(limpo)}
$w = New-Object -ComObject WScript.Shell
${programa ? `if (-not $w.AppActivate(${aspas(programa)})) { Write-Output 'SEM_JANELA'; exit 0 }\nStart-Sleep -Milliseconds 400` : ''}
$pid0 = 0; [void][Frente]::GetWindowThreadProcessId([Frente]::GetForegroundWindow(), [ref]$pid0)
$proc = (Get-Process -Id $pid0 -ErrorAction SilentlyContinue).ProcessName
${recusaTerminal ? "if ($proc -match '^(WindowsTerminal|powershell|pwsh|cmd|conhost|OpenConsole|wsl|bash|mintty)$') { Write-Output \"TERMINAL:$proc\"; exit 0 }" : ''}
$antes = $null; try { $antes = Get-Clipboard -Raw -ErrorAction Stop } catch {}
Set-Clipboard -Value $texto
# Ctrl, Alt ou Shift ainda apertados (do atalho do ditado) virariam outro comando: espera soltar (até 3 s).
$fim = (Get-Date).AddSeconds(3)
while ((Get-Date) -lt $fim -and ((([Frente]::GetAsyncKeyState(0x11) -band 0x8000) -ne 0) -or (([Frente]::GetAsyncKeyState(0x12) -band 0x8000) -ne 0) -or (([Frente]::GetAsyncKeyState(0x10) -band 0x8000) -ne 0))) { Start-Sleep -Milliseconds 50 }
[System.Windows.Forms.SendKeys]::SendWait('^v')
# O programa lê a área de transferência no tempo dele: devolver o conteúdo antigo cedo demais colaria o antigo.
Start-Sleep -Milliseconds 700
if ($antes -ne $null) { Set-Clipboard -Value $antes }
Write-Output "OK:$proc"`, { ms: 20_000 });
  const s = r.saida.trim();
  if (s.startsWith('SEM_JANELA')) return `Não achei uma janela aberta com o nome "${programa}".`;
  if (s.startsWith('TERMINAL:')) return 'A janela da frente é um terminal; lá eu não escrevo sem você confirmar.';
  if (!s.startsWith('OK:')) return `Não consegui escrever (${texto(r.erro, 120)}).`;
  return `Escrevi ${limpo.length} caracteres em ${s.slice(3) || 'o programa da frente'}.`;
}

/** A voz do Windows (pt-BR, se houver), sem esperar terminar. */
export async function tocaNoNotebook(arquivo) {
  // Primeiro o tocador do Windows Media (sem janela); sem ele, o do WPF. Os dois esperam o MP3 acabar.
  const r = await powershell(`
$arquivo = ${aspas(arquivo)}
try {
  $w = New-Object -ComObject WMPlayer.OCX
  $w.settings.volume = 100
  $w.URL = $arquivo
  $w.controls.play()
  $t = 0; while ($w.playState -ne 3 -and $t -lt 100) { Start-Sleep -Milliseconds 50; $t++ }
  if ($w.playState -ne 3) { throw 'não começou' }
  while ($w.playState -in 3, 6, 9) { Start-Sleep -Milliseconds 100 }
  $w.close()
  exit 0
} catch {}
Add-Type -AssemblyName PresentationCore, System.Windows.Forms
$p = New-Object System.Windows.Media.MediaPlayer
$p.Open([Uri]::new($arquivo))
$i = 0; while (-not $p.NaturalDuration.HasTimeSpan -and $i -lt 100) { [System.Windows.Forms.Application]::DoEvents(); Start-Sleep -Milliseconds 50; $i++ }
if (-not $p.NaturalDuration.HasTimeSpan) { exit 3 }
$p.Volume = 1
$p.Play()
$fim = (Get-Date).AddMilliseconds($p.NaturalDuration.TimeSpan.TotalMilliseconds + 250)
while ((Get-Date) -lt $fim) { [System.Windows.Forms.Application]::DoEvents(); Start-Sleep -Milliseconds 50 }
$p.Close()`, { ms: 180_000 });
  return r.codigo === 0;
}

/** A resposta falada no notebook: na voz escolhida (`mp3`, se veio) ou, sem ela, na voz do Windows. */
export async function falaNoNotebook(t, { audio = null, extensao = 'mp3', pasta = null } = {}) {
  if (WINDOWS && audio && pasta) {
    const arquivo = join(pasta, `fala-${Date.now()}.${extensao}`);
    try {
      await writeFile(arquivo, audio);
      const tocou = await tocaNoNotebook(arquivo);
      unlink(arquivo).catch(() => {});
      if (tocou) return;
    } catch { /* cai na voz do Windows */ }
  }
  return falaComOWindows(t);
}

function falaComOWindows(t) {
  const frase = String(t || '').replace(/https?:\/\/\S+/g, 'o link').slice(0, 1200);
  if (!WINDOWS || !frase) return;
  powershell(`
Add-Type -AssemblyName System.Speech
$s = New-Object System.Speech.Synthesis.SpeechSynthesizer
$v = $s.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'pt-BR' } | Select-Object -First 1
if ($v) { $s.SelectVoice($v.VoiceInfo.Name) }
$s.Rate = 1
$s.Speak(${aspas(frase)})`, { ms: 120_000 });
}
