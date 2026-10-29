/**
 * O CÉREBRO DO JARVIS NO CLAUDE — pela sua assinatura, no Claude Code.
 *
 * O Groq é rápido, mas o plano grátis aceita 8 mil tokens por minuto: o
 * Jarvis tinha que esquecer a conversa, ver só parte das ferramentas e
 * pesquisar por um buscador improvisado. Aqui quem pensa é o Claude,
 * com a conversa inteira, todas as ferramentas e a pesquisa na web de
 * verdade (WebSearch e WebFetch do próprio Claude Code).
 *
 * UM PROCESSO SÓ, SEMPRE ABERTO. O `claude -p` com entrada e saída em
 * JSON (stream-json) fica rodando e recebe uma fala por vez: não paga a
 * partida a cada pergunta, e lembra a conversa. A sessão é guardada; se a
 * Matilha fechar, ela é retomada (--resume) na próxima vez.
 *
 * AS FERRAMENTAS SÃO AS MESMAS. O Claude Code chama o agentes/jarvis-mcp.mjs
 * (um servidor MCP), que repassa cada chamada para a Matilha, e a Matilha
 * executa exatamente como fazia com o Groq: mesmas confirmações, mesma
 * conferência dos números do gráfico. Ferramenta do Claude Code que mexe
 * no computador (terminal, editar arquivo) não é ligada: só a pesquisa.
 *
 * Se o Claude não estiver instalado, conectado, ou o limite do plano
 * acabar, o Jarvis volta a pensar com o Groq, sozinho.
 */
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ambienteDaAssinatura, comoChamar, entende, falhaDe, pausadoAte } from './claude-cli.mjs';
import { texto } from './comum.mjs';

const SERVIDOR_MCP = fileURLToPath(new URL('./jarvis-mcp.mjs', import.meta.url));
export const MODELO_DO_JARVIS = 'claude-sonnet-5-5';
/** Os modos que você escolhe em "Voz e cérebro": o modelo e quanto ele pensa antes de responder. */
export const MODELOS_DO_JARVIS = {
  haiku: { id: 'claude-haiku-5-5', nome: 'Haiku 5.5', descricao: 'O mais rápido. Bom para comandos e perguntas simples.' },
  sonnet: { id: 'claude-sonnet-5-5', nome: 'Sonnet 5.5', descricao: 'O equilíbrio: esperto e ainda rápido. O padrão.' },
  opus: { id: 'claude-opus-5-5', nome: 'Opus 5.5', descricao: 'O mais inteligente. Mais lento, e gasta mais do limite da assinatura.' },
};
export const ESFORCOS = {
  low: { nome: 'Baixo', descricao: 'Responde logo.' },
  medium: { nome: 'Médio', descricao: 'Pensa um pouco antes.' },
  high: { nome: 'Alto', descricao: 'Pensa bastante: mais lento, para pedidos difíceis.' },
};
// Leitura da web que o Claude faz por conta própria: entra como fonte dos números do gráfico.
const LEITURAS = new Set(['WebSearch', 'WebFetch']);

/** O texto falado: sem a lista "Sources:" que o WebSearch pede, sem markdown. */
export function limpaParaFalar(t) {
  let s = String(t || '');
  const fontes = [...s.matchAll(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g)].map((m) => ({ nome: m[1], url: m[2] }));
  s = s.split(/\n\s*\**\s*(?:Sources|Fontes|Referências)\s*:?\**\s*\n/i)[0];
  s = s.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '$1')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '').replace(/\*\*|__|`/g, '').replace(/^\s*[-*•]\s+/gm, '')
    .replace(/\n{2,}/g, '\n').trim();
  return { texto: s, fontes: fontes.slice(0, 6) };
}

export class CerebroClaude {
  /**
   * `pasta`: onde ele "mora" (vazia, só dele). `ferramentas`: { url, ficha }
   * para o servidor MCP achar a Matilha. `sistema`: as regras do Jarvis.
   */
  constructor({ pasta, ferramentas, sistema, modelo = MODELO_DO_JARVIS, esforco = 'low', sessao = null, regrasDaSessao = null,
    aoGuardarSessao = () => {}, aoGuardarRegras = () => {}, diz = () => {} }) {
    Object.assign(this, { pasta, ferramentas, sistema, modelo, esforco, sessao, regrasDaSessao, aoGuardarSessao, aoGuardarRegras, diz });
    this.processo = null;
    this.vez = null; // a fala em andamento: { resolve, reject, relogio, aoLer, nomes }
    this.falhas = 0;
    this.desligadoAte = 0;
  }

  /** Dá para pensar com o Claude agora? (instalado, sem pausa do plano, sem falhar seguido) */
  disponivel() {
    return Boolean(comoChamar()) && !pausadoAte() && Date.now() > this.desligadoAte;
  }

  /**
   * Abre o processo. Um de cada vez: duas chamadas juntas (o "aquecer" e a
   * primeira fala) esperam a mesma abertura. Se o modo mudou enquanto abria,
   * não abre o velho.
   */
  _liga() {
    if (this.processo) return Promise.resolve();
    if (!this.ligando) {
      const geracao = this.geracao || 0;
      this.ligando = this._abre(geracao).finally(() => { this.ligando = null; });
    }
    return this.ligando;
  }

  async _abre(geracao) {
    await mkdir(this.pasta, { recursive: true });
    const config = join(this.pasta, 'mcp.json');
    await writeFile(config, JSON.stringify({ mcpServers: { jarvis: {
      command: process.execPath, args: [SERVIDOR_MCP],
      env: { JARVIS_URL: this.ferramentas.url, JARVIS_FICHA: this.ferramentas.ficha, ...(process.env.PAINEL_SENHA ? { PAINEL_SENHA: process.env.PAINEL_SENHA } : {}) },
    } } }), 'utf8');
    const args = ['-p', '--input-format', 'stream-json', '--output-format', 'stream-json', '--verbose',
      '--mcp-config', config, '--strict-mcp-config',
      '--allowedTools', 'mcp__jarvis', 'WebSearch', 'WebFetch'];
    // Só a pesquisa entre as ferramentas do Claude Code: nada de terminal ou de editar arquivo por fora do Jarvis.
    if (await entende('--tools')) args.push('--tools', 'WebSearch,WebFetch');
    if (await entende('--system-prompt-file')) {
      const arquivo = join(this.pasta, 'jarvis-sistema.md');
      await writeFile(arquivo, this.sistema, 'utf8');
      args.push('--system-prompt-file', arquivo);
    } else {
      args.push('--system-prompt', this.sistema);
    }
    if (this.modelo) args.push('--model', this.modelo);
    // Modelo ocupado demais: responde com o Sonnet em vez de cair no Groq.
    if (this.modelo && this.modelo !== MODELO_DO_JARVIS && await entende('--fallback-model')) args.push('--fallback-model', MODELO_DO_JARVIS);
    if (this.esforco && await entende('--effort')) args.push('--effort', this.esforco);
    // Sem isto, ao retomar a conversa o Claude Code reusaria as regras antigas, as da primeira vez (e uma
    // Matilha atualizada ficaria com o Jarvis velho). Versão que não entende a opção: conversa nova quando as regras mudam.
    const assinatura = createHash('sha256').update(this.sistema).digest('hex').slice(0, 16);
    if (await entende('--system-prompt-snapshot')) args.push('--system-prompt-snapshot', 'off');
    else if (this.sessao && this.regrasDaSessao && this.regrasDaSessao !== assinatura) { this.sessao = null; this.aoGuardarSessao(null); }
    this.regrasDaSessao = assinatura;
    this.aoGuardarRegras?.(assinatura);
    if (this.sessao) args.push('--resume', this.sessao);

    const c = comoChamar();
    if (!c) throw new Error('o Claude Code não está instalado');
    if (geracao !== (this.geracao || 0)) return;
    const filho = spawn(c.arquivo, [...c.antes, ...args], { cwd: this.pasta, windowsHide: true, stdio: ['pipe', 'pipe', 'pipe'], env: ambienteDaAssinatura() });
    this.processo = filho;
    this.comecou = Date.now();
    // A Matilha fechou: o Claude dela fecha junto.
    if (!this.saida) { this.saida = () => this.processo?.kill(); process.once('exit', this.saida); }
    let resto = '';
    let erro = '';
    filho.stdout.on('data', (p) => {
      resto += p;
      const linhas = resto.split('\n');
      resto = linhas.pop();
      for (const l of linhas) this._evento(l.trim());
    });
    filho.stderr.on('data', (p) => { erro = (erro + p).slice(-2000); });
    filho.stdin.on('error', () => {});
    filho.on('error', (e) => { erro += e.message; });
    filho.on('close', (codigo) => {
      if (this.processo === filho) this.processo = null;
      const recado = `${erro} ${this.ultimoErro || ''}`.trim();
      // Uma sessão guardada que não abre mais (apagada, de outra versão): começa outra.
      if (this.sessao && Date.now() - this.comecou < 15_000) {
        this.sessao = null;
        this.aoGuardarSessao(null);
        const vez = this.vez;
        if (vez && !vez.repetiu) {
          vez.repetiu = true;
          this._liga().then(() => this.processo.stdin.write(vez.linha)).catch((e) => this._termina(null, e));
          return;
        }
      }
      if (this.vez) this._termina(null, falhaDe(recado) || new Error(`o Claude Code fechou (${texto(recado, 160) || `código ${codigo}`})`));
    });
  }

  _evento(linha) {
    if (!linha.startsWith('{')) return;
    let e;
    try { e = JSON.parse(linha); } catch { return; }
    const vez = this.vez;
    if (e.session_id && e.type === 'system' && e.subtype === 'init' && e.session_id !== this.sessao) {
      this.sessao = e.session_id;
      this.aoGuardarSessao(e.session_id);
    }
    if (!vez) return;
    if (e.type === 'assistant') {
      for (const b of e.message?.content || []) if (b.type === 'tool_use') vez.nomes.set(b.id, b.name);
    } else if (e.type === 'user') {
      // O que a pesquisa do próprio Claude Code leu vira fonte para os números do gráfico.
      for (const b of Array.isArray(e.message?.content) ? e.message.content : []) {
        if (b.type !== 'tool_result' || !LEITURAS.has(vez.nomes.get(b.tool_use_id))) continue;
        const lido = typeof b.content === 'string' ? b.content : (b.content || []).map((x) => x.text || '').join('\n');
        if (lido) vez.aoLer(lido);
      }
    } else if (e.type === 'result') {
      const resposta = typeof e.result === 'string' ? e.result : '';
      if (e.is_error || e.subtype !== 'success') {
        this.ultimoErro = resposta || e.subtype;
        this._termina(null, falhaDe(resposta) || new Error(`o Claude não terminou (${texto(resposta || e.subtype, 160)})`));
      } else {
        this._termina(resposta);
      }
    }
  }

  _termina(resposta, erro) {
    const vez = this.vez;
    if (!vez) return;
    this.vez = null;
    clearTimeout(vez.relogio);
    if (this.reabrir) { this.reabrir = false; this.reinicia(); }
    if (erro) {
      this.falhas += 1;
      // Sem login, ou falhou três vezes seguidas: deixa o Groq pensar por 10 minutos.
      if (erro.naoConectado || this.falhas >= 3) { this.desligadoAte = Date.now() + 10 * 60_000; this.falhas = 0; }
      vez.reject(erro);
    } else {
      this.falhas = 0;
      vez.resolve(resposta);
    }
  }

  /**
   * Uma fala. `aoLer(texto)` recebe o que a pesquisa leu. Devolve o texto
   * da resposta (cru: quem fala limpa com limpaParaFalar).
   */
  async pergunta(mensagem, { aoLer = () => {}, segundos = 180 } = {}) {
    if (this.vez) throw new Error('o Claude ainda está pensando na fala anterior');
    // O modo pode ter mudado no meio da abertura: aí abre de novo, já no modo novo.
    for (let i = 0; i < 3 && !this.processo; i += 1) await this._liga();
    if (!this.processo) throw new Error('não consegui abrir o Claude Code');
    return new Promise((resolve, reject) => {
      const relogio = setTimeout(() => {
        // Travou: derruba o processo (a próxima fala abre outro, na mesma sessão).
        this._termina(null, new Error(`o Claude passou de ${segundos} s sem responder`));
        this.processo?.kill();
      }, segundos * 1000);
      const linha = `${JSON.stringify({ type: 'user', message: { role: 'user', content: mensagem } })}\n`;
      this.vez = { resolve, reject, relogio, aoLer, nomes: new Map(), linha };
      this.processo.stdin.write(linha);
    });
  }

  /** Troca o modelo ou o esforço: o processo reabre na próxima fala, na mesma conversa. */
  muda({ modelo, esforco }) {
    const novoModelo = MODELOS_DO_JARVIS[modelo]?.id || this.modelo;
    const novoEsforco = ESFORCOS[esforco] ? esforco : this.esforco;
    if (novoModelo === this.modelo && novoEsforco === this.esforco) return;
    this.modelo = novoModelo;
    this.esforco = novoEsforco;
    this.falhas = 0;
    this.desligadoAte = 0;
    // No meio de uma fala, espera ela acabar para reabrir.
    if (this.vez) this.reabrir = true; else { this.reinicia(); this.aquece(); }
  }

  /** Começa do zero (o "esquece" do Jarvis, ou regras novas). */
  reinicia({ esquecer = false } = {}) {
    if (esquecer) { this.sessao = null; this.aoGuardarSessao(null); }
    this.geracao = (this.geracao || 0) + 1;
    const p = this.processo;
    this.processo = null;
    p?.kill();
  }

  /** Deixa o processo aberto e pronto antes da primeira fala (a partida leva uns segundos). */
  aquece() {
    if (!this.processo && this.disponivel()) this._liga().catch(() => {});
  }
}
