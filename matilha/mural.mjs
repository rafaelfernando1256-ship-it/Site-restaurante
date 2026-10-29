/**
 * O MURAL — a caixa de tarefas de cada setor.
 *
 * ─────────────────────────────────────────────────────────────────
 * POR QUE ISTO EXISTE
 * ─────────────────────────────────────────────────────────────────
 * Antes havia um laço só: a cada trinta segundos ele passava por
 * TODOS os clientes, um atrás do outro, decidindo o que fazer com
 * cada um. Três problemas, e o terceiro é o pior:
 *
 *   1. Um cliente travava a fila inteira. O Claude Code leva uns 40
 *      segundos para montar um site — e durante esses 40 segundos
 *      ninguém mais era respondido.
 *   2. Tudo acontecia em rajada, de trinta em trinta segundos, em vez
 *      de continuamente.
 *   3. Um erro no meio da passagem derrubava o resto dela.
 *
 * Agora cada setor tem a SUA caixa. Quem termina um trabalho põe o
 * próximo na caixa do setor seguinte e já volta para a sua fila — não
 * espera, não avisa, não fica olhando. E cada setor tem alguém
 * girando o tempo todo, pegando o que tiver.
 *
 * ─────────────────────────────────────────────────────────────────
 * O MURAL SOBREVIVE A DESLIGAR O NOTEBOOK
 * ─────────────────────────────────────────────────────────────────
 * Ele é gravado em disco a cada mudança, com o mesmo cuidado dos
 * dados: arquivo temporário e renomeia. Se a luz cair no meio de uma
 * tarefa, ela volta para a fila quando a Matilha subir de novo — em
 * vez de sumir.
 */
import { readFile, rename, writeFile } from 'node:fs/promises';

export const SETORES = ['cacador', 'valor', 'ofertas', 'vendedor', 'estudio', 'publicador', 'dominio'];

/** Quanto esperar antes de tentar de novo, por tentativa. */
const ESPERA = [0, 30_000, 2 * 60_000, 10 * 60_000, 30 * 60_000];
const MAX_TENTATIVAS = ESPERA.length;

const agora = () => Date.now();

export class Mural {
  constructor({ arquivo, diz = () => {} }) {
    this.arquivo = arquivo;
    this.diz = diz;
    this.tarefas = [];
    this.proximoId = 1;
    this.gravando = null;
  }

  async carrega() {
    try {
      const lido = JSON.parse(await readFile(this.arquivo, 'utf8'));
      this.tarefas = Array.isArray(lido?.tarefas) ? lido.tarefas : [];
      this.proximoId = Number(lido?.proximoId) || this.tarefas.length + 1;
    } catch {
      this.tarefas = [];
      this.proximoId = 1;
    }

    // Tarefa que ficou marcada como "fazendo" significa que a Matilha
    // morreu no meio dela. Volta para a fila: melhor repetir um
    // trabalho do que perdê-lo.
    let resgatadas = 0;
    for (const t of this.tarefas) {
      if (t.estado === 'fazendo') {
        t.estado = 'esperando';
        t.disponivelEm = agora();
        resgatadas += 1;
      }
    }
    if (resgatadas) this.diz(`  ↻ ${resgatadas} tarefa(s) interrompida(s) voltaram para a fila`);
    return this;
  }

  async _grava() {
    // Uma gravação por vez, e sempre a mais recente: se chegarem três
    // pedidos durante uma escrita, o disco recebe o estado final uma
    // vez só, em vez de três estados intermediários.
    if (this.gravando) { this.gravandoDeNovo = true; return this.gravando; }
    this.gravando = (async () => {
      do {
        this.gravandoDeNovo = false;
        const temporario = `${this.arquivo}.escrevendo`;
        const corpo = JSON.stringify({ proximoId: this.proximoId, tarefas: this.tarefas });
        await writeFile(temporario, corpo, 'utf8');
        await rename(temporario, this.arquivo);
      } while (this.gravandoDeNovo);
    })().catch((e) => this.diz(`  ⚠ não consegui gravar o mural: ${e.message}`))
      .finally(() => { this.gravando = null; });
    return this.gravando;
  }

  /**
   * Põe uma tarefa na caixa de um setor.
   *
   * `chave` evita duplicata: pôr duas vezes "fazer a demo do cliente
   * X" não cria duas tarefas. É o que impede o observador de encher o
   * mural quando passa de novo e o estado ainda não mudou.
   */
  async poe(setor, tipo, dados = {}, { chave, prioridade = 5, espera = 0 } = {}) {
    const marca = chave || `${setor}:${tipo}:${dados.leadId || ''}`;
    const jaTem = this.tarefas.find(
      // Travada conta como existente: senão o observador a recriava na
      // hora, e "desistiu depois de cinco tentativas" nunca ficava de pé.
      // Quem solta é você, no botão "Tentar de novo".
      (t) => t.chave === marca && t.estado !== 'feita',
    );
    if (jaTem) return jaTem;

    const tarefa = {
      id: this.proximoId++,
      setor,
      tipo,
      dados,
      chave: marca,
      prioridade,
      estado: 'esperando',
      tentativas: 0,
      criada: agora(),
      // `espera` é o que faz o primeiro contato sair espaçado em vez
      // de doze mensagens no mesmo minuto — a tarefa existe, mas só
      // pode ser pega daqui a tanto tempo.
      disponivelEm: agora() + Math.max(0, Number(espera) || 0),
      erro: null,
    };
    this.tarefas.push(tarefa);
    await this._grava();
    return tarefa;
  }

  /**
   * Pega a próxima tarefa de um setor, e já a marca como "fazendo".
   *
   * Menor prioridade primeiro; empate vai para a mais antiga. Devolve
   * nulo quando não há nada disponível AGORA — tarefa que falhou e
   * está esperando a vez de tentar de novo não conta.
   */
  async pega(setor) {
    const neste = agora();
    const fila = this.tarefas
      .filter((t) => t.setor === setor && t.estado === 'esperando' && t.disponivelEm <= neste)
      .sort((a, b) => a.prioridade - b.prioridade || a.criada - b.criada);

    const tarefa = fila[0];
    if (!tarefa) return null;

    tarefa.estado = 'fazendo';
    tarefa.comecou = neste;
    await this._grava();
    return tarefa;
  }

  async conclui(id, resultado) {
    const tarefa = this.tarefas.find((t) => t.id === id);
    if (!tarefa) return;
    tarefa.estado = 'feita';
    tarefa.terminou = agora();
    tarefa.aviso = '';
    tarefa.resultado = typeof resultado === 'string' ? resultado.slice(0, 300) : null;
    await this._limpaAntigas();
    await this._grava();
  }

  /**
   * A tarefa falhou. Volta para a fila com espera progressiva; depois
   * de esgotar as tentativas, fica como "travada" e aparece no painel
   * — nada é descartado em silêncio.
   */
  async falha(id, erro) {
    const tarefa = this.tarefas.find((t) => t.id === id);
    if (!tarefa) return;
    tarefa.tentativas += 1;
    tarefa.erro = String(erro?.message || erro).slice(0, 300);

    if (tarefa.tentativas >= MAX_TENTATIVAS) {
      tarefa.estado = 'travada';
      tarefa.terminou = agora();
      this.diz(`  ✗ ${tarefa.setor}/${tarefa.tipo} desistiu após ${tarefa.tentativas}: ${tarefa.erro}`);
    } else {
      tarefa.estado = 'esperando';
      tarefa.disponivelEm = agora() + ESPERA[tarefa.tentativas];
      const emSegundos = Math.round(ESPERA[tarefa.tentativas] / 1000);
      this.diz(`  ↻ ${tarefa.setor}/${tarefa.tipo} falhou, tenta de novo em ${emSegundos}s`);
    }
    await this._grava();
  }

  /**
   * A tarefa não falhou: ainda não é a hora dela (o limite do plano do
   * Claude acabou, por exemplo). Volta para a fila com a hora certa e
   * sem gastar tentativa — senão cinco horas de limite viravam uma
   * tarefa "travada" que você teria de destravar à mão.
   */
  async adia(id, ms, motivo = '') {
    const tarefa = this.tarefas.find((t) => t.id === id);
    if (!tarefa) return;
    tarefa.estado = 'esperando';
    tarefa.disponivelEm = agora() + Math.max(1000, Number(ms) || 0);
    tarefa.aviso = String(motivo).slice(0, 200);
    this.diz(`  ⏸ ${tarefa.setor}/${tarefa.tipo} adiada: ${tarefa.aviso}`);
    await this._grava();
  }

  /** Solta uma tarefa travada para tentar de novo (botão do painel). */
  async destrava(id) {
    const tarefa = this.tarefas.find((t) => t.id === id);
    if (!tarefa) return null;
    tarefa.estado = 'esperando';
    tarefa.tentativas = 0;
    tarefa.disponivelEm = agora();
    tarefa.erro = null;
    await this._grava();
    return tarefa;
  }

  /**
   * Cancela o que ainda não começou de um cliente (projeto encerrado). A
   * tarefa não some: fica "feita" com o motivo, para o histórico. A que
   * já está sendo feita termina; ela é devolvida em `andando`.
   */
  async cancelaDoLead(leadId, motivo = 'cancelada') {
    const canceladas = [];
    const andando = [];
    for (const t of this.tarefas) {
      if (t.dados?.leadId !== leadId) continue;
      if (['esperando', 'travada'].includes(t.estado)) {
        t.estado = 'feita';
        t.terminou = agora();
        t.resultado = String(motivo).slice(0, 300);
        t.cancelada = true;
        canceladas.push({ id: t.id, setor: t.setor, tipo: t.tipo });
      } else if (t.estado === 'fazendo') andando.push({ id: t.id, setor: t.setor, tipo: t.tipo });
    }
    if (canceladas.length) await this._grava();
    return { canceladas, andando };
  }

  /** Uma tarefa, para o "inspecionar" do Jarvis. */
  acha(id) { return this.tarefas.find((t) => t.id === Number(id)) || null; }

  /** As feitas não interessam para sempre: guarda as 60 mais recentes. */
  async _limpaAntigas() {
    const feitas = this.tarefas.filter((t) => t.estado === 'feita')
      .sort((a, b) => b.terminou - a.terminou);
    if (feitas.length <= 60) return;
    const sobram = new Set(feitas.slice(0, 60).map((t) => t.id));
    this.tarefas = this.tarefas.filter((t) => t.estado !== 'feita' || sobram.has(t.id));
  }

  /** O que o painel mostra. */
  estado() {
    const porSetor = {};
    for (const setor of SETORES) {
      porSetor[setor] = { esperando: 0, fazendo: 0, travada: 0, feita: 0, agora: null };
    }
    for (const t of this.tarefas) {
      const linha = porSetor[t.setor];
      if (!linha) continue;
      linha[t.estado] = (linha[t.estado] || 0) + 1;
      if (t.estado === 'fazendo') linha.agora = `${t.tipo} · ${t.dados?.nome || ''}`.trim();
    }
    return {
      setores: porSetor,
      adiadas: this.tarefas.filter((t) => t.estado === 'esperando' && t.aviso && t.disponivelEm > agora())
        .map((t) => ({ id: t.id, setor: t.setor, tipo: t.tipo, nome: t.dados?.nome || '', aviso: t.aviso, quando: t.disponivelEm })),
      travadas: this.tarefas.filter((t) => t.estado === 'travada').map((t) => ({
        id: t.id, setor: t.setor, tipo: t.tipo,
        nome: t.dados?.nome || '', erro: t.erro, tentativas: t.tentativas,
      })),
      ultimas: this.tarefas
        .filter((t) => t.estado === 'feita')
        .sort((a, b) => b.terminou - a.terminou).slice(0, 12)
        .map((t) => ({
          setor: t.setor, tipo: t.tipo, nome: t.dados?.nome || '',
          resultado: t.resultado, quando: t.terminou,
        })),
    };
  }
}
