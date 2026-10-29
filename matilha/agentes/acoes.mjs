/**
 * O ACTION REGISTRY — o que o Jarvis (e o painel) podem FAZER, num lugar só.
 *
 * Cada ação tem nome ("agent.pause"), descrição, parâmetros tipados,
 * validação, permissão, a execução e a verificação do resultado. Quem
 * chama não clica em nada: chama a ação, e a ação mexe no estado de
 * verdade (backend) ou manda a tela fazer e espera a tela confirmar
 * (as ações de interface, pela ponte em agentes/ui-ponte.mjs).
 *
 * UM PLANO é uma lista de ações em ordem ("abre o painel, mostra os
 * agentes com erro e pausa o vendedor"). Cada passo só começa quando o
 * anterior foi confirmado. Se um falha, o plano para ali, e os passos
 * de depois ficam "não executados" — nunca "feito" de mentira.
 *
 * PERMISSÕES:
 *   livre      navegar, consultar, filtrar, fechar janela, pausar o que
 *              volta, arquivar (volta também);
 *   confirmar  o que tem consequência para fora ou difícil de desfazer
 *              (mandar mensagem, publicar, cobrar, soltar a matilha,
 *              encerrar projeto com pendência). O plano para e pergunta;
 *              com o seu sim, continua do mesmo passo.
 *   Apagar de vez, mexer em chaves e em permissões: não existem aqui.
 *
 * TUDO FICA REGISTRADO (dados/jarvis-execucoes.json): o comando, o
 * correlation id, cada passo, o agente acionado, a tarefa criada no
 * mural, o tempo, o resultado e o erro. É o que a Rede de agentes mostra.
 */
import { randomBytes } from 'node:crypto';
import { readFile, rename, writeFile } from 'node:fs/promises';

import { texto } from './comum.mjs';

const TIPOS = {
  string: (v) => typeof v === 'string',
  number: (v) => typeof v === 'number' && Number.isFinite(v),
  integer: (v) => Number.isInteger(v),
  boolean: (v) => typeof v === 'boolean',
  object: (v) => v && typeof v === 'object' && !Array.isArray(v),
  array: (v) => Array.isArray(v),
};

/** Um id para seguir um comando por todos os agentes que ele tocar. */
export const novaCorrelacao = () => `cmd-${Date.now().toString(36)}-${randomBytes(3).toString('hex')}`;

/** Confere os parâmetros contra o esquema da ação. Devolve `{ valores, erros }`. */
export function validaParametros(esquema = {}, recebidos = {}) {
  const valores = {};
  const erros = [];
  const p = recebidos && typeof recebidos === 'object' ? recebidos : {};
  for (const [nome, def] of Object.entries(esquema)) {
    let v = p[nome];
    if (v === undefined || v === null || v === '') {
      if (def.obrigatorio) erros.push(`falta "${nome}"`);
      else if (def.padrao !== undefined) valores[nome] = def.padrao;
      continue;
    }
    // O que vem da fala vem como texto: "3" vira 3 onde se espera número.
    if ((def.tipo === 'number' || def.tipo === 'integer') && typeof v === 'string' && v.trim() && !Number.isNaN(Number(v))) v = Number(v);
    if (def.tipo === 'boolean' && typeof v === 'string') v = /^(true|sim|1)$/i.test(v);
    if (def.tipo && !TIPOS[def.tipo](v)) { erros.push(`"${nome}" devia ser ${def.tipo}`); continue; }
    if (def.enum && !def.enum.includes(v)) { erros.push(`"${nome}" não aceita "${texto(String(v), 40)}" (aceita: ${def.enum.join(', ')})`); continue; }
    valores[nome] = typeof v === 'string' ? texto(v, def.max || 500) : v;
  }
  return { valores, erros };
}

export class RegistroDeAcoes {
  constructor({ arquivo = null, diz = () => {} } = {}) {
    this.acoes = new Map();
    this.arquivo = arquivo;
    this.diz = diz;
    this.execucoes = [];
    this.gravando = Promise.resolve();
    this.carregado = this._carrega();
    this.ouvintes = new Set();
  }

  async _carrega() {
    if (!this.arquivo) return;
    try { const l = JSON.parse(await readFile(this.arquivo, 'utf8')); this.execucoes = Array.isArray(l) ? l : []; } catch { this.execucoes = []; }
    // Execução que estava rodando quando a Matilha caiu: fica marcada, não some.
    for (const e of this.execucoes) {
      if (e.estado === 'executando') {
        e.estado = 'interrompida';
        for (const p of e.passos) if (p.estado === 'executando') { p.estado = 'falhou'; p.erro = 'a Matilha fechou no meio'; }
      }
    }
  }

  _grava() {
    if (!this.arquivo) return Promise.resolve();
    const corpo = JSON.stringify(this.execucoes.slice(-200));
    this.gravando = this.gravando.then(async () => {
      const tmp = `${this.arquivo}.escrevendo`;
      await writeFile(tmp, corpo, 'utf8');
      await rename(tmp, this.arquivo);
    }).catch((e) => this.diz(`  ⚠ não consegui gravar as execuções do Jarvis: ${e.message}`));
    return this.gravando;
  }

  /** Quem quer saber quando uma execução muda (a Rede de agentes, ao vivo). */
  aoMudar(f) { this.ouvintes.add(f); return () => this.ouvintes.delete(f); }
  _avisa(e) { for (const f of this.ouvintes) { try { f(e); } catch { /* quem ouve não derruba quem fala */ } } }

  /**
   * Registra uma ação.
   * @param {object} a
   * @param {string} a.nome           "agent.pause"
   * @param {string} a.descricao      para o modelo e para a lista do Command Center
   * @param {object} a.parametros     { nome: { tipo, obrigatorio, enum, descricao, padrao } }
   * @param {'livre'|'confirmar'|Function} a.permissao  função: (valores, ctx) => null (livre) ou o texto do que precisa do sim
   * @param {string} [a.agente]       o agente que ela aciona (para a Rede)
   * @param {Function} [a.valida]     (valores, ctx) => texto de erro ou null
   * @param {Function} a.executa      (valores, ctx) => { mensagem, dados?, tarefa?, agente?, verificado? } — lança no erro
   */
  registra(a) {
    if (!/^[a-z]+(\.[a-z_]+)+$/.test(a.nome)) throw new Error(`nome de ação inválido: ${a.nome}`);
    this.acoes.set(a.nome, { parametros: {}, permissao: 'livre', ...a });
    return this;
  }

  acha(nome) { return this.acoes.get(nome) || null; }

  /** O catálogo: para o modelo, para o Command Center ("ações disponíveis") e para a documentação. */
  catalogo() {
    return [...this.acoes.values()].map((a) => ({
      nome: a.nome, descricao: a.descricao, agente: a.agente || null,
      permissao: typeof a.permissao === 'function' ? 'depende' : a.permissao,
      parametros: Object.fromEntries(Object.entries(a.parametros).map(([k, d]) => [k, {
        tipo: d.tipo, obrigatorio: Boolean(d.obrigatorio), ...(d.enum ? { enum: d.enum } : {}), ...(d.descricao ? { descricao: d.descricao } : {}),
      }])),
      exemplo: a.exemplo || null,
    }));
  }

  /** Quanto o catálogo cabe numa descrição de ferramenta. */
  catalogoCurto() {
    return [...this.acoes.values()].map((a) => {
      const ps = Object.entries(a.parametros).map(([k, d]) => `${k}${d.obrigatorio ? '' : '?'}${d.enum ? `=${d.enum.join('|')}` : `:${d.tipo}`}`).join(', ');
      return `${a.nome}(${ps}): ${a.descricao}`;
    }).join('\n');
  }

  /** A execução registrada, para a tela e para a Rede. */
  execucao(id) { return this.execucoes.find((e) => e.id === id) || null; }
  ultimas(n = 30) { return this.execucoes.slice(-n).reverse(); }

  /**
   * Executa um plano (uma ou mais ações, em ordem).
   *
   * `ctx`: { origem, comando, ui, correlacao, confirmados: Set de índices já
   * autorizados, continuaDe: execução a continuar, quem: 'jarvis'|'painel' }.
   * Devolve a execução: { id, estado, passos[], pendente? }.
   */
  async executaPlano(passos, ctx = {}) {
    await this.carregado;
    const continuar = ctx.continuaDe ? this.execucao(ctx.continuaDe) : null;
    if (ctx.continuaDe && !continuar) throw new Error('essa execução não existe mais');
    // Na mesma fala, o modelo pode chamar várias ações: todas entram na mesma execução (o mesmo correlation id).
    const anexo = !continuar && ctx.anexaA ? this.execucao(ctx.anexaA) : null;
    const monta = (p, i) => ({ i, acao: p.acao, parametros: p.parametros || {}, descricao: texto(p.descricao || this.acha(p.acao)?.descricao || '', 200),
      agente: this.acha(p.acao)?.agente || null, estado: 'esperando', resultado: '', erro: '', ms: 0 });
    let desde = 0;
    let exec = continuar || anexo;
    if (anexo) {
      desde = anexo.passos.length;
      anexo.passos.push(...passos.map((p, k) => monta(p, desde + k)));
    } else if (!exec) {
      exec = {
        id: ctx.correlacao || novaCorrelacao(),
        comando: texto(ctx.comando || passos.map((p) => p.acao).join(' → '), 500),
        origem: ctx.origem || 'jarvis',
        quem: ctx.quem || 'jarvis',
        inicio: Date.now(),
        estado: 'executando',
        interpretacao: ctx.interpretacao || '',
        passos: passos.map(monta),
      };
      this.execucoes.push(exec);
      if (this.execucoes.length > 400) this.execucoes.splice(0, 100);
    }
    exec.estado = 'executando';
    exec.pendente = null;
    exec.pergunta = null;
    exec.erro = '';
    this._avisa(exec);
    const confirmados = ctx.confirmados || new Set();
    if (continuar) desde = ctx.desde ?? Math.max(0, continuar.passos.findIndex((p) => p.estado === 'precisa_confirmar'));
    exec.ultimoDesde = desde;

    for (let i = Math.max(0, desde); i < exec.passos.length; i += 1) {
      const passo = exec.passos[i];
      const a = this.acha(passo.acao);
      const t0 = Date.now();
      if (!a) { this._falha(exec, i, `ação desconhecida: ${passo.acao}`); break; }
      const { valores, erros } = validaParametros(a.parametros, passo.parametros);
      if (erros.length) { this._falha(exec, i, `parâmetros inválidos: ${erros.join('; ')}`); break; }
      const ctxAcao = { ...ctx, correlacao: exec.id, passo: i, execucao: exec };
      try {
        const invalido = a.valida ? await a.valida(valores, ctxAcao) : null;
        if (invalido) { this._falha(exec, i, invalido); break; }
        const precisa = typeof a.permissao === 'function' ? await a.permissao(valores, ctxAcao)
          : a.permissao === 'confirmar' ? (a.pedeSim ? a.pedeSim(valores) : a.descricao) : null;
        if (precisa && !confirmados.has(i)) {
          passo.estado = 'precisa_confirmar';
          passo.resultado = texto(precisa, 300);
          exec.estado = 'esperando_confirmacao';
          exec.pendente = { passo: i, descricao: texto(precisa, 300) };
          break;
        }
        passo.estado = 'executando';
        this._avisa(exec);
        const r = await a.executa(valores, ctxAcao) || {};
        passo.ms = Date.now() - t0;
        if (r.pergunta) {
          // A ação não tem como decidir sozinha (ex.: "fechar" pode ser a janela ou o projeto): pergunta e para.
          passo.estado = 'precisa_esclarecer';
          passo.resultado = texto(r.pergunta, 400);
          exec.estado = 'esperando_esclarecimento';
          exec.pergunta = r.pergunta;
          break;
        }
        passo.estado = 'feito';
        passo.resultado = texto(r.mensagem || 'feito', 600);
        if (r.dados !== undefined) passo.dados = r.dados;
        if (r.tarefa) passo.tarefa = r.tarefa;
        if (r.agente) passo.agente = r.agente;
        if (r.evidencia) passo.evidencia = r.evidencia;
        if (r.mudou === false) passo.repetida = true;
      } catch (e) {
        passo.ms = Date.now() - t0;
        if (e?.pergunta) {
          passo.estado = 'precisa_esclarecer';
          passo.resultado = texto(e.pergunta, 400);
          exec.estado = 'esperando_esclarecimento';
          exec.pergunta = e.pergunta;
          break;
        }
        this._falha(exec, i, e.message || String(e));
        break;
      }
      this._avisa(exec);
    }
    if (exec.estado === 'executando') exec.estado = 'concluida';
    exec.fim = Date.now();
    exec.ms = exec.fim - exec.inicio;
    await this._grava();
    this._avisa(exec);
    return exec;
  }

  _falha(exec, i, erro) {
    const p = exec.passos[i];
    p.estado = 'falhou';
    p.erro = texto(erro, 400);
    for (const q of exec.passos.slice(i + 1)) if (q.estado === 'esperando') q.estado = 'nao_executado';
    exec.estado = 'falhou';
    exec.erro = p.erro;
  }
}

/** A execução contada em uma frase falada, sem dizer que fez o que não foi feito. */
export function resumoFalado(exec) {
  const daVez = exec.passos.slice(exec.ultimoDesde || 0);
  const feitos = daVez.filter((p) => p.estado === 'feito');
  const falhou = daVez.find((p) => p.estado === 'falhou');
  const naoFeitos = daVez.filter((p) => p.estado === 'nao_executado').length;
  const partes = feitos.map((p) => p.resultado).filter(Boolean);
  if (exec.estado === 'esperando_esclarecimento') return [...partes, exec.pergunta].join(' ');
  if (exec.estado === 'esperando_confirmacao') {
    return [...partes, `Para continuar, preciso do seu sim: ${exec.pendente.descricao}. Posso?`].join(' ');
  }
  if (falhou) {
    return [...partes, `Não consegui ${falhou.descricao || falhou.acao}: ${falhou.erro}.`,
      naoFeitos ? `Parei aí: ${naoFeitos === 1 ? 'o passo seguinte não foi feito' : `os ${naoFeitos} passos seguintes não foram feitos`}.` : ''].filter(Boolean).join(' ');
  }
  return partes.join(' ') || 'Feito.';
}
