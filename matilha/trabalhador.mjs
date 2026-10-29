/**
 * O TRABALHADOR — um agente sempre girando na caixa dele.
 *
 * ─────────────────────────────────────────────────────────────────
 * ELE NÃO ESPERA SINAL DE NINGUÉM
 * ─────────────────────────────────────────────────────────────────
 * Não existe "o estúdio avisa o publicador". O que existe é: o
 * estúdio termina o site e PÕE a tarefa na caixa do publicador, e já
 * volta para a própria fila pegar a próxima. O publicador, que estava
 * girando a cada segundo olhando a caixa dele, acha a tarefa, lê o
 * que é, faz, e vai para a seguinte.
 *
 * Ninguém fica bloqueado esperando ninguém. Se o estúdio demorar 40
 * segundos montando um site, o vendedor respondeu oito clientes nesse
 * meio tempo — porque são laços separados.
 *
 * ─────────────────────────────────────────────────────────────────
 * O RITMO
 * ─────────────────────────────────────────────────────────────────
 * Com tarefa na caixa, ele emenda uma na outra sem pausa nenhuma.
 * Com a caixa vazia, ele dá uma espiada por segundo — barato, porque
 * é só olhar uma lista na memória.
 *
 * Fora do horário de trabalho ele não fica rodando à toa: calcula
 * quanto falta para abrir e dorme até lá, acordando no máximo de
 * minuto em minuto para o caso de você mudar o horário no painel.
 */

const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

export class Trabalhador {
  /**
   * @param {object} opcoes
   * @param {string} opcoes.setor      qual caixa ele atende
   * @param {Mural}  opcoes.mural
   * @param {Function} opcoes.faz      (tarefa) => texto do que foi feito
   * @param {Function} opcoes.janela   () => Janela, lida na hora
   * @param {string} opcoes.precisa    'falar', 'trabalhar' ou 'sempre'
   */
  constructor({ setor, mural, faz, janela, precisa = 'trabalhar', diz = () => {} }) {
    this.setor = setor;
    this.mural = mural;
    this.faz = faz;
    this.janela = janela;
    this.precisa = precisa;
    this.diz = diz;

    this.ligado = false;
    this.laco = null;
    this.fazendo = null;
    this.feitas = 0;
    this.falhas = 0;
    this.dormindoAte = null;
    // Pausado por você (ou pelo Jarvis): não pega tarefa nova; a que estava
    // fazendo termina. As tarefas ficam na caixa, esperando.
    this.pausado = false;
  }

  liga() {
    if (this.ligado) return;
    this.ligado = true;
    this.laco = this._gira();
  }

  async desliga() {
    this.ligado = false;
    // Espera a tarefa em andamento terminar: matar no meio deixaria o
    // mural com uma tarefa "fazendo" que só o resgate do próximo
    // arranque consertaria.
    await this.laco?.catch(() => {});
    this.laco = null;
  }

  estado() {
    return {
      setor: this.setor,
      ligado: this.ligado,
      pausado: this.pausado,
      fazendo: this.fazendo,
      feitas: this.feitas,
      falhas: this.falhas,
      dormindoAte: this.dormindoAte,
    };
  }

  async _gira() {
    while (this.ligado) {
      if (this.pausado) {
        this.fazendo = null;
        this.dormindoAte = null;
        await dorme(500);
        continue;
      }
      // ── o horário ────────────────────────────────────────────
      const janela = this.janela();
      // 'sempre': trabalho que não fala com ninguém nem abre navegador (montar oferta).
      const fechado = this.precisa === 'sempre' ? false
        : this.precisa === 'falar' ? !janela.podeFalar() : !janela.podeTrabalhar();
      if (fechado) {
        const falta = janela.faltaPara(this.precisa);
        this.dormindoAte = Date.now() + falta;
        this.fazendo = null;
        // No máximo um minuto por vez: se você mudar o horário no
        // painel, ele percebe em até sessenta segundos em vez de
        // continuar dormindo até amanhã.
        await dorme(Math.min(falta, 60_000));
        continue;
      }
      this.dormindoAte = null;

      // ── a próxima tarefa ─────────────────────────────────────
      let tarefa = null;
      try {
        tarefa = await this.mural.pega(this.setor);
      } catch (e) {
        this.diz(`  ⚠ ${this.setor}: não consegui ler a caixa (${e.message})`);
      }

      if (!tarefa) {
        this.fazendo = null;
        await dorme(1000);
        continue;
      }

      // ── faz ──────────────────────────────────────────────────
      this.fazendo = `${tarefa.tipo}${tarefa.dados?.nome ? ' · ' + tarefa.dados.nome : ''}`;
      try {
        const resultado = await this.faz(tarefa);
        await this.mural.conclui(tarefa.id, resultado);
        this.feitas += 1;
      } catch (e) {
        // `adiarPor`: não é erro, é "ainda não" — o limite do plano do
        // Claude, por exemplo. A tarefa volta com hora marcada e sem
        // gastar tentativa.
        if (e?.adiarPor) await this.mural.adia(tarefa.id, e.adiarPor, e.message);
        else {
          await this.mural.falha(tarefa.id, e);
          this.falhas += 1;
        }
      }
      this.fazendo = null;
      // Sem pausa: emenda direto na próxima da caixa.
    }
    this.fazendo = null;
  }
}
