/**
 * O FLUXO — três agentes girando ao mesmo tempo, cada um na sua caixa.
 *
 * ─────────────────────────────────────────────────────────────────
 * NINGUÉM ESPERA SINAL DE NINGUÉM
 * ─────────────────────────────────────────────────────────────────
 * Não existe "o estúdio avisa o publicador que terminou". O que
 * existe é: cada setor tem uma CAIXA DE TAREFAS, e quem termina um
 * trabalho põe a próxima tarefa na caixa do setor seguinte e já volta
 * para a própria fila. O outro setor, que está girando o tempo todo
 * olhando a caixa dele, acha a tarefa, lê o que é, faz, e segue.
 *
 *    OBSERVADOR          VENDEDOR         ESTÚDIO        PUBLICADOR
 *    olha o mundo        caixa dele       caixa dele     caixa dele
 *    e põe tarefas
 *         │                  │                │               │
 *         └──► responder ────┤                │               │
 *                            ├──► fazer site ─┤               │
 *                            │                ├──► publicar ──┤
 *                            │◄── avisar o cliente ───────────┘
 *
 * Os quatro laços são independentes. Enquanto o estúdio passa 40
 * segundos montando um site no Claude Code, o vendedor responde oito
 * clientes — coisa impossível no desenho anterior, que era um laço só
 * passando por todo mundo em fila.
 *
 * ─────────────────────────────────────────────────────────────────
 * OS HORÁRIOS
 * ─────────────────────────────────────────────────────────────────
 * O vendedor só gira dentro da janela de FALAR (comercial). O estúdio
 * e o publicador giram na janela de TRABALHAR, que é larga — eles não
 * incomodam ninguém. Então de madrugada os sites vão sendo montados, e
 * quando abre o comercial o vendedor acorda com tudo pronto para
 * mandar. Veja `janela.mjs`.
 *
 * ─────────────────────────────────────────────────────────────────
 * ONDE VOCÊ ENTRA
 * ─────────────────────────────────────────────────────────────────
 * Dois pontos, e só dois:
 *
 *   COMEÇA  — o primeiro contato com um número que a matilha achou
 *             sai no seu clique, em lote. Mensagem não pedida em
 *             massa é o caminho mais curto para o número ser
 *             bloqueado, e número raspado é dado pessoal: na LGPD o
 *             problema é seu. Foi regra sua, no começo do projeto.
 *
 *   PARA    — quando o cliente fecha, o fluxo para nele e te chama.
 *             O site final é seu. Depois que você entrega, os agentes
 *             retomam sozinhos para avisar o cliente.
 */
import { copyFile, mkdir, rm, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

import { conversa, momentoDo } from './agentes/vendedor.mjs';
import { casaComLead } from './navegador.mjs';
import { alteraSite, enderecaDemo, fazCardapio, fazOficial, fazSite, leCardapio } from './agentes/claudecode.mjs';
import { buscaFotosDoCardapio, cardapioEmTexto, guardaFotoRecebida, textoEmCardapio } from './agentes/cardapio.mjs';
import { ehDeComida, listaDeNichos } from './oferta.mjs';
import { confereNoAr, dominioValido, estaLivre, limpaDominio, pedeCadeado, procuraLivres } from './agentes/dominio.mjs';
import { cobrancaDevida, mesDe, nomeDoMes, valorDaMensalidade } from './agentes/cobranca.mjs';
import { contaCliques, relatorioDevido } from './agentes/relatorio.mjs';
import { apelido, texto } from './agentes/comum.mjs';
import { Janela } from './janela.mjs';
import { Mural, SETORES } from './mural.mjs';
import { Trabalhador } from './trabalhador.mjs';
import { ArquitetoDeOfertas, TAREFA as GERAR_OFERTA } from './agentes/ofertas.mjs';
import { categoriaDaPergunta, comTempo, TAREFAS as TAREFAS_DE_VALOR, ValueIntelligence } from './agentes/valor.mjs';

export const FUNIL = [
  'novo', 'aguardando_voce', 'abordado', 'conversando',
  'fazendo_demo', 'demo_no_ar', 'fechado', 'com_voce', 'entregue', 'perdido',
];

const agora = () => Date.now();
const HORA = 60 * 60 * 1000;
const DIA = 24 * HORA;

/** Os estágios em que uma fala do dono ganha resposta. */
const COM_RESPOSTA = ['conversando', 'fazendo_demo', 'demo_no_ar', 'fechado', 'com_voce', 'entregue'];

export { momentoDo };

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

/** A ou B, sempre a mesma para o mesmo cliente: metade para cada lado. */
const varianteDe = (id) => ([...String(id)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7) % 2 ? 'B' : 'A');

/** Quem pediu para parar não recebe mais nada. Sem exceção. */
const pediuParaParar = (lead) => lead?.estagio === 'perdido' || lead?.nao_perturbe === true;
/** Projeto encerrado por você (e não concluído): os agentes não trabalham mais nele. */
const projetoParado = (lead) => Boolean(lead?.projeto_encerrado) && lead.projeto_encerrado.estado !== 'concluido';
/** Os setores do mural que têm trabalhador (o que dá para pausar). */
export const SETORES_PAUSAVEIS = ['cacador', 'valor', 'ofertas', 'vendedor', 'estudio', 'publicador', 'dominio'];

export class Fluxo {
  constructor({ dados, zap, publica, ajustes = () => ({}), pastaTrabalho,
    diz = console.log, operacao = null, caca = null, ligaDominio = null, ofertas = null, valor = null }) {
    // Liga um domínio comprado ao site oficial na Netlify (vem do servidor,
    // que tem o token). Sem ele, o agente do domínio só sugere e confere.
    this.ligaDominio = ligaDominio;
    this.dados = dados;
    // A operação é a meta do dia e os freios dela. Sem ela, a Matilha
    // funciona como antes: cada primeiro contato depende do seu
    // clique em "Liberar os marcados".
    this.operacao = operacao;
    // `caca({termo, cidade, aoAchar})` — quem sabe abrir o navegador é
    // o servidor; aqui só pedimos uma busca e recebemos de volta cada
    // negócio na hora em que ele é lido.
    this.caca = caca;
    this.zap = zap;
    this.publica = publica;
    this.ajustes = ajustes;
    this.pastaTrabalho = pastaTrabalho;
    this.diz = diz;

    this.mural = new Mural({ arquivo: join(pastaTrabalho, '..', 'mural.json'), diz });
    // O AGENTE 4, o Offer Architect: entre o caçador e o vendedor. Ele
    // monta a proposta; você aprova; só então o vendedor aborda.
    this.ofertas = ofertas || new ArquitetoDeOfertas({ arquivo: join(pastaTrabalho, '..', 'ofertas.json'), diz });
    this.ofertasCarregadas = null;
    // O VALUE INTELLIGENCE: entre o caçador e o Offer Architect. Diz o que vale para cada
    // restaurante, com evidência, e o vendedor recebe isso pronto (o Value Brief).
    this.valor = valor || new ValueIntelligence({ arquivo: join(pastaTrabalho, '..', 'valor.json'), catalogo: () => this.ofertas?.mem?.catalogo || null, diz });
    this.valorCarregado = null;
    this.ligado = false;
    this.observando = null;
    this.fila = Promise.resolve();   // a fila de gravações, abaixo
    this.ultimo = { quando: null, fez: [], erros: [] };

    this.trabalhadores = [
      // O caçador é um setor como os outros: fica girando, pega a
      // próxima busca da caixa dele e vai. Não espera sinal de
      // ninguém — quando acaba uma busca, põe a seguinte na própria
      // caixa e já pega de novo.
      new Trabalhador({
        setor: 'cacador', mural: this.mural, precisa: 'trabalhar', diz,
        janela: () => this._janela(),
        faz: (t) => this._cacar(t),
      }),
      new Trabalhador({
        setor: 'vendedor', mural: this.mural, precisa: 'falar', diz,
        janela: () => this._janela(),
        faz: (t) => this._vendedor(t),
      }),
      new Trabalhador({
        // Analisar valor não fala com ninguém: não espera o horário.
        setor: 'valor', mural: this.mural, precisa: 'sempre', diz,
        janela: () => this._janela(),
        faz: (t) => this._valor(t),
      }),
      new Trabalhador({
        // Montar a proposta não fala com cliente: não espera o horário.
        setor: 'ofertas', mural: this.mural, precisa: 'sempre', diz,
        janela: () => this._janela(),
        faz: (t) => this._ofertas(t),
      }),
      new Trabalhador({
        setor: 'estudio', mural: this.mural, precisa: 'trabalhar', diz,
        janela: () => this._janela(),
        faz: (t) => this._estudio(t),
      }),
      new Trabalhador({
        setor: 'publicador', mural: this.mural, precisa: 'trabalhar', diz,
        janela: () => this._janela(),
        faz: (t) => this._publicador(t),
      }),
      new Trabalhador({
        setor: 'dominio', mural: this.mural, precisa: 'trabalhar', diz,
        janela: () => this._janela(),
        faz: (t) => this._dominio(t),
      }),
    ];
  }

  _janela() {
    return new Janela(this.ajustes().horarios || {});
  }

  /* ══ PAUSAR E RETOMAR UM AGENTE ═════════════════════════════
     Pausado não pega tarefa nova; a que está fazendo termina. As
     tarefas ficam na caixa. Sobrevive a reiniciar a Matilha.      */
  _arquivoDePausas() { return join(this.pastaTrabalho, '..', 'agentes-pausados.json'); }

  _lePausas() {
    if (this.pausasLidas) return;
    this.pausasLidas = true;
    try {
      const lidos = JSON.parse(readFileSync(this._arquivoDePausas(), 'utf8')).pausados || [];
      for (const t of this.trabalhadores) t.pausado = lidos.includes(t.setor);
    } catch { /* nenhum pausado ainda */ }
  }

  pausados() { this._lePausas(); return this.trabalhadores.filter((t) => t.pausado).map((t) => t.setor); }

  async _marcaPausa(setor, sim) {
    this._lePausas();
    const t = this.trabalhadores.find((x) => x.setor === setor);
    if (!t) throw new Error(`não existe o agente "${setor}"`);
    const mudou = t.pausado !== sim;
    t.pausado = sim;
    await writeFile(this._arquivoDePausas(), JSON.stringify({ pausados: this.pausados() }), 'utf8');
    return { setor, pausado: t.pausado, mudou, fazendo: t.fazendo };
  }

  pausa(setor) { return this._marcaPausa(setor, true); }
  retoma(setor) { return this._marcaPausa(setor, false); }

  /* ══ OS PROJETOS DOS CLIENTES: arquivar e encerrar ═══════════ */

  /** Arquivar: sai das listas de ativos. Nada é apagado; os agentes seguem as obrigações (responder, cobrar). */
  async arquivaProjeto(leadId, sim = true) {
    return this.comOsDados(async (tudo) => {
      const lead = (tudo.leads || []).find((l) => l.id === leadId);
      if (!lead) throw new Error('esse cliente não existe mais');
      const ja = Boolean(lead.arquivado_em) === sim;
      if (!ja) { if (sim) lead.arquivado_em = agora(); else delete lead.arquivado_em; }
      return { lead: { id: lead.id, nome: lead.nome, arquivado_em: lead.arquivado_em || null }, mudou: !ja };
    });
  }

  /** O que pesa antes de encerrar o projeto de um cliente (para pedir o seu sim). */
  pendenciasDoProjeto(lead) {
    const tarefas = this.mural.tarefas.filter((t) => t.dados?.leadId === lead.id && ['esperando', 'fazendo', 'travada'].includes(t.estado));
    const lista = [];
    if (tarefas.length) lista.push(`${tarefas.length} tarefa(s) dos agentes ainda na fila (${[...new Set(tarefas.map((t) => t.tipo))].join(', ')}), que serão canceladas`);
    if (lead.vendeu_em && lead.estagio !== 'entregue') lead.sites?.oficial?.url
      ? lista.push('o site oficial dele está no ar mas a entrega não foi marcada')
      : lista.push('ele já fechou e o site oficial ainda não foi entregue');
    if (lead.aprovado_em && !lead.cancelado_em) lista.push('ele paga mensalidade: a cobrança NÃO é cancelada por isto (é outra decisão)');
    if (!lead.vendeu_em && !['novo', 'perdido'].includes(lead.estagio)) lista.push('a conversa de venda com ele para (os agentes não falam mais com ele)');
    return { lista, tarefas: tarefas.length };
  }

  /**
   * Encerrar: o trabalho acaba. Entregue → "concluído". Antes da entrega →
   * "encerrado" (ou "cancelado"): o que estava na fila dele é cancelado e
   * os agentes param de trabalhar nele. Nunca apaga nada.
   */
  async encerraProjeto(leadId, { motivo = '', cancelar = false } = {}) {
    const r = await this.comOsDados(async (tudo) => {
      const lead = (tudo.leads || []).find((l) => l.id === leadId);
      if (!lead) throw new Error('esse cliente não existe mais');
      if (lead.projeto_encerrado) return { lead, mudou: false };
      const estado = lead.estagio === 'entregue' && !cancelar ? 'concluido' : cancelar ? 'cancelado' : 'encerrado';
      lead.projeto_encerrado = { estado, em: agora(), motivo: texto(motivo, 200) || 'encerrado por você', estagio_antes: lead.estagio };
      // Quem ainda nem comprou sai do funil como perdido (com o motivo), e os agentes param de falar com ele.
      if (estado !== 'concluido' && !lead.vendeu_em) { lead.estagio = 'perdido'; lead.motivo_perda = lead.projeto_encerrado.motivo; }
      return { lead, mudou: true };
    });
    const fila = r.mudou && r.lead.projeto_encerrado.estado !== 'concluido'
      ? await this.mural.cancelaDoLead(leadId, `cancelada: projeto ${r.lead.projeto_encerrado.estado}`) : { canceladas: [], andando: [] };
    return { lead: { id: r.lead.id, nome: r.lead.nome, estagio: r.lead.estagio, projeto_encerrado: r.lead.projeto_encerrado }, mudou: r.mudou, ...fila };
  }

  /**
   * Mexe nos dados com a fila em ordem.
   *
   * Agora há quatro laços rodando ao mesmo tempo, e todos querem
   * escrever no mesmo arquivo. Sem isto, dois que leem o estado ao
   * mesmo tempo e gravam em seguida fazem o segundo apagar o trabalho
   * do primeiro — o clássico "o cliente sumiu do funil". Aqui cada
   * mexida espera a anterior terminar.
   */
  async comOsDados(trabalho) {
    const minhaVez = this.fila.then(async () => {
      const tudo = this.dados.tudo();
      const saida = await trabalho(tudo);
      await this.dados.guarda(tudo);
      return saida;
    });
    // A fila não pode parar por causa de um erro de um dos passos.
    this.fila = minhaVez.then(() => {}, () => {});
    return minhaVez;
  }

  async acha(leadId) {
    const tudo = this.dados.tudo();
    return (tudo.leads || []).find((l) => l.id === leadId) || null;
  }

  /* ══ ligar e desligar ═══════════════════════════════════════ */
  /** O Offer Architect, com o arquivo dele já lido. */
  async arquiteto() {
    this.ofertasCarregadas ||= this.ofertas.carrega(this.ajustes());
    await this.ofertasCarregadas;
    return this.ofertas;
  }

  /** O vendedor espera a oferta aprovada? (desligável no catálogo das ofertas) */
  _comOfertas() {
    return Boolean(this.ofertas?.mem?.catalogo) && this.ofertas.ligado();
  }

  /** O mural lido do disco uma vez só (ler de novo no meio de uma tarefa a duplicaria). */
  _muralPronto() {
    this.muralCarregado ||= this.mural.carrega();
    return this.muralCarregado;
  }

  /**
   * Liga só o Offer Architect: o "Gerar oferta" do painel funciona mesmo
   * com a matilha parada. A tarefa vai pelo mural do mesmo jeito.
   */
  async ligaOfertas() {
    await this._muralPronto();
    await this.arquiteto();
    await this.analista();
    this.trabalhadores.find((t) => t.setor === 'ofertas')?.liga();
    this.trabalhadores.find((t) => t.setor === 'valor')?.liga();
  }

  /* ══ O VALUE INTELLIGENCE ═══════════════════════════════════
     O brief é gravado em disco ANTES de criar a tarefa do próximo
     agente; se a Matilha cair no meio, ao subir ela refaz só a tarefa
     que faltou (a "caixa de saída"), sem refazer a análise.          */
  async analista() {
    this.valorCarregado ||= (async () => {
      await this.valor.carrega();
      await this._muralPronto();
      for (const b of this.valor.saidasPendentes()) await this._entregaBrief(b).catch((e) => this.diz(`  ⚠ value brief ${b.brief_id}: ${e.message}`));
    })();
    await this.valorCarregado;
    return this.valor;
  }

  _comValor() { return Boolean(this.valor && this.valorCarregado) && this.valor.ligado(); }

  /** Põe uma tarefa na caixa do Value Intelligence (idempotente: a mesma análise não entra duas vezes). */
  async pedeValor(lead, { tipo = TAREFAS_DE_VALOR.brief, correlacao = '', forca = false, produto = '', pergunta = '', para = 0, categoria = '' } = {}) {
    this.valor.evento('value.analysis.requested', { lead_id: lead.id, tarefa: tipo, correlacao });
    const chave = tipo === TAREFAS_DE_VALOR.assistencia ? `valor:assist:${lead.id}:${para}` : `valor:${tipo}:${lead.id}${forca ? `:${agora()}` : ''}`;
    return this.mural.poe('valor', tipo, { leadId: lead.id, nome: lead.nome, correlacao, forca, produto, pergunta, para, categoria },
      { chave, prioridade: tipo === TAREFAS_DE_VALOR.assistencia ? 1 : 4 });
  }

  /** Depois do brief salvo: a tarefa do próximo agente (o Offer Architect; sem ele, o primeiro contato). */
  async _entregaBrief(b) {
    const lead = await this.acha(b.lead_id);
    if (!lead || pediuParaParar(lead)) { await this.valor.marcaSaida(b.brief_id, { para: 'ninguém', motivo: 'cliente parou' }); return null; }
    let t = null;
    if (this._comOfertas() && !lead.oferta_aprovada && !this.ofertas.pendenteDe(lead.id)) {
      t = await this.pedeOferta(lead, { correlacao: b.correlacao });
    } else if (!this._comOfertas() && lead.estagio === 'aguardando_voce' && !lead.abordado_em) {
      t = await this.poeNaFilaDeAbordagem(lead);
    }
    await this.valor.marcaSaida(b.brief_id, { para: t ? t.setor : 'ninguém (a oferta já existia)', tarefa: t?.id || null });
    return t;
  }

  async _valor(tarefa) {
    const v = await this.analista();
    const d = tarefa.dados || {};
    const ajustes = this.ajustes();
    if (tarefa.tipo === TAREFAS_DE_VALOR.produto) {
      const a = await comTempo(Promise.resolve().then(() => v.analisaProduto(d.produto || 'site', ajustes)), 30_000, 'a análise passou do tempo');
      v.mem.analises.push({ tipo: 'produto', product_id: a.product_id, product_version: a.product_version, quando: agora(), principais: a.principais.map((x) => x.benefit), correlacao: d.correlacao });
      v.evento('value.analysis.completed', { produto: a.product_id, correlacao: d.correlacao });
      await v._grava();
      return `valor de ${a.nome} (versão ${a.product_version}): ${a.principais.map((x) => x.feature).join(', ')}`;
    }
    const lead = await this.acha(d.leadId);
    if (!lead) return 'cliente não existe mais';
    if (pediuParaParar(lead)) return 'cliente pediu para parar';
    try {
      if (tarefa.tipo === TAREFAS_DE_VALOR.lead) {
        const a = v.analisaLead(lead, d.produto, ajustes);
        v.mem.analises.push({ tipo: 'lead', lead_id: lead.id, product_id: a.product_id, product_version: a.product_version, quando: agora(), principais: a.principais.map((x) => x.benefit), confidence_score: a.confidence_score, correlacao: d.correlacao });
        v.evento('value.analysis.completed', { lead_id: lead.id, correlacao: d.correlacao });
        await v._grava();
        return `análise de ${lead.nome}: ${a.principais.map((x) => x.feature).join(', ')}`;
      }
      if (tarefa.tipo === TAREFAS_DE_VALOR.assistencia) {
        const r = { ...v.responde(d.pergunta, lead, ajustes), lead_id: lead.id, para: d.para, correlacao: d.correlacao };
        await v.guardaAssistencia(r);
        await this.comOsDados(async (tudo) => {
          const atual = (tudo.leads || []).find((l) => l.id === lead.id);
          if (atual) atual.value_assist = { ...(atual.value_assist || {}), [r.categoria]: r };
        });
        return `apoio ao vendedor (${r.categoria}): ${r.vantagem_suficiente ? 'com argumento' : 'sem vantagem suficiente, dito com franqueza'}`;
      }
      const { brief, novo } = await v.geraBrief(lead, { produto: d.produto, correlacao: d.correlacao, ajustes,
        forca: tarefa.tipo === TAREFAS_DE_VALOR.atualiza || d.forca, motivo: tarefa.tipo === TAREFAS_DE_VALOR.atualiza ? 'produto mudou' : 'novo' });
      if (brief.estado === 'bloqueado') return `Value Brief de ${lead.nome} bloqueado: ${brief.problemas.join('; ')}`;
      const t = brief.saida?.pendente ? await this._entregaBrief(brief) : null;
      return `Value Brief de ${lead.nome} ${novo ? `v${brief.versao}` : '(o mesmo, nada mudou)'}: ${brief.prioritized_benefits.map((x) => x.feature).join(', ')}${t ? ` → tarefa #${t.id} para ${t.setor}` : ''}`;
    } catch (e) {
      await v.falhou(lead.id, e.message, d.correlacao);
      throw e;
    }
  }

  /** "Enviar ao vendedor" (tela ou Jarvis): o brief aprovado vai para o cliente, e o vendedor passa a usar. */
  async enviaBriefAoVendedor(briefId, correlacao = '') {
    const v = await this.analista();
    const b = v.acha(briefId);
    if (!b) throw new Error('Value Brief não encontrado.');
    const retrato = await v.enviaAoVendedor(briefId, correlacao);
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === b.lead_id);
      if (atual) atual.value_brief = retrato;
    });
    return retrato;
  }

  /** O produto mudou (versão nova): os briefs feitos com a versão antiga entram na fila para ser refeitos. */
  async refazDesatualizados(correlacao = '') {
    const v = await this.analista();
    const postas = [];
    for (const b of v.desatualizados(this.ajustes())) {
      const lead = await this.acha(b.lead_id);
      if (!lead || pediuParaParar(lead)) continue;
      postas.push(await this.pedeValor(lead, { tipo: TAREFAS_DE_VALOR.atualiza, correlacao, produto: b.product_id }));
    }
    return postas;
  }

  async liga() {
    if (this.ligado) return this.estado();
    this._lePausas();
    await this._muralPronto();
    await this.arquiteto();
    await this.analista();
    await mkdir(this.pastaTrabalho, { recursive: true });
    this.ligado = true;
    for (const t of this.trabalhadores) t.liga();
    this.observando = this._observa();
    // Se a operação estava ligada quando a Matilha fechou, a caçada
    // recomeça sozinha de onde parou. É o que faz "fazer dinheiro"
    // sobreviver a um reinício sem você clicar de novo.
    await this._poeProximaBusca();
    this.diz('  ▶ fluxo ligado — os agentes estão girando');
    return this.estado();
  }

  async desliga() {
    this.ligado = false;
    await Promise.all(this.trabalhadores.map((t) => t.desliga()));
    await this.observando?.catch(() => {});
    this.observando = null;
    this.diz('  ⏸ fluxo desligado');
    return this.estado();
  }

  estado() {
    this._lePausas();
    const tudo = this.dados.tudo();
    const funil = Object.fromEntries(FUNIL.map((e) => [e, 0]));
    for (const lead of tudo.leads || []) {
      funil[lead.estagio] = (funil[lead.estagio] || 0) + 1;
    }
    return {
      ligado: this.ligado,
      funil,
      aguardando_voce: funil.aguardando_voce || 0,
      com_voce: funil.com_voce || 0,
      horarios: this._janela().estado(),
      mural: this.mural.estado(),
      trabalhadores: this.trabalhadores.map((t) => t.estado()),
      operacao: this.operacao ? this.operacao.estado(tudo.leads || []) : null,
      ultimo: this.ultimo,
    };
  }

  /* ══ O OBSERVADOR ═══════════════════════════════════════════
     Ele não executa nada. Olha o mundo — o WhatsApp e o estado dos
     clientes — e transforma o que vê em tarefas nas caixas. É o
     único que fala com o WhatsApp para LER.                      */
  async _observa() {
    while (this.ligado) {
      const fez = [];
      const erros = [];
      try {
        await this._recolheRespostas(fez, erros);
        await this._poeOQueFalta(fez, erros);
        await this._expiraPrevias(fez, erros);
        // Virou o dia com a caçada parada (buscas esgotadas, teto de
        // caçados): a conta zera, então a caçada volta sozinha.
        if (this.operacao && await this.operacao.confereODia()) await this._poeProximaBusca();
      } catch (e) {
        erros.push(texto(e.message, 180));
      }
      if (fez.length || erros.length) this.ultimo = { quando: agora(), fez, erros };

      // Quinze segundos: o WhatsApp Web não gosta de ser varrido sem
      // parar, e resposta de cliente não precisa de reação em um
      // segundo. As CAIXAS, essas sim são olhadas a cada segundo —
      // mas isso é memória, não navegador.
      for (let i = 0; i < 15 && this.ligado; i += 1) await dorme(1000);
    }
  }

  /** Puxa o que chegou no WhatsApp e cola na conversa de quem é. */
  async _recolheRespostas(fez, erros) {
    // Fora do horário de falar, nem lê: abrir o WhatsApp de madrugada
    // só para olhar é movimento à toa na conta.
    if (!this._janela().podeFalar()) return;

    let novidades;
    try {
      // Só as conversas de quem é lead; qualquer outro número é ignorado
      // por completo (nem aberto, para não marcar como lida no seu celular).
      const leads = (this.dados.tudo().leads || []).filter((l) => !pediuParaParar(l));
      novidades = await this.zap.novidades(20, { eDeLead: (titulo) => Boolean(casaComLead(titulo, leads)) });
    } catch (e) {
      erros.push(`WhatsApp: ${texto(e.message, 140)}`);
      return;
    }
    const lista = novidades?.conversas || [];
    if (!Array.isArray(lista) || !lista.length) return;

    // Quem mandou foto do cardápio depois de fechar: o estúdio lê.
    const lerCardapio = [];
    await this.comOsDados(async (tudo) => {
      for (const conversaWpp of lista) {
        // O WhatsApp mostra o NOME quando o contato está salvo e o
        // NÚMERO quando não está. Os leads vêm do Maps e quase nunca
        // estão salvos — mas "quase" não é "nunca".
        const lead = casaComLead(texto(conversaWpp?.de, 140) || conversaWpp?.digitos, tudo.leads || []);
        if (!lead || pediuParaParar(lead)) continue;

        lead.conversa = lead.conversa || [];
        let chegou = false;
        // Repetida é só a fala que já entrou DEPOIS da nossa última
        // mensagem (a mesma leva de não lidas, lida duas vezes). Contra a
        // conversa inteira, o segundo "Sim" do dono sumia, e com ele a venda.
        const nossaUltima = lead.conversa.map((m) => m.quem).lastIndexOf('voce');
        const recentes = lead.conversa.slice(nossaUltima + 1).filter((m) => m.quem === 'dono').map((m) => m.texto);
        for (const bruta of conversaWpp?.mensagens || []) {
          const fala = texto(bruta, 1500).trim();
          if (!fala) continue;
          if (recentes.includes(fala)) continue;
          recentes.push(fala);
          lead.conversa.push({ quem: 'dono', texto: fala, quando: agora() });
          chegou = true;
        }
        // As fotos que ele mandou ficam guardadas (dados/recebidas/). Depois
        // da venda, a de um restaurante é quase sempre o cardápio de hoje.
        let fotosNovas = 0;
        for (const foto of conversaWpp?.fotos || []) {
          lead.recebidas = lead.recebidas || [];
          if (!foto?.marca || lead.recebidas.some((r) => r.marca === foto.marca)) continue;
          try {
            const salva = await guardaFotoRecebida(dirname(this.pastaTrabalho), lead.id, foto);
            if (!salva) continue;
            lead.recebidas.push({ arquivo: salva.arquivo, marca: foto.marca, quando: agora() });
            lead.recebidas = lead.recebidas.slice(-20);
            fotosNovas += 1;
          } catch (e) { erros.push(`foto de ${lead.nome}: ${texto(e.message, 100)}`); }
        }
        // Antes do oficial é o cardápio que falta; depois, é o preço que mudou.
        if (fotosNovas && lead.vendeu_em && this._deComida(lead)) lerCardapio.push(lead);
        if (!chegou && !fotosNovas) continue;

        if (lead.estagio === 'abordado') lead.estagio = 'conversando';
        fez.push(`${lead.nome}: respondeu${fotosNovas ? ` (${fotosNovas} foto${fotosNovas > 1 ? 's' : ''})` : ''}`);
      }
    });
    // Espera um pouco: quem manda o cardápio costuma mandar duas ou três fotos seguidas.
    for (const lead of lerCardapio) {
      await this.mural.poe('estudio', 'ler_cardapio', { leadId: lead.id, nome: lead.nome },
        { chave: `estudio:ler_cardapio:${lead.id}:${(lead.recebidas || []).length}`, prioridade: 1, espera: 45_000 });
    }
  }

  /** Este cliente vende comida (e por isso tem cardápio)? */
  _deComida(lead) {
    return ehDeComida(lead?.tipo, listaDeNichos(this.ajustes().nichosComida));
  }

  /**
   * Olha cada cliente e põe na caixa do setor certo o que estiver
   * faltando. A chave de cada tarefa inclui o tamanho da conversa, de
   * modo que uma fala nova gera tarefa nova, mas passar duas vezes
   * pelo mesmo estado não gera duas.
   */
  async _poeOQueFalta(fez) {
    const tudo = this.dados.tudo();
    for (const lead of tudo.leads || []) {
      if (pediuParaParar(lead) || projetoParado(lead)) continue;

      const conversaDoLead = lead.conversa || [];

      // ─────────────────────────────────────────────────────────
      // "TEM FALA DO DONO SEM RESPOSTA?" — e não "a última fala é
      // dele?"
      // ─────────────────────────────────────────────────────────
      // A pergunta errada custou caro: com quatro laços rodando ao
      // mesmo tempo, o cliente escreve enquanto o vendedor ainda está
      // mandando OUTRA coisa. O envio do agente entra depois da fala
      // do cliente, a última mensagem passa a ser do agente, e o
      // observador conclui "não é minha vez" — deixando o cliente
      // falando sozinho, sem erro nenhum na tela.
      //
      // `respondido_ate` guarda até onde a conversa já foi atendida.
      // Qualquer fala do dono depois disso é uma fala sem resposta,
      // tenha vindo antes ou depois do último envio nosso.
      const jaAtendido = Number(lead.respondido_ate) || 0;
      const temFalaSemResposta = conversaDoLead
        .slice(jaAtendido)
        .some((m) => m?.quem === 'dono');

      // Quem está esperando a demo e quem já fechou também escreve — e
      // antes ficava falando sozinho: "quando fica pronto?" não tinha
      // resposta nenhuma.
      // Uma resposta segurada para você revisar não vira tarefa de novo a
      // cada 15 segundos (eram duas chamadas ao Claude por volta, para
      // sempre): só quando o dono escrever outra coisa.
      const segurada = Number(lead.revisar?.ate) >= conversaDoLead.length;
      if (COM_RESPOSTA.includes(lead.estagio) && temFalaSemResposta && !segurada) {
        await this.mural.poe('vendedor', 'responder',
          { leadId: lead.id, nome: lead.nome },
          { chave: `vendedor:responder:${lead.id}:${conversaDoLead.length}`, prioridade: 1 });
      }

      // ── a mensalidade: no dia, 3 dias depois, e aos 7 chama você ──
      const ajustesAgora = this.ajustes();
      const devida = ajustesAgora.cobrador !== false ? cobrancaDevida(lead) : null;
      if (devida?.qual === 'chamar') {
        await this.comOsDados(async (dados) => {
          const atual = (dados.leads || []).find((l) => l.id === lead.id);
          if (!atual) return;
          atual.mensalidade = atual.mensalidade || {};
          atual.mensalidade.avisos = atual.mensalidade.avisos || {};
          atual.mensalidade.avisos[devida.mes] = { ...(atual.mensalidade.avisos[devida.mes] || {}), chamou: agora() };
        });
        await this._chamaVoce(lead, `mensalidade de ${nomeDoMes(devida.mes)} com 7 dias de atraso: fale com ele (o cobrador não insiste mais)`);
      } else if (devida) {
        await this.mural.poe('vendedor', 'cobrar', { leadId: lead.id, nome: lead.nome, qual: devida.qual, mes: devida.mes },
          { chave: `vendedor:cobrar:${lead.id}:${devida.mes}:${devida.qual}`, prioridade: 3 });
      }

      // ── o relatório do mês, nos três primeiros dias ──
      const relatorio = ajustesAgora.relatorio !== false ? relatorioDevido(lead) : null;
      if (relatorio) {
        await this.mural.poe('vendedor', 'relatorio', { leadId: lead.id, nome: lead.nome, mes: relatorio.mes },
          { chave: `vendedor:relatorio:${lead.id}:${relatorio.mes}`, prioridade: 5 });
      }

      // ── o domínio comprado: o agente confere a cada 15 minutos ──
      if (lead.dominio?.estado === 'ligando') {
        const vez = Math.floor(agora() / (15 * 60_000));
        await this.mural.poe('dominio', 'conferir', { leadId: lead.id, nome: lead.nome },
          { chave: `dominio:conferir:${lead.id}:${vez}`, prioridade: 4 });
      }

      // ── os lembretes: um para quem não respondeu, dois depois da demo ──
      const lembrete = this._lembreteDevido(lead, temFalaSemResposta);
      if (lembrete) {
        await this.mural.poe('vendedor', 'lembrar',
          { leadId: lead.id, nome: lead.nome, qual: lembrete },
          { chave: `vendedor:lembrar:${lead.id}:${lembrete}`, prioridade: 5 });
      }

      // ── o estúdio tem que montar a demo ──
      // Entre o estúdio terminar e o publicador pôr no ar, o estágio ainda
      // é "fazendo_demo": sem esta conferência, o site era montado de novo
      // (e a pasta apagada no meio da publicação).
      const emAndamento = this.mural.tarefas.some((t) => t.dados?.leadId === lead.id
        && (t.setor === 'estudio' || t.setor === 'publicador')
        && ['esperando', 'fazendo', 'travada'].includes(t.estado));
      if (lead.estagio === 'fazendo_demo' && !lead.sites?.demo?.url && !emAndamento) {
        await this.mural.poe('estudio', 'fazer_site',
          { leadId: lead.id, nome: lead.nome, versao: 'demo' },
          { chave: `estudio:fazer_site:${lead.id}`, prioridade: 3 });
      }

      // ── o cliente fechou: avisar e passar para você ──
      if (lead.estagio === 'fechado') {
        await this.mural.poe('vendedor', 'passar',
          { leadId: lead.id, nome: lead.nome },
          { chave: `vendedor:passar:${lead.id}`, prioridade: 2 });
      }
    }
    if (fez) { /* nada a registrar aqui: pôr tarefa não é "fazer" */ }
  }

  /**
   * Qual lembrete este cliente deve receber agora, se algum.
   *
   * A maioria das vendas sai no segundo contato, não no primeiro — e
   * até agora não havia segundo contato nenhum: quem não respondeu
   * ficava parado para sempre. Mas lembrete demais é spam, e spam
   * derruba o número. Por isso são poucos e com regra fixa:
   *   · sem_resposta: 2 dias depois do primeiro contato, se ele nunca
   *     respondeu. Um só.
   *   · demo: 1 dia depois do link, se ele não disse nada desde então.
   *   · expira: 1 dia antes de a demonstração sair do ar, se ele
   *     continua calado. A data é real e é cumprida.
   * Desligável no painel (Ajustes › Negócio e preços).
   */
  _lembreteDevido(lead, temFalaSemResposta) {
    const lembretes = this.ajustes().lembretes || {};
    const ja = new Set((lead.lembretes || []).map((l) => l.qual));
    const conversa = lead.conversa || [];
    const ultima = conversa[conversa.length - 1];
    if (temFalaSemResposta || !ultima || ultima.quem === 'dono') return null;
    const desde = (ms) => agora() - (Number(ms) || agora());

    if (lead.estagio === 'abordado' && lembretes.semResposta !== false && !ja.has('sem_resposta')
        && !conversa.some((m) => m.quem === 'dono') && desde(lead.abordado_em) > 2 * DIA) {
      return 'sem_resposta';
    }
    if (lead.estagio === 'demo_no_ar' && lembretes.demo !== false && lead.sites?.demo?.avisado_em) {
      const calado = !conversa.some((m) => m.quem === 'dono' && m.quando > lead.sites.demo.avisado_em);
      if (!calado) return null;
      const faltam = Number(lead.sites.demo.expira_em) - agora();
      if (!ja.has('demo') && desde(lead.sites.demo.avisado_em) > DIA && faltam > 1.5 * DIA) return 'demo';
      if (!ja.has('expira') && faltam > 0 && faltam < 1.5 * DIA && desde(lead.sites.demo.avisado_em) > 12 * HORA) {
        return 'expira';
      }
    }
    return null;
  }

  /** Tira do ar o que prometemos que sairia. */
  async _expiraPrevias(fez, erros) {
    const tudo = this.dados.tudo();
    for (const lead of tudo.leads || []) {
      const quando = Number(lead?.sites?.demo?.expira_em);
      if (!quando || quando > agora() || lead.sites.demo.expirada) continue;
      try {
        if (this.publica.derruba) await this.publica.derruba(lead.sites.demo.site_id);
        await this.comOsDados(async (estado) => {
          const atual = (estado.leads || []).find((l) => l.id === lead.id);
          if (atual?.sites?.demo) atual.sites.demo.expirada = true;
        });
        fez.push(`${lead.nome}: prévia expirou e saiu do ar`);
      } catch (e) {
        erros.push(`expirar ${lead.nome}: ${texto(e.message, 120)}`);
      }
    }
  }

  /* ══ O CAÇADOR ══════════════════════════════════════════════
     Agente 1. Pega uma busca, caça, e cada negócio que acha vai NA
     HORA para a caixa do vendedor. Terminada a busca, põe a próxima
     na própria caixa — é isso que faz a caçada não parar até a meta.  */

  /** Um respiro entre uma leva de buscas e a seguinte. */
  static get ESPERA_ENTRE_BUSCAS() { return 2000; }

  async _cacar(tarefa = {}) {
    if (!this.operacao || !this.caca) return 'sem operação ligada';
    await this.operacao.confereODia();

    const permissao = this.operacao.podeCacar(this.dados.tudo().leads || []);
    if (!permissao.pode) {
      if (this.operacao.ligada && permissao.motivo.includes('meta')) {
        await this.operacao.para(permissao.motivo);
        this.diz(`  ★ ${permissao.motivo} — a caçada parou. Quem já está conversando continua.`);
      }
      return `caçada parada: ${permissao.motivo}`;
    }

    // Uma busca para cada caçador escolhido no painel, todas ao mesmo
    // tempo, cada uma na sua aba.
    const cacadores = this.operacao.meta.cacadores || 1;
    const buscas = await this.operacao.proximasBuscas(cacadores);
    if (!buscas.length) return 'nenhuma busca configurada';

    let novos = 0;
    const saida = await this.caca({
      buscas,
      cacadores,
      aoAchar: async (negocio) => {
        const r = await this.recebeAchado(negocio);
        if (r?.novo) novos += 1;
      },
    });

    for (const busca of saida?.esgotadas || []) await this.operacao.esgota(busca);

    await this._poeProximaBusca(tarefa.id);
    const onde = buscas.map((b) => `${b.termo} em ${b.cidade}`).join(', ');
    const parou = saida?.parou ? ` (parou: ${saida.parou})` : '';
    const esgotou = saida?.esgotadas?.length ? ` · ${saida.esgotadas.length} esgotada(s)` : '';
    return `${onde}: ${novos} novo(s) sem site${esgotou}${parou}`;
  }

  /**
   * Põe a próxima busca — uma só. Duas correntes de caçada ao mesmo
   * tempo seria o dobro de abas para o mesmo trabalho.
   *
   * `souEu` é a tarefa que está chamando isto. Sem esse detalhe, a
   * corrente MORRIA na primeira busca: quem põe a próxima é a busca
   * que está acabando, e ela ainda consta como "fazendo" — então a
   * verificação de "já tem uma busca andando" encontrava a si mesma e
   * desistia. O caçador fazia uma busca e parava para sempre.
   */
  async _poeProximaBusca(souEu = null) {
    if (!this.operacao?.ligada) return null;
    if (!this.operacao.podeCacar(this.dados.tudo().leads || []).pode) return null;
    const jaTem = this.mural.tarefas.some(
      (t) => t.setor === 'cacador' && t.id !== souEu
        && (t.estado === 'esperando' || t.estado === 'fazendo'),
    );
    if (jaTem) return null;
    return this.mural.poe('cacador', 'cacar', {},
      { chave: `cacador:cacar:${agora()}`, prioridade: 5, espera: Fluxo.ESPERA_ENTRE_BUSCAS });
  }

  /**
   * Chegou um negócio do caçador — AGORA, no meio da busca.
   *
   * Aqui é onde o Agente 1 encosta no Agente 2. Repare que não existe
   * "avisar": o caçador põe a tarefa na caixa do vendedor e segue
   * lendo a página seguinte. O vendedor, que já está girando, pega
   * quando pegar.
   */
  async recebeAchado(negocio) {
    const numeroLimpo = (valor) => String(valor || '').replace(/\D/g, '');
    const whats = numeroLimpo(negocio.whatsapp || negocio.telefone);

    const resultado = await this.comOsDados(async (tudo) => {
      tudo.leads = tudo.leads || [];
      // Repetido é repetido: mesmo número ou mesmo ponto no mapa.
      // Abordar duas vezes o mesmo negócio é a forma mais rápida de
      // virar bloqueio.
      const jaExiste = tudo.leads.find((l) => (
        (whats && numeroLimpo(l.whatsapp) === whats)
        || (negocio.maps && l.maps === negocio.maps)
      ));
      if (jaExiste) return { novo: false, lead: jaExiste };

      const lead = {
        id: String(Math.random()).slice(2, 10),
        criado: agora(),
        // Sem WhatsApp não há o que mandar: fica no funil para você
        // olhar, mas não entra na fila de abordagem.
        estagio: whats ? 'aguardando_voce' : 'novo',
        conversa: [],
        sites: {},
        nome: negocio.nome || '',
        tipo: negocio.tipo || '',
        cidade: negocio.cidade || '',
        endereco: negocio.endereco || '',
        telefone: negocio.telefone || '',
        whatsapp: whats,
        instagram: negocio.instagram || '',
        horario: negocio.horario || '',
        itens: [],
        observacao: '',
        presenca: 'sem_site_encontrado',
        maps: negocio.maps || '',
        // A nota e as avaliações são o detalhe concreto da primeira
        // mensagem ("4,7 com 183 avaliações"). Antes o caçador lia e o
        // fluxo jogava fora, e a abordagem saía genérica.
        nota: Number(negocio.nota) || null,
        avaliacoes: Number(negocio.avaliacoes) || null,
        site_proprio: Boolean(negocio.site_proprio),
        // Fotos públicas da ficha do Maps e o horário de lá: o estúdio usa
        // na demonstração, em vez de deixar o site sem imagem nenhuma.
        fotos: Array.isArray(negocio.fotos) ? negocio.fotos.slice(0, 8) : [],
        pontuacao: negocio.pontos ?? null,
        // O que a prospecção verificou e o Offer Architect usa como evidência:
        // o site que existe, como está o cardápio hoje e os problemas com fonte.
        website: negocio.website || '',
        cardapio_atual: negocio.cardapio_atual && typeof negocio.cardapio_atual === 'object' ? negocio.cardapio_atual : null,
        problemas: Array.isArray(negocio.problemas) ? negocio.problemas.slice(0, 5) : [],
        fonte: negocio.fonte || 'matilha_maps',
      };
      tudo.leads.push(lead);
      return { novo: true, lead };
    });

    if (!resultado.novo || !resultado.lead.whatsapp) return resultado;
    // Prospecção → Offer Architect → vendedor. Sem as ofertas ligadas, direto para o vendedor.
    // Prospecção → Value Intelligence → Offer Architect → vendedor.
    if (this._comValor()) await this.pedeValor(resultado.lead);
    else if (this._comOfertas()) await this.pedeOferta(resultado.lead);
    else await this.poeNaFilaDeAbordagem(resultado.lead);
    return resultado;
  }

  /**
   * Põe um cliente na fila do primeiro contato, respeitando os freios.
   *
   * O espaçamento não é enfeite: mensagem igual saindo de doze em doze
   * segundos é o retrato do que o WhatsApp chama de disparo em massa.
   * A tarefa é criada já com a hora em que pode ser pega.
   */
  async poeNaFilaDeAbordagem(lead) {
    if (!this.operacao) return null;
    const leads = this.dados.tudo().leads || [];
    const permissao = this.operacao.podeAbordar(leads);
    if (!permissao.pode) return null;

    // Quantos já estão na fila esperando a vez deles — cada um empurra
    // o próximo para frente.
    const naFila = this.mural.tarefas.filter(
      (t) => t.setor === 'vendedor' && t.tipo === 'abordar' && t.estado === 'esperando',
    ).length;
    const espera = this.operacao.esperaDaVez(leads)
      + naFila * this.operacao.meta.esperaEntreContatos;

    return this.mural.poe('vendedor', 'abordar',
      { leadId: lead.id, nome: lead.nome },
      { chave: `vendedor:abordar:${lead.id}`, prioridade: 4, espera });
  }

  /* ══ O OFFER ARCHITECT ══════════════════════════════════════ */

  /** Põe "offer.generate" na caixa das ofertas. */
  async pedeOferta(lead, { produto = '', refazer = false, campanha = '', correlacao = '' } = {}) {
    return this.mural.poe('ofertas', GERAR_OFERTA,
      { leadId: lead.id, nome: lead.nome, produto, refazer, campanha, ...(correlacao ? { correlacao } : {}) },
      { chave: `ofertas:gerar:${lead.id}${refazer ? `:${agora()}` : ''}`, prioridade: 4 });
  }

  async _ofertas(tarefa) {
    if (tarefa.tipo !== GERAR_OFERTA) return `não sei fazer "${tarefa.tipo}"`;
    const lead = await this.acha(tarefa.dados.leadId);
    if (!lead) return 'cliente não existe mais';
    if (pediuParaParar(lead)) return 'cliente pediu para parar';
    const arq = await this.arquiteto();
    if (lead.oferta_aprovada && !tarefa.dados.refazer) return 'já tem oferta aprovada';
    // O Offer Architect monta a proposta EM CIMA do valor que o Value Intelligence achou para este restaurante.
    const brief = this._comValor() ? this.valor.briefDe(lead.id) : null;
    const usavel = brief && !['bloqueado', 'falhou'].includes(brief.estado) ? brief : null;
    const o = await arq.gera({ lead, ajustes: this.ajustes(), produto: tarefa.dados.produto || usavel?.product_id || '', campanha: tarefa.dados.campanha, valor: usavel });
    if (usavel && o.valor_brief_id) await this.valor.vinculaOferta(usavel.brief_id, o.id);
    if (o.estado === 'sem_catalogo') return o.erro;
    if (o.estado === 'aprovada') {
      await this.enviaOferta(o.id);
      return `oferta ${o.id} aprovada pela nota e enviada ao vendedor`;
    }
    const v = o.versoes[o.escolhida];
    return `oferta ${o.id} pronta (${o.versoes.length} versões, nota ${v.score}${v.revisar ? ', para revisão' : ''}): esperando a sua aprovação`;
  }

  /**
   * "Enviar ao vendedor": grava o retrato aprovado no cliente e põe o
   * primeiro contato na fila (com os freios de sempre). Só oferta aprovada.
   */
  async enviaOferta(id) {
    const arq = await this.arquiteto();
    const o = arq.acha(id);
    if (!o) throw new Error('Oferta não encontrada.');
    if (!await this.acha(o.lead_id)) throw new Error('O cliente desta oferta não existe mais.');
    const retrato = await arq.enviada(id);
    // O Value Brief da oferta vai junto: aprovar a oferta aprova o valor que ela usou.
    let retratoDeValor = null;
    const brief = o.valor_brief_id ? this.valor.acha(o.valor_brief_id) : null;
    if (brief && !['bloqueado', 'substituido', 'rejeitado', 'falhou'].includes(brief.estado)) {
      if (brief.estado === 'gerado') await this.valor.aprova(brief.brief_id, 'com a oferta');
      retratoDeValor = await this.valor.enviaAoVendedor(brief.brief_id);
    }
    const lead = await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === o.lead_id);
      if (atual) { atual.oferta_aprovada = retrato; if (retratoDeValor) atual.value_brief = retratoDeValor; }
      return atual;
    });
    let fila = null;
    if (lead && lead.estagio === 'aguardando_voce' && !lead.abordado_em && !pediuParaParar(lead)) {
      fila = await this.poeNaFilaDeAbordagem(lead);
    }
    return {
      enviada: true,
      fila: Boolean(fila),
      aviso: fila || lead?.abordado_em ? '' : 'Oferta no cliente. O primeiro contato sai quando a operação estiver ligada, ou pelo "Liberar" em Hoje.',
    };
  }

  /** Gerar oferta para quem está esperando o primeiro contato e ainda não tem. */
  async ofertasParaQuemEspera() {
    const arq = await this.arquiteto();
    const leads = (this.dados.tudo().leads || []).filter((l) => l.estagio === 'aguardando_voce' && !l.abordado_em
      && !l.oferta_aprovada && !pediuParaParar(l) && !arq.pendenteDe(l.id));
    for (const l of leads) await this.pedeOferta(l);
    return { postas: leads.length };
  }

  /**
   * O apoio do Value Intelligence para a última fala do dono. Se ainda não
   * chegou, pede (tarefa value.assist) e adia esta resposta por alguns
   * segundos — sem gastar tentativa. Passado um minuto sem resposta (agente
   * pausado, por exemplo), o vendedor segue sem o apoio: venda não trava.
   */
  async _apoioDeValor(lead) {
    if (!this._comValor()) return null;
    const ultima = [...(lead.conversa || [])].reverse().find((m) => m?.quem === 'dono' && m.texto && !String(m.texto).startsWith('[foto'));
    const categoria = ultima ? categoriaDaPergunta(ultima.texto) : null;
    if (!categoria) return null;
    const para = Number(ultima.quando) || (lead.conversa || []).indexOf(ultima);
    const pronto = lead.value_assist?.[categoria];
    if (pronto && pronto.para === para) return pronto;
    const pedido = lead.value_assist_pedido;
    if (pedido?.para === para && pedido.categoria === categoria) {
      if (agora() - pedido.em > 60_000) return null;
    } else {
      await this.pedeValor(lead, { tipo: TAREFAS_DE_VALOR.assistencia, pergunta: ultima.texto, para, categoria });
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === lead.id);
        if (atual) atual.value_assist_pedido = { categoria, para, em: agora() };
      });
    }
    const e = new Error(`esperando o Value Intelligence (${categoria})`);
    e.adiarPor = 6000;
    throw e;
  }

  /* ══ O VENDEDOR ═════════════════════════════════════════════ */
  async _vendedor(tarefa) {
    const lead = await this.acha(tarefa.dados.leadId);
    if (!lead) return 'cliente não existe mais';
    if (pediuParaParar(lead) && tarefa.tipo !== 'encerrar') return 'cliente pediu para parar';
    if (projetoParado(lead)) return 'projeto encerrado: os agentes não trabalham mais nele';

    const ajustes = this.ajustes();
    // Até onde ele LEU. Tudo o que chegar daqui para a frente,
    // enquanto ele escreve e envia, continua sem resposta — e é isso
    // que faz o observador pôr outra tarefa em vez de dar o assunto
    // por encerrado.
    const lidoAte = (lead.conversa || []).length;
    const base = {
      lead,
      lidoAte,
      historico: lead.conversa || [],
      autor: ajustes.autor,
      // Os ajustes inteiros: a oferta é montada POR CLIENTE, porque
      // depende do ramo dele (quem vende comida vê o cardápio
      // digital também).
      ajustes,
      preco: ajustes.preco,
      mensalidade: ajustes.mensalidade,
      prazo: ajustes.prazo,
      vagas: ajustes.vagas,
      // Demo expirada saiu do ar: nem o link nem a data valem mais.
      link: lead.sites?.demo?.expirada ? '' : lead.sites?.demo?.url,
      // O site final é o .com.br assim que ele está no ar; antes, o link da Netlify.
      linkFinal: lead.dominio?.estado === 'no_ar' ? `https://${lead.dominio.escolhido}` : lead.sites?.oficial?.url,
      expira: lead.sites?.demo?.expirada ? '' : lead.sites?.demo?.expira_texto,
    };

    switch (tarefa.tipo) {
      case 'abordar': return this._abordar(lead, { ...base, manual: tarefa.dados.manual === true });
      case 'lembrar': return this._lembrar(lead, base, tarefa.dados.qual);
      case 'responder': return this._responder(lead, base);
      case 'passar': return this._passar(lead, base);
      case 'avisar_demo': return this._avisarDemo(lead, base, tarefa);
      case 'avisar_entrega': return this._avisarEntrega(lead, base, tarefa);
      case 'avisar_alteracao': return this._avisarAlteracao(lead, base, tarefa);
      case 'pedir_detalhe': return this._pedeDetalhe(lead, base, tarefa);
      case 'pedir_dominio': return this._pedeDominio(lead, base, tarefa);
      case 'cobrar': return this._cobra(lead, base, tarefa);
      case 'relatorio': return this._relatorio(lead, base, tarefa);
      default: return `não sei fazer "${tarefa.tipo}"`;
    }
  }

  async _abordar(lead, base) {
    // Abordado é abordado. Com a operação ligada, a mesma tarefa pode
    // voltar à caixa esperando a vez; sem esta linha, o negócio
    // receberia o primeiro contato duas vezes.
    if (lead.abordado_em) return 'já tinha sido abordado';

    // Nenhuma oferta vai para o cliente antes da aprovação: sem a proposta
    // aprovada, o primeiro contato espera (e a oferta é pedida, se faltar).
    // Liberado por você no botão, a decisão já foi sua.
    if (this._comOfertas() && !lead.oferta_aprovada && !base.manual) {
      if (!this.ofertas.pendenteDe(lead.id)) await this.pedeOferta(lead);
      return 'esperando a oferta ser aprovada';
    }

    // Liberado por você, no botão: a decisão já foi sua, e a operação
    // não precisa estar ligada (antes o botão não fazia nada).
    if (this.operacao && !base.manual) {
      const leads = this.dados.tudo().leads || [];
      const permissao = this.operacao.podeAbordar(leads);
      if (!permissao.pode) return `não abordado: ${permissao.motivo}`;

      // Ainda não é a vez dele: volta para a caixa com a hora certa.
      // Não é falha — é fila.
      const espera = this.operacao.esperaDaVez(leads);
      if (espera > 0) {
        await this.mural.poe('vendedor', 'abordar',
          { leadId: lead.id, nome: lead.nome },
          { chave: `vendedor:abordar:${lead.id}:${agora()}`, prioridade: 4, espera });
        return `aguardando a vez (${Math.ceil(espera / 1000)}s)`;
      }
    }

    // O teste A/B do primeiro contato: metade abre de um jeito, metade do outro.
    const variante = this.ajustes().testeAB === false ? 'A' : (lead.variante || varianteDe(lead.id));
    const saida = await conversa({ estagio: variante === 'B' ? 'abordagem_b' : 'abordagem', ...base, historico: [] });
    if (!saida.pode_enviar) return this._retem(lead, saida);
    if (!await this._manda(lead, saida.mensagem, base.lidoAte, saida.motor)) {
      throw new Error('o WhatsApp não enviou agora');
    }
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (!atual) return;
      if (atual.estagio === 'aguardando_voce') atual.estagio = 'abordado';
      // O carimbo do primeiro contato: é dele que saem a conta do dia
      // e o espaçamento. Fica no cliente, não num contador à parte,
      // para continuar valendo depois de reiniciar.
      atual.abordado_em = agora();
      atual.variante = variante;
    });
    return `primeiro contato enviado (abertura ${variante})`;
  }

  async _responder(lead, base) {
    const momento = momentoDo(lead);
    // A objeção do dono ("já tenho Instagram", "tá caro", "aumenta as vendas?") vai para o Value Intelligence,
    // pela fila; a resposta dele volta para o cliente e o vendedor escreve com ela.
    base.apoio_de_valor = await this._apoioDeValor(lead);
    // UMA mensagem por resposta. Antes eram até três seguidas (a
    // resposta, a tabela de preço e o "obrigado por fechar"), todas
    // repetindo o mesmo valor.
    const saida = await conversa({ estagio: momento, ...base });

    // A recusa vem antes de qualquer outra coisa.
    if (saida.intencao === 'recusou') {
      const adeus = await conversa({ estagio: 'encerrar', ...base });
      if (adeus.pode_enviar) await this._manda(lead, adeus.mensagem, base.lidoAte, adeus.motor);
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === lead.id);
        if (atual) { atual.estagio = 'perdido'; atual.nao_perturbe = true; }
      });
      return 'pediu para parar — encerrado e marcado';
    }

    if (!saida.pode_enviar) return this._retem(lead, saida);
    if (!await this._manda(lead, saida.mensagem, base.lidoAte, saida.motor)) throw new Error('o WhatsApp não enviou agora');

    // Pediu para falar com gente: a conversa segue, mas você é avisado.
    if (saida.intencao === 'quer_ligacao') {
      await this._chamaVoce(lead, 'pediu para falar com você (ligação)');
      return 'pediu ligação — avisado no painel';
    }

    // Topou a demo: põe na caixa do estúdio e já sai daqui. Não
    // espera o site ficar pronto — isso é trabalho de outro setor.
    if (saida.intencao === 'aceitou_demo' && momento === 'antes_da_demo') {
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === lead.id);
        if (atual) atual.estagio = 'fazendo_demo';
      });
      await this.mural.poe('estudio', 'fazer_site',
        { leadId: lead.id, nome: lead.nome, versao: 'demo' },
        { chave: `estudio:fazer_site:${lead.id}`, prioridade: 3 });
      return 'topou a demo — tarefa posta na caixa do estúdio';
    }

    // FECHOU — e o `decideIntencao` só deixa chegar aqui quem já viu a
    // demonstração e já sabe o preço. A mensagem que acabou de sair já
    // confirmou a opção, o valor e o próximo passo: não sai outra.
    if (saida.intencao === 'fechou') {
      // Restaurante: o oficial espera o cardápio de hoje. A mensagem que saiu
      // já pediu a foto; quando ela chegar, o estúdio lê e você confere.
      const esperaCardapio = this._deComida(lead) && !lead.cardapio?.conferido;
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === lead.id);
        if (!atual) return;
        atual.estagio = 'com_voce';
        // A VENDA. É este carimbo que a meta do dia conta.
        atual.vendeu_em = atual.vendeu_em || agora();
        // O que ele escolheu: o site completo ou só o cardápio digital.
        atual.produto = saida.produto || atual.produto || 'site';
        atual.avisos = atual.avisos || [];
        atual.avisos.push({ tipo: 'sua_vez', quando: agora() });
        if (esperaCardapio && !(atual.pendencias || []).some((p) => p.tipo === 'cardapio')) {
          atual.pendencias = [...(atual.pendencias || []),
            { tipo: 'cardapio', texto: 'Conferir o cardápio antes do oficial (o cliente manda a foto pelo WhatsApp)', feito: false }];
        }
      });
      // O oficial começa sozinho: o estúdio tira a faixa da demo e faz os
      // pedidos dele. Você confere no painel antes de ir ao ar.
      if (!esperaCardapio) {
        await this.mural.poe('estudio', 'fazer_oficial', { leadId: lead.id, nome: lead.nome },
          { chave: `estudio:fazer_oficial:${lead.id}`, prioridade: 2 });
      }
      // O endereço .com.br do site final: o agente do domínio procura nomes
      // livres, e o vendedor pergunta ao cliente qual ele prefere.
      if (!lead.dominio) {
        await this.mural.poe('dominio', 'sugerir', { leadId: lead.id, nome: lead.nome },
          { chave: `dominio:sugerir:${lead.id}`, prioridade: 2 });
      }
      this.diz(`  ⚑ ${lead.nome} FECHOU (${saida.produto === 'cardapio' ? 'cardápio digital' : 'site'})${esperaCardapio ? ' — esperando a foto do cardápio' : ' — é a sua vez de fazer o site final'}`);
      // Bateu a meta? Então para de caçar e de abordar AGORA.
      await this._confereAMeta();
      return 'fechou — confirmado na mesma mensagem e passado para você';
    }

    // Escolheu (ou sugeriu) o nome do endereço: o agente do domínio confere se está livre.
    // "Pode ser o fornodepedra" não é pedido de mudança no site: é o endereço.
    if (saida.dominio && lead.dominio && !['ligando', 'no_ar'].includes(lead.dominio.estado)) {
      await this.mural.poe('dominio', 'escolha', { leadId: lead.id, nome: lead.nome, dominio: saida.dominio },
        { chave: `dominio:escolha:${lead.id}:${saida.dominio}`, prioridade: 1 });
      if (!['aprovou', 'quer_ligacao'].includes(saida.intencao)) return `escolheu o endereço: ${saida.dominio}`;
    }

    // Pediu mudança no site. Já no ar: o estúdio altera e republica. Ainda
    // não: fica anotado para entrar no oficial.
    if (saida.intencao === 'pediu_alteracao') {
      // O pedido vai com o fim da conversa: "brigadeiro R$ 12" só faz
      // sentido junto de "quais sobremesas entram?".
      const pedido = (lead.conversa || []).slice(0, base.lidoAte).slice(-4)
        .map((m) => `${m.quem === 'dono' ? 'dono' : 'nós'}: ${texto(m.texto, 300)}`).join(' / ');
      if (lead.sites?.oficial?.url) {
        await this.mural.poe('estudio', 'alterar', { leadId: lead.id, nome: lead.nome, pedido },
          { chave: `estudio:alterar:${lead.id}:${(lead.conversa || []).length}`, prioridade: 2 });
        return 'pediu alteração — na caixa do estúdio';
      }
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === lead.id);
        if (atual) atual.pedidos = [...(atual.pedidos || []), pedido].slice(-12);
      });
      return 'pediu alteração — anotada para o site oficial';
    }

    // Disse que pagou: quem confere o Pix é você.
    if (saida.intencao === 'pagou') {
      await this._chamaVoce(lead, 'disse que pagou: confira o Pix e marque "Pagou" em Mensalidades');
      return 'disse que pagou — você confere';
    }

    // APROVOU o site oficial: só agora o pagamento (o combinado é "só paga
    // se aprovar"). A mensagem que saiu já levou os dados; você confere.
    if (saida.intencao === 'aprovou' && lead.estagio === 'entregue' && !lead.aprovado_em) {
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === lead.id);
        if (!atual) return;
        atual.aprovado_em = agora();
        atual.pendencias = [
          ...(atual.pendencias || []),
          { tipo: 'pix', texto: 'Confirmar o Pix do valor de fazer', feito: false },
          ...(atual.produto === 'cardapio'
            ? [{ tipo: 'qr', texto: 'Imprimir a plaquinha com o QR Code do cardápio e mandar ao cliente', feito: false },
              { tipo: 'google', texto: 'Pôr o link do cardápio na ficha do Google do cliente', feito: false }]
            : [{ tipo: 'google', texto: 'Pôr o site na ficha do Google do cliente', feito: false }]),
        ];
      });
      await this._chamaVoce(lead, (this.ajustes().chavePix || '').trim()
        ? 'aprovou o site: confira se o Pix caiu' : 'aprovou o site: mande a chave Pix');
      return 'aprovou o site — pagamento pedido';
    }

    return `respondeu (${saida.intencao})`;
  }

  /** Um lembrete curto, para quem ficou calado. Registrado no cliente: não repete. */
  async _lembrar(lead, base, qual) {
    const estagio = { sem_resposta: 'lembrete_sem_resposta', demo: 'lembrete_demo', expira: 'lembrete_expira' }[qual];
    if (!estagio) return `lembrete desconhecido: ${qual}`;
    // Entre pôr a tarefa e pegar, ele pode ter respondido.
    const conversaAgora = lead.conversa || [];
    if (conversaAgora[conversaAgora.length - 1]?.quem === 'dono') return 'ele respondeu antes — lembrete cancelado';
    const saida = await conversa({ estagio, ...base });
    const anota = (extra = {}) => this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (!atual) return;
      atual.lembretes = atual.lembretes || [];
      atual.lembretes.push({ qual, quando: agora(), ...extra });
    });
    // Segurado também conta como "já teve": senão ele voltaria a cada volta.
    if (!saida.pode_enviar) { await anota({ segurado: true }); return this._retem(lead, saida); }
    if (!await this._manda(lead, saida.mensagem, undefined, saida.motor)) throw new Error('o WhatsApp não enviou agora');
    await anota();
    return `lembrete enviado (${qual})`;
  }

  /** Marca no cliente que ele precisa de você; o painel mostra em "Precisa de você". */
  async _chamaVoce(lead, motivo) {
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (atual) atual.precisa_voce = { motivo, quando: agora() };
    });
    this.diz(`  ☎ ${lead.nome}: ${motivo}`);
  }

  /** A meta fechou? Então a caçada e as abordagens param aqui. */
  async _confereAMeta() {
    if (!this.operacao?.ligada) return false;
    const estado = this.operacao.estado(this.dados.tudo().leads || []);
    if (!estado.batida) return false;
    await this.operacao.para(`meta de ${estado.meta.vendas} venda(s) batida`);
    this.diz(`  ★ META BATIDA — ${estado.hoje.vendas} venda(s) hoje. `
      + 'Parei de caçar e de abordar; as conversas abertas continuam.');
    return true;
  }

  async _passar(lead, base) {
    const saida = await conversa({ estagio: 'passando_ao_programador', ...base });
    if (saida.pode_enviar) await this._manda(lead, saida.mensagem, undefined, saida.motor);
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (!atual) return;
      atual.estagio = 'com_voce';
      // Fechado à mão no painel também é venda, e conta na meta.
      atual.vendeu_em = atual.vendeu_em || agora();
      atual.avisos = atual.avisos || [];
      atual.avisos.push({ tipo: 'sua_vez', quando: agora() });
    });
    this.diz(`  ⚑ ${lead.nome} FECHOU — é a sua vez de fazer o site final`);
    await this._confereAMeta();
    return 'passado para você';
  }

  async _avisarDemo(lead, base, tarefa) {
    const saida = await conversa({
      estagio: 'demo_enviada', ...base, link: tarefa.dados.url || base.link,
    });
    if (!saida.pode_enviar) return this._retem(lead, saida);
    if (!await this._manda(lead, saida.mensagem, undefined, saida.motor)) throw new Error('o WhatsApp não enviou agora');
    // Daqui conta o prazo do lembrete da demonstração.
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (atual?.sites?.demo) atual.sites.demo.avisado_em = agora();
    });
    return 'link da demonstração enviado';
  }

  async _avisarEntrega(lead, base, tarefa) {
    const saida = await conversa({
      estagio: 'entrega', ...base, linkFinal: tarefa.dados.url || base.linkFinal,
    });
    if (!saida.pode_enviar) return this._retem(lead, saida);
    if (!await this._manda(lead, saida.mensagem, undefined, saida.motor)) throw new Error('o WhatsApp não enviou agora');
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (atual) atual.estagio = 'entregue';
    });
    return 'site final entregue e mensalidade repetida';
  }

  async _avisarAlteracao(lead, base, tarefa) {
    const saida = await conversa({
      estagio: 'alteracao_feita', ...base, linkFinal: tarefa.dados.url || base.linkFinal, pedido: tarefa.dados.pedido,
    });
    if (!saida.pode_enviar) return this._retem(lead, saida);
    if (!await this._manda(lead, saida.mensagem, undefined, saida.motor)) throw new Error('o WhatsApp não enviou agora');
    return 'cliente avisado da alteração';
  }

  /** A mensalidade: no dia do vencimento, e um lembrete 3 dias depois. Uma vez cada. */
  async _cobra(lead, base, tarefa) {
    const { qual, mes } = tarefa.dados;
    const m = lead.mensalidade || {};
    if ((m.pagos || []).includes(mes)) return 'já pagou';
    if (((m.avisos || {})[mes] || {})[qual]) return 'já avisado';
    const valor = valorDaMensalidade(lead, base.ajustes);
    if (!valor) return 'sem valor de mensalidade no painel';
    const saida = await conversa({ estagio: qual === 'atraso' ? 'cobranca_atraso' : 'cobranca_vencimento', ...base,
      mensalidade: { valor, mes: nomeDoMes(mes) } });
    const anota = () => this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (!atual) return;
      atual.mensalidade = atual.mensalidade || {};
      atual.mensalidade.avisos = atual.mensalidade.avisos || {};
      atual.mensalidade.avisos[mes] = { ...(atual.mensalidade.avisos[mes] || {}), [qual]: agora() };
    });
    if (!saida.pode_enviar) { await anota(); return this._retem(lead, saida); }
    if (!await this._manda(lead, saida.mensagem, undefined, saida.motor)) throw new Error('o WhatsApp não enviou agora');
    await anota();
    return `mensalidade de ${nomeDoMes(mes)}: ${qual === 'atraso' ? 'lembrete' : 'aviso do vencimento'} enviado`;
  }

  /** O relatório do mês que passou: cliques, mudanças e cardápio. */
  async _relatorio(lead, base, tarefa) {
    const { mes } = tarefa.dados;
    if ((lead.relatorios || []).some((r) => r.mes === mes)) return 'já enviado';
    const cliques = await contaCliques(lead.sites?.oficial?.site_id, mes);
    const doMes = (ts) => Boolean(ts) && mesDe(ts) === mes;
    const relatorio = {
      mes: nomeDoMes(mes),
      cliques_no_whatsapp: cliques,
      alteracoes_feitas: (lead.alteracoes_feitas || []).filter((a) => doMes(a.quando)).length,
      cardapio_atualizado_em: lead.cardapio?.conferido_em && doMes(lead.cardapio.conferido_em)
        ? new Date(lead.cardapio.conferido_em).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : null,
    };
    const saida = await conversa({ estagio: 'relatorio', ...base, relatorio });
    const anota = (extra = {}) => this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (atual) atual.relatorios = [...(atual.relatorios || []), { mes, quando: agora(), ...relatorio, ...extra }].slice(-24);
    });
    if (!saida.pode_enviar) { await anota({ segurado: true }); return this._retem(lead, saida); }
    if (!await this._manda(lead, saida.mensagem, undefined, saida.motor)) throw new Error('o WhatsApp não enviou agora');
    await anota();
    return `relatório de ${relatorio.mes} enviado (${cliques ?? 'sem contagem de'} cliques)`;
  }

  /** Os nomes livres para o endereço: ele escolhe um, ou diz outro. */
  async _pedeDominio(lead, base, tarefa) {
    const saida = await conversa({ estagio: 'dominio', ...base, ocupado: tarefa.dados.ocupado || '' });
    if (!saida.pode_enviar) return this._retem(lead, saida);
    if (!await this._manda(lead, saida.mensagem, undefined, saida.motor)) throw new Error('o WhatsApp não enviou agora');
    return 'nomes do endereço enviados ao cliente';
  }

  async _pedeDetalhe(lead, base, tarefa) {
    const saida = await conversa({
      estagio: 'alteracao_precisa', ...base, pedido: `${tarefa.dados.pedido} — o que falta: ${tarefa.dados.motivo}`,
    });
    if (!saida.pode_enviar) return this._retem(lead, saida);
    if (!await this._manda(lead, saida.mensagem, undefined, saida.motor)) throw new Error('o WhatsApp não enviou agora');
    return 'pediu ao cliente o detalhe que faltava';
  }

  /** Mensagem reprovada duas vezes NÃO sai. Fica para você olhar. */
  async _retem(lead, saida) {
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (atual) {
        // `ate`: até onde a conversa estava. Sem fala nova do dono, o
        // observador não pede outra resposta para a mesma coisa.
        atual.revisar = { mensagem: saida.mensagem, problemas: saida.revisar, quando: agora(),
          ate: (atual.conversa || []).length };
      }
    });
    return `retida para você revisar (${(saida.revisar || []).join(', ')})`;
  }

  /* ══ O ESTÚDIO ══════════════════════════════════════════════ */
  async _estudio(tarefa) {
    const lead = await this.acha(tarefa.dados.leadId);
    if (!lead) return 'cliente não existe mais';
    if (pediuParaParar(lead)) return 'cliente pediu para parar';
    const ajustes = this.ajustes();

    // O OFICIAL: a demo aprovada, sem faixa e com os pedidos dele. Fica
    // como rascunho para você conferir no painel antes de ir ao ar.
    // A FOTO DO CARDÁPIO que o cliente mandou pelo WhatsApp: o estúdio lê,
    // e você confere no painel antes de o oficial ser feito.
    if (tarefa.tipo === 'ler_cardapio') {
      const pasta = join(this.pastaTrabalho, apelido(lead.nome, lead.id));
      const sub = '_cardapio_whatsapp';
      await rm(join(pasta, sub), { recursive: true, force: true });
      await mkdir(join(pasta, sub), { recursive: true });
      const fotos = [];
      for (const [n, r] of (lead.recebidas || []).slice(-8).entries()) {
        const nome = `${String(n + 1).padStart(2, '0')}-whatsapp.${String(r.arquivo).split('.').pop()}`;
        try { await copyFile(r.arquivo, join(pasta, sub, nome)); } catch { continue; }
        fotos.push({ arquivo: `${sub}/${nome}`, origem: 'whatsapp', dica: 'mandada pelo dono no WhatsApp', caminho: r.arquivo });
      }
      if (!fotos.length) return 'as fotos recebidas sumiram da pasta';
      const lido = await leCardapio(lead, pasta, fotos, { subpasta: sub });
      if (!lido.itens.length) {
        await this._chamaVoce(lead, 'mandou foto pelo WhatsApp, mas o estúdio não achou cardápio nela: confira');
        return 'foto recebida, mas sem cardápio';
      }
      await this._guardaCardapio(lead.id, lido, fotos, 'whatsapp');
      await this._chamaVoce(lead, `mandou o cardápio (${lido.itens.length} itens lidos): confira em "Conferir cardápio"`);
      return `cardápio lido da foto do cliente: ${lido.itens.length} itens`;
    }

    if (tarefa.tipo === 'fazer_oficial') {
      // Só o cardápio digital: feito do zero, com a cara da demonstração.
      if (lead.produto === 'cardapio') {
        const feito = await fazCardapio(lead, {
          autor: ajustes.autor, ajustes, pastaTrabalho: this.pastaTrabalho, pastaDados: dirname(this.pastaTrabalho), diz: this.diz,
        });
        await this.comOsDados(async (tudo) => {
          const atual = (tudo.leads || []).find((l) => l.id === lead.id);
          if (!atual) return;
          atual.sites = atual.sites || {};
          atual.sites.rascunho_oficial = { caminho: feito.caminho, quando: agora() };
        });
        return 'cardápio digital pronto — esperando você conferir no painel';
      }
      // O site completo: a demo vira o oficial, com o cardápio que você conferiu.
      const pedidos = [...(lead.pedidos || [])];
      if (lead.cardapio?.conferido && lead.cardapio.itens?.length) {
        pedidos.push(`Troque o cardápio do site por exatamente esta lista (categorias com #, item | descrição | preço), \
sem a linha sobre os preços das fotos publicadas:\n${cardapioEmTexto(lead.cardapio.itens)}`);
      }
      const feito = await fazOficial(lead, { pastaTrabalho: this.pastaTrabalho, pedidos });
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === lead.id);
        if (!atual) return;
        atual.sites = atual.sites || {};
        atual.sites.rascunho_oficial = { caminho: feito.caminho, quando: agora() };
      });
      return 'site oficial pronto — esperando você conferir no painel';
    }

    // UMA ALTERAÇÃO pedida pelo WhatsApp, no site que já está no ar.
    if (tarefa.tipo === 'alterar') {
      const r = await alteraSite(lead, tarefa.dados.pedido, { pastaTrabalho: this.pastaTrabalho });
      if (!r.feito) {
        // Faltou dado (o estúdio não inventa): o vendedor pergunta ao
        // cliente o que falta, em vez de deixar o pedido parado.
        await this.mural.poe('vendedor', 'pedir_detalhe',
          { leadId: lead.id, nome: lead.nome, pedido: tarefa.dados.pedido, motivo: r.motivo },
          { chave: `vendedor:pedir_detalhe:${lead.id}:${agora()}`, prioridade: 1 });
        return `alteração precisa de detalhe: ${r.motivo}`;
      }
      await this.mural.poe('publicador', 'publicar', {
        leadId: lead.id, nome: lead.nome, versao: 'oficial', caminho: r.caminho, alteracao: tarefa.dados.pedido,
      }, { chave: `publicador:publicar:${lead.id}:alteracao:${agora()}`, prioridade: 1 });
      return 'alteração feita — na caixa do publicador';
    }

    // RESTAURANTE: antes da demo, procura o cardápio nas fotos do Maps e do
    // Instagram dele. Sem foto de cardápio, a demo sai como antes.
    let paraFazer = lead;
    if (this._deComida(lead) && !lead.cardapio) {
      try {
        const pasta = join(this.pastaTrabalho, apelido(lead.nome, lead.id));
        await rm(join(pasta, '_cardapio'), { recursive: true, force: true });
        const fotos = await buscaFotosDoCardapio(lead, pasta, { diz: this.diz });
        const lido = await leCardapio(lead, pasta, fotos);
        paraFazer = { ...lead, cardapio: await this._guardaCardapio(lead.id, lido, fotos.map((f) => ({ ...f, caminho: join(pasta, f.arquivo) })), 'fotos') };
        this.diz(`  ▤ ${lead.nome}: ${lido.itens.length} itens de cardápio lidos das fotos`);
      } catch (e) {
        if (e.limite || e.naoConectado) throw e;
        this.diz(`  · ${lead.nome}: cardápio não lido (${texto(e.message, 120)}) — a demo sai sem a lista`);
      }
    }

    const feito = await fazSite(paraFazer, {
      autor: ajustes.autor, ajustes, pastaTrabalho: this.pastaTrabalho,
      // Os prints de referência ficam em dados/referencias, ao lado de dados/sites.
      pastaDados: dirname(this.pastaTrabalho), diz: this.diz,
    });
    if (feito.promptMaster) this.diz(`  ▣ ${lead.nome}: feito pelo prompt master${feito.instagram ? ', com o print do Instagram' : ' (sem Instagram)'} (${feito.promptMaster})`);
    const { html, consertos } = enderecaDemo(feito.html, { autor: ajustes.autor });
    await writeFile(feito.caminho, html, 'utf8');

    // Põe na caixa do publicador e vai embora. O HTML não viaja na
    // tarefa — viaja o CAMINHO do arquivo, senão o mural engordaria
    // uns 10 KB por site.
    await this.mural.poe('publicador', 'publicar', {
      leadId: lead.id, nome: lead.nome, versao: 'demo',
      caminho: feito.caminho, consertos,
    }, { chave: `publicador:publicar:${lead.id}:demo`, prioridade: 2 });

    return `site montado em ${feito.segundos}s — na caixa do publicador`;
  }

  /* ══ O PUBLICADOR ═══════════════════════════════════════════ */
  async _publicador(tarefa) {
    const lead = await this.acha(tarefa.dados.leadId);
    if (!lead) return 'cliente não existe mais';
    // Pediu para parar enquanto o site era montado: não vai ao ar.
    if (pediuParaParar(lead)) return 'cliente pediu para parar — não publicado';

    const { readFile } = await import('node:fs/promises');
    const html = await readFile(tarefa.dados.caminho, 'utf8');
    const versao = tarefa.dados.versao === 'oficial' ? 'oficial' : 'demo';

    const publicado = await this.publica(lead, html, versao);
    const ajustes = this.ajustes();

    let expiraTexto = null;
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (!atual) return;
      atual.sites = atual.sites || {};

      if (versao === 'demo') {
        const dias = Math.max(1, Number(ajustes.diasDaPrevia) || 7);
        const expiraEm = agora() + dias * 24 * 60 * 60 * 1000;
        // "terça-feira, 28/10": é assim que se fala de uma data numa conversa.
        expiraTexto = new Date(expiraEm).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit' });
        atual.sites.demo = {
          url: publicado.url, site_id: publicado.site_id, quando: agora(),
          expira_em: expiraEm, expira_texto: expiraTexto,
          consertos: tarefa.dados.consertos || [],
        };
        if (['fazendo_demo', 'conversando', 'abordado'].includes(atual.estagio)) atual.estagio = 'demo_no_ar';
      } else {
        atual.sites.oficial = {
          url: publicado.url, site_id: publicado.site_id, quando: agora(),
        };
      }
    });

    // E põe na caixa do vendedor para avisar o cliente.
    if (tarefa.dados.alteracao) {
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === lead.id);
        if (atual) atual.alteracoes_feitas = [...(atual.alteracoes_feitas || []), { quando: agora(), pedido: texto(tarefa.dados.alteracao, 200) }].slice(-60);
      });
      await this.mural.poe('vendedor', 'avisar_alteracao',
        { leadId: lead.id, nome: lead.nome, url: publicado.url, pedido: tarefa.dados.alteracao },
        { chave: `vendedor:avisar_alteracao:${lead.id}:${agora()}`, prioridade: 1 });
      return `alteração no ar: ${publicado.url}`;
    }
    if (versao === 'oficial') {
      // Domínio já comprado: liga agora, com o site oficial existindo na Netlify.
      const dom = (await this.acha(lead.id))?.dominio;
      if (dom?.estado === 'ligando' && !dom.ligado_em) await this._ligaODominio(lead.id);
      // O SITE FINAL VAI COM O .com.br. Enquanto ele não estiver no ar, a
      // entrega espera; o agente do domínio solta quando conferir.
      if (dom?.estado !== 'no_ar' && !lead.entregar_sem_dominio) {
        await this.comOsDados(async (tudo) => {
          const atual = (tudo.leads || []).find((l) => l.id === lead.id);
          if (atual) atual.entrega_espera_dominio = true;
        });
        return `oficial publicado (${publicado.url}) — a entrega espera o .com.br ficar no ar`;
      }
    }
    const url = versao === 'oficial' && lead.dominio?.estado === 'no_ar' ? `https://${lead.dominio.escolhido}` : publicado.url;
    await this.mural.poe('vendedor',
      versao === 'demo' ? 'avisar_demo' : 'avisar_entrega',
      { leadId: lead.id, nome: lead.nome, url },
      { chave: `vendedor:avisar:${lead.id}:${versao}`, prioridade: 1 });

    return `no ar: ${url}`;
  }

  /** Grava o cardápio lido no cliente; só as fotos que eram cardápio ficam anotadas. */
  async _guardaCardapio(leadId, lido, fotos, fonte) {
    const usadas = new Set(lido.fotos_de_cardapio || []);
    const cardapio = {
      itens: lido.itens,
      fonte,
      observacao: lido.observacao || '',
      lido_em: agora(),
      conferido: false,
      fotos: fotos.filter((f) => !usadas.size || usadas.has(String(f.arquivo).split('/').pop()))
        .map((f) => ({ caminho: f.caminho, origem: f.origem })).slice(0, 8),
    };
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === leadId);
      if (atual) atual.cardapio = cardapio;
    });
    return cardapio;
  }

  /**
   * O SEU OK NO CARDÁPIO: a lista que você conferiu (e corrigiu) no painel
   * passa a valer. Se a venda já aconteceu, o oficial começa; se o cardápio
   * já está no ar, vira uma alteração.
   */
  async confereCardapio(leadId, bruto) {
    const itens = textoEmCardapio(bruto);
    if (!itens.length) throw new Error('A lista está vazia. Uma linha por item: nome | descrição | preço.');
    const lead = await this.acha(leadId);
    if (!lead) throw new Error('Não achei esse cliente.');
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === leadId);
      if (!atual) return;
      atual.cardapio = { ...(atual.cardapio || {}), itens, conferido: true, conferido_em: agora() };
      for (const p of atual.pendencias || []) if (p.tipo === 'cardapio') p.feito = true;
      if (atual.precisa_voce && /card[áa]pio/i.test(atual.precisa_voce.motivo || '')) atual.precisa_voce = null;
    });
    if (lead.sites?.oficial?.url) {
      await this.mural.poe('estudio', 'alterar', { leadId, nome: lead.nome,
        pedido: `Troque o cardápio por exatamente esta lista (categorias com #, item | descrição | preço):\n${cardapioEmTexto(itens)}` },
      { chave: `estudio:alterar:${leadId}:cardapio:${agora()}`, prioridade: 1 });
      return { itens: itens.length, proximo: 'o estúdio troca o cardápio no ar e o vendedor avisa o cliente' };
    }
    if (lead.vendeu_em) {
      await this.mural.poe('estudio', 'fazer_oficial', { leadId, nome: lead.nome },
        { chave: `estudio:fazer_oficial:${leadId}:${agora()}`, prioridade: 1 });
      return { itens: itens.length, proximo: 'o estúdio faz o oficial com este cardápio' };
    }
    return { itens: itens.length, proximo: 'guardado: entra no oficial quando ele fechar' };
  }

  /* ══ O DOMÍNIO ══════════════════════════════════════════════
     O endereço .com.br do site final. Sugere nomes livres, confere o que
     o cliente escolheu, liga na Netlify depois que você compra, e confere
     sozinho até o site abrir com cadeado no endereço novo.            */
  async _dominio(tarefa) {
    const lead = await this.acha(tarefa.dados.leadId);
    if (!lead) return 'cliente não existe mais';
    const grava = (mexe) => this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (atual) mexe(atual);
    });

    if (tarefa.tipo === 'sugerir') {
      if (lead.dominio) return 'já tem domínio em andamento';
      const sugestoes = await procuraLivres(lead);
      if (!sugestoes.length) {
        await this._chamaVoce(lead, 'não achei nome .com.br livre para o site: escolha um no Registro.br');
        await grava((a) => { a.dominio = { estado: 'comprar', sugestoes: [], escolhido: '' }; this._pendenciaDominio(a); });
        return 'nenhum nome livre';
      }
      await grava((a) => {
        a.dominio = { estado: 'escolher', sugestoes, escolhido: sugestoes[0].dominio, desde: agora() };
        this._pendenciaDominio(a);
      });
      if (!pediuParaParar(lead)) {
        await this.mural.poe('vendedor', 'pedir_dominio', { leadId: lead.id, nome: lead.nome },
          { chave: `vendedor:pedir_dominio:${lead.id}`, prioridade: 2, espera: 90_000 });
      }
      return `sugestões: ${sugestoes.map((s) => s.dominio).join(', ')}`;
    }

    if (tarefa.tipo === 'escolha') {
      const dominio = limpaDominio(tarefa.dados.dominio);
      if (!dominioValido(dominio)) return `nome inválido: ${dominio}`;
      const livre = await estaLivre(dominio);
      if (livre === false) {
        await this.mural.poe('vendedor', 'pedir_dominio', { leadId: lead.id, nome: lead.nome, ocupado: dominio },
          { chave: `vendedor:pedir_dominio:${lead.id}:${dominio}`, prioridade: 1 });
        return `${dominio} já tem dono — o vendedor oferece os livres`;
      }
      await grava((a) => {
        a.dominio = { ...(a.dominio || {}), estado: 'comprar', escolhido: dominio, escolhido_pelo_cliente: true, livre };
        this._pendenciaDominio(a);
      });
      await this._chamaVoce(lead, `escolheu ${dominio}: compre no Registro.br (link em Depois da venda)`);
      return `escolheu ${dominio}${livre === null ? ' (não deu para conferir se está livre)' : ''}`;
    }

    if (tarefa.tipo === 'conferir') {
      const dom = lead.dominio;
      if (!dom?.escolhido || dom.estado !== 'ligando') return 'nada para conferir';
      if (!dom.ligado_em) {
        if (lead.sites?.oficial?.site_id) await this._ligaODominio(lead.id);
        return 'esperando o site oficial existir na Netlify';
      }
      const nomeNetlify = String(lead.sites?.oficial?.url || '').replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      const r = await confereNoAr(dom.escolhido, { nomeNetlify });
      if (r.dns && !r.https && !dom.cadeado_pedido) {
        await pedeCadeado(lead.sites?.oficial?.site_id);
        await grava((a) => { a.dominio.cadeado_pedido = agora(); });
      }
      if (r.dns && r.https) {
        await grava((a) => {
          a.dominio.estado = 'no_ar';
          a.dominio.no_ar_em = agora();
          a.dominio.problema = '';
          a.sites = a.sites || {};
          if (a.sites.oficial) a.sites.oficial.dominio = dom.escolhido;
        });
        const atual = await this.acha(lead.id);
        if (atual?.entrega_espera_dominio) {
          await grava((a) => { a.entrega_espera_dominio = false; });
          await this.mural.poe('vendedor', 'avisar_entrega', { leadId: lead.id, nome: lead.nome, url: `https://${dom.escolhido}` },
            { chave: `vendedor:avisar:${lead.id}:oficial`, prioridade: 1 });
        }
        this.diz(`  ◎ ${lead.nome}: https://${dom.escolhido} no ar`);
        return `${dom.escolhido} no ar, com cadeado`;
      }
      await grava((a) => { a.dominio.problema = r.detalhe; a.dominio.conferido_em = agora(); });
      // Dois dias e nada: algo no DNS está errado, e é você quem mexe nele.
      if (agora() - dom.ligado_em > 2 * DIA && !dom.avisou_atraso) {
        await grava((a) => { a.dominio.avisou_atraso = agora(); });
        await this._chamaVoce(lead, `${dom.escolhido} ainda não abre: ${r.detalhe}. Confira o DNS no Registro.br`);
      }
      return `${dom.escolhido}: ${r.detalhe || 'ainda não'}`;
    }
    return `não sei fazer "${tarefa.tipo}"`;
  }

  /** A pendência "comprar o domínio", uma só por cliente, com o nome atual. */
  _pendenciaDominio(lead) {
    lead.pendencias = lead.pendencias || [];
    const ja = lead.pendencias.find((p) => p.tipo === 'dominio' && !p.feito);
    const textoP = lead.dominio?.escolhido
      ? `Comprar ${lead.dominio.escolhido} no Registro.br, no seu nome`
      : 'Escolher e comprar o domínio .com.br no Registro.br';
    if (ja) ja.texto = textoP; else lead.pendencias.push({ tipo: 'dominio', texto: textoP, feito: false });
  }

  /** Liga o domínio comprado ao site oficial na Netlify, e guarda o que apontar no DNS. */
  async _ligaODominio(leadId) {
    const lead = await this.acha(leadId);
    if (!this.ligaDominio || !lead?.dominio?.escolhido || !lead.sites?.oficial?.site_id) return null;
    try {
      const r = await this.ligaDominio(leadId, lead.dominio.escolhido);
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === leadId);
        if (!atual?.dominio) return;
        atual.dominio.ligado_em = agora();
        atual.dominio.dns = r.dns;
      });
      return r;
    } catch (e) {
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === leadId);
        if (atual?.dominio) atual.dominio.problema = `Netlify: ${texto(e.message, 160)}`;
      });
      return null;
    }
  }

  /** O SEU "COMPREI": o domínio é seu, e o agente liga e confere daqui em diante. */
  async dominioComprado(leadId, bruto) {
    const dominio = limpaDominio(bruto);
    if (!dominioValido(dominio)) throw new Error('Escreva o domínio .com.br que você comprou, ex.: fornodepedra.com.br');
    const lead = await this.acha(leadId);
    if (!lead) throw new Error('Não achei esse cliente.');
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === leadId);
      if (!atual) return;
      atual.dominio = { ...(atual.dominio || {}), estado: 'ligando', escolhido: dominio, comprado_em: agora(), ligado_em: null, problema: '' };
      for (const p of atual.pendencias || []) if (p.tipo === 'dominio') { p.feito = true; p.texto = `Comprar ${dominio} no Registro.br, no seu nome`; }
    });
    const ligado = await this._ligaODominio(leadId);
    await this.mural.poe('dominio', 'conferir', { leadId, nome: lead.nome },
      { chave: `dominio:conferir:${leadId}:${agora()}`, prioridade: 2, espera: 60_000 });
    return {
      dominio,
      dns: ligado?.dns || [],
      proximo: ligado ? 'ligado na Netlify: agora é o DNS no Registro.br' : 'liga na Netlify assim que o site oficial for publicado',
    };
  }

  /** Entregar sem esperar o domínio (o link da Netlify vai ao cliente). Decisão sua. */
  async entregaSemDominio(leadId) {
    const lead = await this.acha(leadId);
    if (!lead?.sites?.oficial?.url) throw new Error('O site oficial ainda não foi publicado.');
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === leadId);
      if (atual) { atual.entregar_sem_dominio = true; atual.entrega_espera_dominio = false; }
    });
    await this.mural.poe('vendedor', 'avisar_entrega', { leadId, nome: lead.nome, url: lead.sites.oficial.url },
      { chave: `vendedor:avisar:${leadId}:oficial`, prioridade: 1 });
    return { posta: true };
  }

  /* ══ onde VOCÊ entra ════════════════════════════════════════ */

  /** O seu clique: libera o primeiro contato, em lote. */
  async liberaPrimeiroContato(ids = []) {
    const tudo = this.dados.tudo();
    const postas = [];
    for (const id of ids) {
      const lead = (tudo.leads || []).find((l) => l.id === id);
      if (!lead || lead.estagio !== 'aguardando_voce' || pediuParaParar(lead)) continue;
      await this.mural.poe('vendedor', 'abordar',
        { leadId: lead.id, nome: lead.nome, manual: true },
        { chave: `vendedor:abordar:${lead.id}`, prioridade: 4 });
      postas.push(lead.nome);
    }
    return {
      postas: postas.length,
      fez: postas.map((n) => `${n}: na caixa do vendedor`),
      erros: this._janela().podeFalar() ? []
        : [`Fora do horário de falar (${this._janela().descreve('falar')}). `
           + 'As mensagens saem sozinhas quando abrir.'],
    };
  }

  /**
   * O BOTÃO "FAZER DINHEIRO".
   *
   * Liga o fluxo, guarda a meta do dia e põe a primeira busca na
   * caixa do caçador. Daí em diante ninguém mais precisa de você:
   * caçador acha → vendedor aborda → cliente topa → estúdio monta →
   * publicador põe no ar → vendedor manda o link. Para quando a meta
   * fechar, quando um dos tetos do dia encher, ou quando você mandar.
   */
  async comecaOperacao(pedido = {}) {
    if (!this.operacao) throw new Error('Esta versão não tem operação.');
    if (!this.caca) throw new Error('O caçador não está disponível.');
    await this.operacao.comeca(pedido);
    await this.liga();
    await this._poeProximaBusca();
    this.diz(`  ★ operação ligada — meta de ${this.operacao.meta.vendas} venda(s) hoje`);
    return this.estado();
  }

  /**
   * Para de caçar e de abordar gente nova — e só isso.
   *
   * Quem já está conversando continua sendo respondido, e a demo de
   * quem topou continua sendo montada. Largar no meio da conversa
   * quem você mesmo abordou há dez minutos é pior do que não ter
   * abordado. Para parar TUDO, é o botão de desligar o fluxo.
   */
  async paraOperacao(motivo = 'você mandou parar') {
    if (!this.operacao) throw new Error('Esta versão não tem operação.');
    await this.operacao.para(motivo);
    this.diz(`  ⏸ operação parada (${motivo}) — as conversas abertas continuam`);
    return this.estado();
  }

  /** A sua entrega: o site final vai para o publicador. Sem HTML, vai o rascunho do estúdio. */
  async entrega(leadId, html) {
    const lead = await this.acha(leadId);
    if (!html && lead?.sites?.rascunho_oficial?.caminho) {
      const { readFile } = await import('node:fs/promises');
      html = await readFile(lead.sites.rascunho_oficial.caminho, 'utf8');
    }
    if (!html || !String(html).trim()) throw new Error('Não há site oficial para entregar: cole o HTML ou espere o estúdio.');
    if (!lead) throw new Error('Não achei esse cliente.');
    if (pediuParaParar(lead)) throw new Error('Esse cliente pediu para não ser mais contatado.');

    const pasta = join(this.pastaTrabalho, apelido(lead.nome, lead.id));
    await mkdir(pasta, { recursive: true });
    const caminho = join(pasta, 'oficial.html');
    await writeFile(caminho, String(html), 'utf8');

    await this.mural.poe('publicador', 'publicar',
      { leadId: lead.id, nome: lead.nome, versao: 'oficial', caminho },
      { chave: `publicador:publicar:${lead.id}:oficial`, prioridade: 1 });

    return { posta: true, onde: 'caixa do publicador' };
  }

  /**
   * As mudanças que o painel fez, cliente por cliente e campo por campo,
   * aplicadas na mesma fila em que os agentes gravam. Assim ninguém apaga
   * o que o outro acabou de escrever.
   *   { mudancas: [{ id, campos: {...}, conversa_mais: [...] }],
   *     novos: [lead], apagados: [id], ajustes: {...} }
   */
  async aplicaMudancas({ mudancas = [], novos = [], apagados = [], ajustes } = {}) {
    await this.comOsDados(async (tudo) => {
      tudo.leads = tudo.leads || [];
      const apagar = new Set(apagados);
      tudo.leads = tudo.leads.filter((l) => !apagar.has(l.id));
      for (const novo of novos) {
        if (novo?.id && !tudo.leads.some((l) => l.id === novo.id)) tudo.leads.push(novo);
      }
      for (const { id, campos = {}, conversa_mais: mais = [] } of mudancas) {
        const atual = tudo.leads.find((l) => l.id === id);
        if (!atual) continue;
        for (const [campo, valor] of Object.entries(campos)) {
          if (campo === 'id' || campo === 'conversa') continue;
          atual[campo] = valor;
        }
        if (mais.length) atual.conversa = [...(atual.conversa || []), ...mais];
      }
      if (ajustes && typeof ajustes === 'object') tudo.ajustes = ajustes;
    });
  }

  /** Solta uma tarefa travada (botão do painel). */
  async destrava(id) {
    return this.mural.destrava(Number(id));
  }

  /* ══ o envio ════════════════════════════════════════════════ */
  /**
   * Envia e registra.
   *
   * `marcaAte` só vem de quem RESPONDEU o cliente. Mandar o link da
   * demonstração, avisar que passou para o programador ou entregar o
   * site são envios NOSSOS — não respondem pergunta nenhuma. Se eles
   * avançassem a marca, uma pergunta que chegou no meio ficaria
   * contada como atendida e morreria ali.
   *
   * Foi exatamente o que aconteceu: o aviso da demonstração saiu
   * depois de o cliente perguntar "quero o site, como pago?", marcou
   * a conversa inteira como atendida, e a pergunta nunca foi
   * respondida. Sem erro nenhum na tela.
   */
  async _manda(lead, mensagem, marcaAte = undefined, motor = '') {
    const numero = String(lead.whatsapp || '').replace(/\D/g, '');
    if (!numero) return false;

    const saida = await this.zap.envia(numero, mensagem);
    if (saida?.incerta) {
      // Clicou e não viu na conversa. Mandar de novo é o pior erro
      // possível (o dono recebia a mesma mensagem cinco vezes): fica
      // registrada como provavelmente enviada, e você confere.
      await this.comOsDados(async (tudo) => {
        const atual = (tudo.leads || []).find((l) => l.id === lead.id);
        if (!atual) return;
        atual.conversa = atual.conversa || [];
        atual.conversa.push({ quem: 'voce', texto: mensagem, quando: agora(), incerta: true, ...(motor ? { motor } : {}) });
        if (typeof marcaAte === 'number') atual.respondido_ate = marcaAte;
        atual.precisa_voce = { motivo: 'confira no WhatsApp se a última mensagem saiu', quando: agora() };
      });
      this.diz(`  ? ${lead.nome}: enviada sem confirmação (${texto(saida?.motivo, 120)})`);
      return true;
    }
    if (!saida?.enviada) {
      this.diz(`  · ${lead.nome}: não enviada (${texto(saida?.motivo, 120)})`);
      return false;
    }
    await this.comOsDados(async (tudo) => {
      const atual = (tudo.leads || []).find((l) => l.id === lead.id);
      if (!atual) return;
      atual.conversa = atual.conversa || [];
      // `motor` é quem escreveu (Claude ou Groq): aparece na ficha do cliente.
      atual.conversa.push({ quem: 'voce', texto: mensagem, quando: agora(), ...(motor ? { motor } : {}) });
      // Sem `marcaAte`, a marca NÃO anda: este envio não respondeu
      // ninguém.
      if (typeof marcaAte === 'number') atual.respondido_ate = marcaAte;
    });
    return true;
  }
}

export { SETORES };
