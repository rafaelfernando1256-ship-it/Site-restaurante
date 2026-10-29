/**
 * A OPERAÇÃO — o botão "Fazer dinheiro" e a meta do dia.
 *
 * Antes, cada passo começava com um clique seu: caçar, marcar quem
 * abordar, liberar. Agora você diz quantas vendas quer hoje e aperta
 * um botão; os agentes caçam, abordam, montam e publicam sozinhos até
 * a meta fechar.
 *
 * ─────────────────────────────────────────────────────────────────
 * O QUE "ATÉ BATER A META" PRECISA TER, SENÃO VIRA OUTRA COISA
 * ─────────────────────────────────────────────────────────────────
 * Ninguém controla quantas pessoas compram. Se a meta for 10 vendas e
 * o dia render 2, "não parar até bater" significa, sem limite nenhum:
 * caçar a madrugada inteira, mandar mensagem para mil negócios, e no
 * fim do dia ter o seu número do WhatsApp bloqueado e o Google pedindo
 * verificação a cada busca. A meta não seria batida do mesmo jeito —
 * só teria custado o seu número.
 *
 * Por isso a operação tem três freios, e os três são SEUS para mexer:
 *
 *   · TETO DE PRIMEIROS CONTATOS NO DIA. Quantas pessoas novas podem
 *     ser abordadas hoje. Batido o teto, ninguém mais é abordado —
 *     mas quem já estava conversando continua sendo respondido.
 *   · ESPAÇO ENTRE UM CONTATO E OUTRO. Doze mensagens iguais no mesmo
 *     minuto é o retrato do que o WhatsApp chama de spam.
 *   · TETO DE NEGÓCIOS CAÇADOS NO DIA. O Google também conta.
 *
 * E o horário de falar continua valendo por cima de tudo: a operação
 * ligada de madrugada caça e monta site, mas não manda mensagem.
 *
 * O que a operação NUNCA faz: falar com quem pediu para parar,
 * abordar duas vezes o mesmo número, ou continuar depois que você
 * apertou "Parar".
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

import { MAX_CACADORES, PADRAO_CACADORES } from './agentes/matilha.mjs';

export const PADROES = {
  vendas: 1,
  tetoContatos: 30,
  tetoAchados: 300,
  esperaEntreContatos: 90_000,
  // Quantas abas caçam ao mesmo tempo. Antes a operação usava sempre
  // UMA, fosse qual fosse o número escolhido no painel.
  cacadores: PADRAO_CACADORES,
};

const chaveDe = (b) => `${String(b?.termo).toLowerCase()}|${String(b?.cidade).toLowerCase()}`;

const agora = () => Date.now();

/** O dia de hoje no relógio do seu computador, não em UTC. */
export function diaDe(quando = agora()) {
  const d = new Date(quando);
  const doisDigitos = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${doisDigitos(d.getMonth() + 1)}-${doisDigitos(d.getDate())}`;
}

const numero = (valor, padrao, maximo) => {
  const n = Math.round(Number(valor));
  if (!Number.isFinite(n) || n <= 0) return padrao;
  return Math.min(n, maximo);
};

export class Operacao {
  constructor(arquivo) {
    this.arquivo = arquivo;
    this.ligada = false;
    this.dia = diaDe();
    this.meta = { ...PADROES };
    this.buscas = [];       // [{termo, cidade}] — a roda de buscas
    this.proxima = 0;       // onde a roda parou
    // Buscas cuja lista do Maps já foi lida até o fim hoje. Voltar
    // nelas só reencontraria quem já foi lido.
    this.esgotadas = [];
    this.parouPor = '';
    this.comecou = null;
  }

  async carrega() {
    try {
      const salvo = JSON.parse(await readFile(this.arquivo, 'utf8'));
      Object.assign(this, {
        ligada: salvo.ligada === true,
        dia: salvo.dia || diaDe(),
        meta: { ...PADROES, ...(salvo.meta || {}) },
        buscas: Array.isArray(salvo.buscas) ? salvo.buscas : [],
        proxima: Number(salvo.proxima) || 0,
        esgotadas: Array.isArray(salvo.esgotadas) ? salvo.esgotadas : [],
        parouPor: salvo.parouPor || '',
        comecou: salvo.comecou || null,
      });
    } catch { /* primeira vez */ }
    return this;
  }

  async _grava() {
    await mkdir(dirname(this.arquivo), { recursive: true }).catch(() => {});
    await writeFile(this.arquivo, JSON.stringify({
      ligada: this.ligada, dia: this.dia, meta: this.meta,
      buscas: this.buscas, proxima: this.proxima, esgotadas: this.esgotadas,
      parouPor: this.parouPor, comecou: this.comecou,
    }, null, 2), 'utf8');
  }

  /* ── a conta do dia ──────────────────────────────────────────
     Contada a partir dos CLIENTES, não de um contador à parte. Um
     contador separado desanda: a Matilha reinicia, alguém apaga um
     cliente, e o número passa a mentir. Os carimbos no cliente são a
     verdade — e dá para auditar olhando a ficha. */
  conta(leads = []) {
    const hoje = diaDe();
    let vendas = 0; let contatos = 0; let achados = 0;
    for (const lead of leads) {
      if (lead?.vendeu_em && diaDe(lead.vendeu_em) === hoje) vendas += 1;
      if (lead?.abordado_em && diaDe(lead.abordado_em) === hoje) contatos += 1;
      if (lead?.criado && diaDe(lead.criado) === hoje) achados += 1;
    }
    return { vendas, contatos, achados };
  }

  /** Virou o dia: a meta recomeça do zero, sozinha. */
  async confereODia() {
    const hoje = diaDe();
    if (this.dia === hoje) return false;
    this.dia = hoje;
    this.parouPor = '';
    // Dia novo, negócio novo no Maps: as buscas voltam todas para a roda.
    this.esgotadas = [];
    await this._grava();
    return true;
  }

  async comeca({ vendas, ramos, cidades, tetoContatos, tetoAchados, esperaEntreContatos,
    cacadores } = {}) {
    const listaRamos = (Array.isArray(ramos) ? ramos : String(ramos || '').split(','))
      .map((r) => String(r).trim()).filter(Boolean);
    const listaCidades = (Array.isArray(cidades) ? cidades : String(cidades || '').split(','))
      .map((c) => String(c).trim()).filter(Boolean);
    if (!listaRamos.length || !listaCidades.length) {
      throw new Error('Diga pelo menos um ramo e uma cidade para caçar.');
    }

    this.buscas = [];
    for (const cidade of listaCidades) {
      for (const termo of listaRamos) this.buscas.push({ termo, cidade });
    }
    this.proxima = 0;
    this.esgotadas = [];
    this.meta = {
      vendas: numero(vendas, PADROES.vendas, 50),
      tetoContatos: numero(tetoContatos, PADROES.tetoContatos, 200),
      tetoAchados: numero(tetoAchados, PADROES.tetoAchados, 2000),
      esperaEntreContatos: numero(esperaEntreContatos, PADROES.esperaEntreContatos, 3_600_000),
      cacadores: numero(cacadores, PADROES.cacadores, MAX_CACADORES),
    };
    this.dia = diaDe();
    this.ligada = true;
    this.parouPor = '';
    this.comecou = agora();
    await this._grava();
    return this.estado([]);
  }

  async para(motivo = 'você mandou parar') {
    this.ligada = false;
    this.parouPor = motivo;
    await this._grava();
    return this.estado([]);
  }

  /** As buscas da roda que ainda podem trazer gente nova. */
  _vivas() {
    const fora = new Set(this.esgotadas.map(chaveDe));
    return this.buscas.filter((b) => !fora.has(chaveDe(b)));
  }

  /**
   * As próximas `quantas` buscas da roda, uma para cada caçador. Ela
   * gira: acabou a lista, volta ao começo — pulando as esgotadas.
   */
  async proximasBuscas(quantas = 1) {
    const vivas = this._vivas();
    if (!vivas.length) return [];
    const saida = [];
    for (let i = 0; i < Math.min(quantas, vivas.length); i += 1) {
      saida.push({ ...vivas[this.proxima % vivas.length] });
      this.proxima = (this.proxima + 1) % vivas.length;
    }
    await this._grava();
    return saida;
  }

  /** O caçador leu a lista desta busca até o fim. */
  async esgota(busca) {
    if (!busca || this.esgotadas.some((b) => chaveDe(b) === chaveDe(busca))) return;
    this.esgotadas.push({ termo: busca.termo, cidade: busca.cidade });
    await this._grava();
  }

  /* ── os freios ───────────────────────────────────────────────── */

  /** Pode caçar mais? */
  podeCacar(leads = []) {
    if (!this.ligada) return { pode: false, motivo: this.parouPor || 'operação parada' };
    const { vendas, achados } = this.conta(leads);
    if (vendas >= this.meta.vendas) {
      return { pode: false, motivo: `meta de ${this.meta.vendas} venda(s) batida` };
    }
    if (achados >= this.meta.tetoAchados) {
      return { pode: false, motivo: `teto de ${this.meta.tetoAchados} negócios caçados hoje` };
    }
    if (this.buscas.length && !this._vivas().length) {
      return { pode: false, motivo: 'todas as buscas foram lidas até o fim hoje — '
        + 'acrescente ramos ou cidades para achar gente nova' };
    }
    return { pode: true, motivo: '' };
  }

  /** Pode abordar mais alguém novo? */
  podeAbordar(leads = []) {
    if (!this.ligada) return { pode: false, motivo: this.parouPor || 'operação parada' };
    const { vendas, contatos } = this.conta(leads);
    if (vendas >= this.meta.vendas) {
      return { pode: false, motivo: `meta de ${this.meta.vendas} venda(s) batida` };
    }
    if (contatos >= this.meta.tetoContatos) {
      return { pode: false, motivo: `teto de ${this.meta.tetoContatos} primeiros contatos hoje` };
    }
    return { pode: true, motivo: '' };
  }

  /**
   * Quanto falta para o próximo primeiro contato poder sair.
   * Zero quer dizer "pode agora".
   */
  esperaDaVez(leads = []) {
    let ultimo = 0;
    for (const lead of leads) {
      const quando = Number(lead?.abordado_em) || 0;
      if (quando > ultimo) ultimo = quando;
    }
    if (!ultimo) return 0;
    return Math.max(0, this.meta.esperaEntreContatos - (agora() - ultimo));
  }

  estado(leads = []) {
    const hoje = this.conta(leads);
    const batida = hoje.vendas >= this.meta.vendas;
    return {
      ligada: this.ligada,
      meta: { ...this.meta },
      hoje,
      batida,
      faltam: Math.max(0, this.meta.vendas - hoje.vendas),
      buscas: this.buscas,
      esgotadas: this.esgotadas,
      parou_por: this.parouPor,
      comecou: this.comecou,
      dia: this.dia,
    };
  }
}
