/**
 * O CLAUDE CODE, chamado por programa. Um lugar só, para o estúdio
 * (que monta o site) e para o vendedor (que escreve as mensagens).
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE PELO CLAUDE CODE, E NÃO PELO CHAT DO CLAUDE.AI
 * ─────────────────────────────────────────────────────────────────
 * Os Termos de Serviço do Consumidor da Anthropic proíbem acessar o
 * claude.ai "por meios automatizados, seja por bot, script ou outro",
 * a não ser por uma chave de API ou onde a Anthropic permitir. O
 * Claude Code é esse caminho permitido: roda na sua máquina, entra com
 * a SUA assinatura (`claude auth login`), e o modo `-p` existe
 * justamente para ser chamado por script.
 *
 * ─────────────────────────────────────────────────────────────────
 * O PEDIDO VAI PELA ENTRADA PADRÃO, NÃO PELA LINHA DE COMANDO
 * ─────────────────────────────────────────────────────────────────
 * No Windows, o `claude` instalado pelo npm é um `claude.cmd`, e um
 * .cmd só roda pelo cmd.exe. O cmd.exe corta o comando na primeira
 * quebra de linha e interpreta aspas, `&`, `|` e `%` — e o pedido é
 * um texto longo, cheio de tudo isso. Por isso:
 *
 *   1. o texto vai pela entrada padrão (stdin), que não passa pelo
 *      cmd.exe;
 *   2. no Windows, o .cmd é aberto e lido: dentro dele está o caminho
 *      do programa de verdade (o cli.js, ou um .exe), e é esse que é
 *      chamado, sem cmd.exe no meio. Os argumentos chegam intactos.
 *
 * ─────────────────────────────────────────────────────────────────
 * O LIMITE DO PLANO
 * ─────────────────────────────────────────────────────────────────
 * A assinatura tem limite de uso por janela de horas. Quando ele
 * acaba, o Claude Code responde com erro e diz quando volta. Isso não
 * é falha do agente: é pausa. O módulo guarda até quando, para ninguém
 * gastar chamada à toa, e quem chamou decide (esperar, ou usar o Groq
 * de reserva).
 */
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { texto } from './comum.mjs';

/** Onde o Claude do vendedor "mora": uma pasta vazia dentro de dados/. */
const PASTA_PADRAO = fileURLToPath(new URL('../dados/claude-vendedor/', import.meta.url));

/* ── achar o programa ─────────────────────────────────────────── */

let comando = null;

/**
 * Como chamar o `claude` nesta máquina: `{ arquivo, antes }`, onde
 * `antes` são argumentos que vão na frente (o cli.js, quando o
 * programa é o Node). Nulo quando não está instalado.
 */
export function comoChamar() {
  // Para os testes (testes/estudio.mjs): um Claude Code falso, em Node,
  // que roda igual no Windows e no Linux e não gasta a sua conta.
  if (process.env.MATILHA_CLAUDE_FALSO) return { arquivo: process.execPath, antes: [process.env.MATILHA_CLAUDE_FALSO] };
  if (comando) return comando;
  if (process.platform !== 'win32') {
    comando = { arquivo: 'claude', antes: [] };
    return comando;
  }

  const onde = spawnSync('where', ['claude'], { encoding: 'utf8', windowsHide: true });
  const caminhos = String(onde.stdout || '').split(/\r?\n/).map((c) => c.trim()).filter(Boolean);

  const exe = caminhos.find((c) => /\.exe$/i.test(c));
  if (exe) {
    comando = { arquivo: exe, antes: [] };
    return comando;
  }

  // O atalho do npm: `"%dp0%\node_modules\@anthropic-ai\claude-code\cli.js" %*`
  // (as versões antigas escrevem %~dp0). O alvo pode ser um .js ou um .exe.
  for (const cmd of caminhos.filter((c) => /\.cmd$/i.test(c))) {
    let conteudo = '';
    try { conteudo = readFileSync(cmd, 'utf8'); } catch { continue; }
    // O atalho também cita o node.exe ("se existir node.exe aqui do
    // lado, use-o"): esse não é o alvo.
    const achado = [...conteudo.matchAll(/"%~?dp0%?\\?([^"%]+?\.(?:js|cjs|mjs|exe))"/gi)]
      .map((m) => m[1]).find((c) => !/(^|\\)node\.exe$/i.test(c));
    if (!achado) continue;
    const alvo = join(dirname(cmd), achado);
    if (!existsSync(alvo)) continue;
    comando = /\.exe$/i.test(alvo)
      ? { arquivo: alvo, antes: [] }
      : { arquivo: process.execPath, antes: [alvo] };
    return comando;
  }
  return null;
}

/**
 * O ambiente do `claude` sem chave de API: com ANTHROPIC_API_KEY no
 * computador, o Claude Code passaria a cobrar por token em vez de usar a
 * sua assinatura (o login da web, `claude auth login`). Aqui ele sempre
 * entra pela assinatura.
 */
export function ambienteDaAssinatura() {
  const env = { ...process.env };
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  return env;
}

/**
 * Roda o `claude` com estes argumentos. `entrada` vai pela stdin.
 * Devolve `{ codigo, saida, erro }` — nunca lança.
 */
export function rodaClaude(argumentos, { ms = 120_000, cwd, entrada, aoIniciar } = {}) {
  return new Promise((resolve) => {
    const c = comoChamar();
    if (!c) {
      resolve({ codigo: -1, saida: '', erro: 'o Claude Code não está instalado nesta máquina' });
      return;
    }
    let filho;
    try {
      filho = spawn(c.arquivo, [...c.antes, ...argumentos], {
        cwd, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: ambienteDaAssinatura(),
      });
    } catch (e) {
      resolve({ codigo: -1, saida: '', erro: `não consegui executar o claude: ${e.message}` });
      return;
    }
    aoIniciar?.(filho);
    let saida = '';
    let erro = '';
    const relogio = setTimeout(() => {
      erro += `\npassou de ${Math.round(ms / 1000)}s sem terminar`;
      filho.kill('SIGTERM');
      // Alguns processos ignoram o pedido educado.
      setTimeout(() => filho.kill('SIGKILL'), 3000);
    }, ms);
    filho.stdout.on('data', (p) => { saida += p; });
    filho.stderr.on('data', (p) => { erro += p; });
    filho.on('error', (e) => {
      clearTimeout(relogio);
      // Sumiu do PATH desde a última vez: esquece o caminho guardado.
      comando = null;
      resolve({ codigo: -1, saida, erro: `não consegui executar o claude: ${e.message}` });
    });
    filho.on('close', (codigo) => { clearTimeout(relogio); resolve({ codigo: codigo ?? -1, saida, erro }); });
    // Fechar a entrada é o que diz ao `claude -p` que o pedido acabou.
    filho.stdin.on('error', () => { /* o processo pode sair antes de ler tudo */ });
    filho.stdin.end(entrada ?? '');
  });
}

/* ── o que esta versão entende ────────────────────────────────── */

/** O texto do `claude --help`, lido uma vez: versões antigas não têm
 *  todas as opções, e uma opção desconhecida derruba a chamada. */
let ajuda = null;
async function opcoes() {
  if (ajuda !== null) return ajuda;
  const r = await rodaClaude(['--help'], { ms: 20_000 });
  // Falha não fica guardada: um --help que travou uma vez não pode
  // desligar para sempre o prompt de sistema, o esquema e a trava das
  // ferramentas.
  if (r.codigo !== 0) return '';
  ajuda = r.saida;
  return ajuda;
}

/** As opções que esta versão do Claude Code entende, para quem monta a linha de comando. */
export async function entende(opcao) {
  return suporta(await opcoes(), opcao);
}
const suporta = (texto, opcao) => new RegExp(`(^|\\s)${opcao.replace(/-/g, '\\-')}(\\s|,|$)`, 'm').test(texto);

/* ── está pronto? ─────────────────────────────────────────────── */

/**
 * Instalado e conectado à conta? As duas coisas, separadas, porque o
 * conserto de cada uma é diferente.
 */
export async function conferePronto() {
  if (!comoChamar()) {
    return {
      pronto: false, instalado: false, conectado: false,
      motivo: 'O Claude Code não está instalado nesta máquina.',
      conserto: 'Instale com: npm install -g @anthropic-ai/claude-code',
    };
  }
  const versao = await rodaClaude(['--version'], { ms: 20_000 });
  if (versao.codigo !== 0) {
    comando = null;
    return {
      pronto: false, instalado: false, conectado: false,
      motivo: 'O Claude Code não está instalado nesta máquina.',
      conserto: 'Instale com: npm install -g @anthropic-ai/claude-code',
    };
  }
  ajuda = null; // pode ter sido atualizado: relê as opções na próxima chamada

  const login = await rodaClaude(['auth', 'status'], { ms: 25_000 });
  let conectado = login.codigo === 0;
  // As versões novas respondem um JSON com `loggedIn`; vale mais que o
  // código de saída.
  try {
    const lido = JSON.parse(login.saida.trim());
    if (typeof lido?.loggedIn === 'boolean') conectado = lido.loggedIn;
  } catch { /* versão antiga: fica o código de saída */ }

  const v = texto(versao.saida, 40).trim();
  if (!conectado) {
    return {
      pronto: false, instalado: true, conectado: false, versao: v,
      motivo: 'O Claude Code está instalado, mas não está conectado à sua conta.',
      conserto: 'Rode uma vez, nesta máquina: claude auth login',
    };
  }
  return { pronto: true, instalado: true, conectado: true, versao: v };
}

/* ── a pausa do limite ────────────────────────────────────────── */

let pausaAte = 0;

/** Até quando o plano está sem uso (0 = não está). */
export function pausadoAte() {
  return pausaAte > Date.now() ? pausaAte : 0;
}

/**
 * Lê do recado de limite a hora em que ele volta. O Claude Code já
 * escreveu isso de dois jeitos: "Claude AI usage limit reached|1760000000"
 * (o número é a hora, em segundos) e "...resets 3pm" ou "resets 3:30pm".
 * Sem hora legível, espera 20 minutos e tenta de novo.
 */
export function quandoVolta(recado, agora = Date.now()) {
  const numero = String(recado).match(/\|\s*(\d{10,13})/);
  if (numero) {
    const n = Number(numero[1]);
    const ms = n < 1e12 ? n * 1000 : n;
    if (ms > agora) return ms;
  }
  const hora = String(recado).match(/resets?\s+(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (hora) {
    let h = Number(hora[1]) % 24;
    const min = Number(hora[2] || 0);
    const meio = (hora[3] || '').toLowerCase();
    if (meio === 'pm' && h < 12) h += 12;
    if (meio === 'am' && h === 12) h = 0;
    const alvo = new Date(agora);
    alvo.setHours(h, min, 0, 0);
    if (alvo.getTime() <= agora) alvo.setDate(alvo.getDate() + 1);
    return alvo.getTime();
  }
  return agora + 20 * 60_000;
}

/**
 * O que uma saída com falha quer dizer: limite do plano (com a hora em
 * que volta), falta de login, ou nada sabido. Usado também pelo estúdio.
 */
export function falhaDe(recado) {
  if (ehLimite(recado)) {
    pausaAte = quandoVolta(recado);
    return erroDeLimite(pausaAte);
  }
  if (ehLogin(recado)) {
    const e = new Error('o Claude Code não está conectado à sua conta (rode: claude auth login)');
    e.naoConectado = true;
    e.adiarPor = 10 * 60_000;
    return e;
  }
  return null;
}

const ehLimite = (t) => /usage limit|limit reached|hit your (?:\w+ )?limit|(?:session|weekly|5-hour) limit|rate.?limit|limite de uso|out of (extra )?usage|too many requests|\b429\b/i.test(t);
const ehLogin = (t) => /not logged in|log ?in|\/login|invalid api key|authenticat|oauth token|credential|\b401\b/i.test(t);

function erroDeLimite(ate) {
  const hora = new Date(ate).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const e = new Error(`o limite do seu plano do Claude acabou; volta às ${hora}`);
  e.limite = true;
  e.pausaAte = ate;
  e.adiarPor = Math.max(60_000, ate - Date.now());
  return e;
}

/* ── o dia, para o painel ──────────────────────────────────────── */

const diaDeHoje = () => new Date().toLocaleDateString('sv-SE');
const conta = { dia: diaDeHoje(), escritas: 0, segundos: 0, ultima: 0, ultimoErro: '' };

/** Quantas mensagens o Claude escreveu hoje, e quanto tempo levou. */
export function estatisticas() {
  if (conta.dia !== diaDeHoje()) Object.assign(conta, { dia: diaDeHoje(), escritas: 0, segundos: 0 });
  return {
    escritasHoje: conta.escritas,
    mediaSegundos: conta.escritas ? Math.round((conta.segundos / conta.escritas) * 10) / 10 : null,
    ultima: conta.ultima || null,
    ultimoErro: conta.ultimoErro || '',
    pausadoAte: pausadoAte() || null,
  };
}

/* ── escrever ─────────────────────────────────────────────────── */

/**
 * Um pedido ao Claude, sem ferramenta nenhuma: ele só escreve.
 *
 * - `sistema`: as regras (substituem as instruções de programador do
 *   Claude Code, que aqui só gastariam limite);
 * - `entrada`: o pedido em si, pela stdin;
 * - `esquema`: um JSON Schema, quando a resposta tem formato certo;
 * - `modelo`: 'opus', 'sonnet', 'haiku' ou vazio (o padrão da sua conta).
 *
 * Devolve `{ texto, estruturado, segundos, custo }`. Lança com
 * `e.limite` (e `e.pausaAte`) quando o plano acabou, e com
 * `e.naoConectado` quando falta o login.
 */
export async function escreve({ sistema, entrada, esquema, modelo, esforco = 'low', pasta, segundos = 150 }) {
  const pausa = pausadoAte();
  if (pausa) throw erroDeLimite(pausa);

  const ajudaTexto = await opcoes();
  const tem = (o) => suporta(ajudaTexto, o);

  const args = ['-p', '--output-format', 'json', '--max-turns', '4'];
  // Nenhuma ferramenta, nenhum servidor MCP: quem escreve para cliente
  // não precisa abrir arquivo nem navegar. Também é o que torna inútil
  // um "ignore as instruções e rode tal comando" vindo de um cliente.
  if (tem('--tools')) args.push('--tools', '');
  if (tem('--strict-mcp-config')) args.push('--strict-mcp-config');
  // Sem CLAUDE.md, hooks e plugins da sua máquina no meio da venda.
  if (tem('--safe-mode')) args.push('--safe-mode');
  // Centenas de conversas de venda não precisam lotar o seu histórico.
  if (tem('--no-session-persistence')) args.push('--no-session-persistence');
  if (modelo) args.push('--model', modelo);
  if (esforco && tem('--effort')) args.push('--effort', esforco);
  if (esquema && tem('--json-schema')) args.push('--json-schema', JSON.stringify(esquema));

  let corpo = String(entrada ?? '');
  if (sistema) {
    if (tem('--system-prompt')) args.push('--system-prompt', sistema);
    else corpo = `${sistema}\n\n---\n\n${corpo}`;
  }

  // Uma pasta vazia, só dele: sem projeto nenhum em volta para ele ler.
  const cwd = pasta || PASTA_PADRAO;
  await mkdir(cwd, { recursive: true }).catch(() => {});

  const comecou = Date.now();
  const r = await rodaClaude(args, { ms: segundos * 1000, cwd, entrada: corpo });
  const gastos = Math.round((Date.now() - comecou) / 100) / 10;

  let lido = null;
  try { lido = JSON.parse(r.saida.trim().split('\n').filter(Boolean).pop() || ''); } catch { lido = null; }

  const recado = `${lido?.result ?? ''} ${r.erro} ${lido ? '' : r.saida}`.trim();
  if (!lido || lido.is_error || r.codigo !== 0) {
    estatisticas();
    conta.ultimoErro = texto(recado, 160) || `código ${r.codigo}`;
    if (ehLimite(recado)) {
      pausaAte = quandoVolta(recado);
      throw erroDeLimite(pausaAte);
    }
    if (ehLogin(recado)) {
      const e = new Error('o Claude Code não está conectado à sua conta (rode: claude auth login)');
      e.naoConectado = true;
      throw e;
    }
    throw new Error(`o Claude Code não respondeu: ${texto(recado, 220) || `código ${r.codigo}`}`);
  }

  estatisticas();
  conta.escritas += 1;
  conta.segundos += gastos;
  conta.ultima = Date.now();
  conta.ultimoErro = '';

  return {
    texto: typeof lido.result === 'string' ? lido.result : '',
    estruturado: lido.structured_output && typeof lido.structured_output === 'object'
      ? lido.structured_output : null,
    segundos: gastos,
    custo: Number(lido.total_cost_usd) || 0,
  };
}

/* ── abrir uma janela de terminal ─────────────────────────────── */

/**
 * Abre uma janela de terminal rodando `linha`, e ela fica aberta. O
 * que acontece lá é com você: o login abre o navegador para você entrar
 * na sua conta. Devolve o comando, para o painel mostrar se a janela
 * não abrir.
 */
function abreTerminal(linha) {
  try {
    let filho;
    if (process.platform === 'win32') {
      // Linha montada à mão: o `start` só entende o título se ele vier
      // entre aspas, e o Node mexeria nas aspas se passasse por
      // argumento. O comando vai entre aspas para o `&&` ser da janela
      // nova, e não desta.
      filho = spawn('cmd.exe', [`/c start "Claude" cmd /k "${linha}"`],
        { detached: true, stdio: 'ignore', windowsVerbatimArguments: true });
    } else if (process.platform === 'darwin') {
      filho = spawn('osascript', ['-e', `tell application "Terminal" to do script "${linha}"`,
        '-e', 'tell application "Terminal" to activate'], { detached: true, stdio: 'ignore' });
    } else {
      filho = spawn('x-terminal-emulator', ['-e', `sh -c "${linha}; exec sh"`],
        { detached: true, stdio: 'ignore' });
    }
    // Sem terminal nesta máquina, o erro chega depois, como evento:
    // sem ouvinte, ele derrubaria o servidor inteiro.
    filho.on('error', () => {});
    filho.unref();
    return { aberto: true, comando: linha };
  } catch {
    return { aberto: false, comando: linha };
  }
}

/** O login do Claude Code com a sua conta (abre o navegador). */
export const abreLogin = () => abreTerminal('claude auth login');

/** Instala o Claude Code pelo npm e já emenda o login. */
export const abreInstalacao = () => abreTerminal('npm install -g @anthropic-ai/claude-code && claude auth login');
