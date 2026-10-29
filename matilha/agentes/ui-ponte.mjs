/**
 * A PONTE DA TELA — por onde o Jarvis manda o painel fazer alguma coisa
 * (abrir uma tela, fechar a ficha, aplicar um filtro, clicar num botão)
 * e espera o painel CONFIRMAR o novo estado.
 *
 * Cada painel aberto (aba do navegador) é um "cliente": ele fica numa
 * espera longa (GET /api/jarvis/ui/espera) e recebe os comandos; executa
 * com o próprio código da página (public/ui-controle.js) e devolve o
 * resultado com o estado de depois (POST /api/jarvis/ui/resultado). A
 * ação do Jarvis só vira "feita" quando essa resposta chega. Sem painel
 * aberto, ou sem resposta, é erro — e é dito como erro.
 *
 * Só as páginas da própria Matilha falam com a ponte. Página de fora
 * (um site, um projeto na tela) não manda comando nenhum.
 */
import { randomBytes } from 'node:crypto';

const VIVO_MS = 40_000;      // um painel sem perguntar há mais que isso fechou
const ESPERA_MS = 25_000;    // a espera longa de cada pergunta do painel

export class PonteDaTela {
  constructor({ resposta = 8000 } = {}) {
    this.clientes = new Map();   // id → { id, visto, estado, fila: [], acorda: fn|null, tipo }
    this.esperando = new Map();  // comando → { resolve, reject, relogio }
    this.resposta = resposta;
  }

  _cliente(id, tipo = 'painel') {
    const chave = String(id || '').slice(0, 40).replace(/[^\w-]/g, '');
    if (!chave) throw new Error('cliente sem id');
    let c = this.clientes.get(chave);
    if (!c) { c = { id: chave, visto: Date.now(), estado: {}, fila: [], acorda: null, tipo }; this.clientes.set(chave, c); }
    c.visto = Date.now();
    if (tipo) c.tipo = tipo;
    return c;
  }

  /** O painel conta como está (a cada mudança e a cada espera). */
  estado(id, estado = {}, tipo) {
    const c = this._cliente(id, tipo);
    if (estado && typeof estado === 'object') c.estado = { ...estado, quando: Date.now() };
    return c.estado;
  }

  /** A espera longa: devolve o próximo comando, ou nada depois de 25 s. */
  aguarda(id, { tipo, ms = ESPERA_MS } = {}) {
    const c = this._cliente(id, tipo);
    if (c.fila.length) return Promise.resolve(c.fila.shift());
    c.acorda?.(null);
    return new Promise((resolve) => {
      const relogio = setTimeout(() => { c.acorda = null; resolve(null); }, ms);
      c.acorda = (cmd) => { clearTimeout(relogio); c.acorda = null; resolve(cmd); };
    });
  }

  vivos() { return [...this.clientes.values()].filter((c) => Date.now() - c.visto < VIVO_MS); }

  /** Para onde vai o comando: o painel pedido, senão o que está na frente (com foco), senão o último que falou. */
  escolhe(id, tipo = 'painel') {
    const todos = this.vivos();
    if (id) { const c = todos.find((x) => x.id === id); if (c && (!tipo || c.tipo === tipo)) return c; }
    const vivos = todos.filter((c) => !tipo || c.tipo === tipo);
    return vivos.sort((a, b) => (Number(Boolean(b.estado.foco)) - Number(Boolean(a.estado.foco)))
      || (Number(Boolean(b.estado.visivel)) - Number(Boolean(a.estado.visivel))) || (b.estado.quando || 0) - (a.estado.quando || 0))[0] || null;
  }

  /** O estado da tela que o Jarvis está olhando agora (ou null, sem painel aberto). */
  estadoAtual(id) { return this.escolhe(id, null)?.estado || null; }

  /**
   * Manda um comando e espera o painel confirmar.
   * Devolve `{ ok, estado, evidencia, ... }`; lança se não há painel, ou se ele não respondeu.
   */
  envia(acao, parametros = {}, { cliente, correlacao, tipo = 'painel' } = {}) {
    const c = this.escolhe(cliente, tipo);
    if (!c) {
      return Promise.reject(new Error('não há nenhum painel da Matilha aberto para eu mexer (abra http://127.0.0.1:8899 no navegador)'));
    }
    const comando = { id: randomBytes(6).toString('hex'), acao, parametros, correlacao: correlacao || '' };
    return new Promise((resolve, reject) => {
      const relogio = setTimeout(() => {
        this.esperando.delete(comando.id);
        reject(new Error(`a tela não confirmou "${acao}" em ${Math.round(this.resposta / 1000)} s`));
      }, this.resposta);
      this.esperando.set(comando.id, { resolve, reject, relogio, cliente: c.id });
      if (c.acorda) c.acorda(comando); else c.fila.push(comando);
    });
  }

  /** O painel respondeu. */
  resultado(id, r = {}) {
    const c = this._cliente(id);
    const e = this.esperando.get(r.comando);
    if (r.estado && typeof r.estado === 'object') c.estado = { ...r.estado, quando: Date.now() };
    if (!e) return false;
    clearTimeout(e.relogio);
    this.esperando.delete(r.comando);
    e.resolve({ ok: r.ok !== false, ...r });
    return true;
  }
}
