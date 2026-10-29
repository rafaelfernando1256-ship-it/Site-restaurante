/**
 * A JANELA DE TRABALHO — de que horas até que horas, e em que dias.
 *
 * ─────────────────────────────────────────────────────────────────
 * DUAS JANELAS, NÃO UMA
 * ─────────────────────────────────────────────────────────────────
 * Falar com cliente e trabalhar internamente são coisas diferentes, e
 * por isso têm horários diferentes:
 *
 *   FALAR  — mandar mensagem no WhatsApp de alguém. Mensagem comercial
 *            às 3 da manhã é a melhor forma de ser bloqueado e de
 *            parecer robô. Janela curta e comercial.
 *
 *   TRABALHAR — caçar no Maps, montar site no Claude Code, publicar na
 *            Netlify. Ninguém é incomodado por isso. Pode rodar de
 *            madrugada, e é até melhor: de manhã o trabalho já está
 *            pronto esperando a hora de falar.
 *
 * Então o agente que faz site varre a noite inteira, e quando abre o
 * horário comercial o vendedor acorda com tudo pronto para mandar.
 *
 * ─────────────────────────────────────────────────────────────────
 * O RELÓGIO É O DA SUA MÁQUINA
 * ─────────────────────────────────────────────────────────────────
 * Nada de fuso configurável: a Matilha roda no seu notebook, e o
 * horário é o que está no canto da sua tela. Se você viaja, o horário
 * viaja junto — que é o que você quer, porque você está vendendo para
 * a cidade onde você está.
 */

const PADRAO = {
  // Falar com cliente: comercial, dias úteis + sábado de manhã.
  falar: { inicio: '09:00', fim: '19:00', dias: [1, 2, 3, 4, 5, 6] },
  // Trabalho interno: o dia quase inteiro, todos os dias.
  trabalhar: { inicio: '07:00', fim: '23:00', dias: [0, 1, 2, 3, 4, 5, 6] },
};

const DIAS = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

/** "09:30" → 570 (minutos desde a meia-noite). Entrada ruim vira nulo. */
export function emMinutos(texto) {
  const achou = /^(\d{1,2}):(\d{2})$/.exec(String(texto || '').trim());
  if (!achou) return null;
  const h = Number(achou[1]);
  const m = Number(achou[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

const doisDigitos = (n) => String(n).padStart(2, '0');
const emTexto = (minutos) => `${doisDigitos(Math.floor(minutos / 60))}:${doisDigitos(minutos % 60)}`;

/** Lê um pedaço de configuração, caindo no padrão quando vier torto. */
function arruma(bruto, padrao) {
  const inicio = emMinutos(bruto?.inicio) ?? emMinutos(padrao.inicio);
  const fim = emMinutos(bruto?.fim) ?? emMinutos(padrao.fim);
  const dias = Array.isArray(bruto?.dias) && bruto.dias.length
    ? [...new Set(bruto.dias.map(Number).filter((d) => d >= 0 && d <= 6))]
    : [...padrao.dias];
  return { inicio, fim, dias: dias.length ? dias : [...padrao.dias] };
}

export class Janela {
  constructor(config = {}) {
    this.falar = arruma(config.falar, PADRAO.falar);
    this.trabalhar = arruma(config.trabalhar, PADRAO.trabalhar);
  }

  /**
   * Está dentro da janela agora?
   *
   * O fim pode ser MENOR que o início (ex.: 22:00 → 06:00). Nesse caso
   * a janela atravessa a meia-noite, e o dia que vale é o dia em que
   * ela COMEÇOU — senão um turno da noite seria cortado ao meio na
   * virada.
   */
  _dentro(faixa, quando = new Date()) {
    const minutos = quando.getHours() * 60 + quando.getMinutes();
    const dia = quando.getDay();

    if (faixa.inicio === faixa.fim) return false;

    if (faixa.inicio < faixa.fim) {
      return faixa.dias.includes(dia) && minutos >= faixa.inicio && minutos < faixa.fim;
    }

    // Atravessa a meia-noite.
    if (minutos >= faixa.inicio) return faixa.dias.includes(dia);
    const ontem = (dia + 6) % 7;
    return minutos < faixa.fim && faixa.dias.includes(ontem);
  }

  podeFalar(quando = new Date()) { return this._dentro(this.falar, quando); }
  podeTrabalhar(quando = new Date()) { return this._dentro(this.trabalhar, quando); }

  /** Quantos milissegundos faltam para a janela abrir. */
  faltaPara(qual, quando = new Date()) {
    const faixa = qual === 'falar' ? this.falar : this.trabalhar;
    if (this._dentro(faixa, quando)) return 0;

    // Procura minuto a minuto nos próximos 8 dias. É pouca conta e
    // acerta feriado de calendário, virada de mês e horário de verão
    // sem ter que pensar em nenhum dos três.
    const passo = new Date(quando.getTime());
    passo.setSeconds(0, 0);
    for (let i = 0; i < 8 * 24 * 60; i += 1) {
      passo.setMinutes(passo.getMinutes() + 1);
      if (this._dentro(faixa, passo)) return passo.getTime() - quando.getTime();
    }
    return 60 * 60 * 1000; // nenhum dia marcado: tenta de novo em uma hora
  }

  /** Uma frase para o painel. */
  descreve(qual) {
    const faixa = qual === 'falar' ? this.falar : this.trabalhar;
    const dias = faixa.dias.length === 7 ? 'todos os dias'
      : faixa.dias.length === 5 && [1, 2, 3, 4, 5].every((d) => faixa.dias.includes(d))
        ? 'de segunda a sexta'
        : faixa.dias.slice().sort().map((d) => DIAS[d].slice(0, 3)).join(', ');
    return `${emTexto(faixa.inicio)} às ${emTexto(faixa.fim)}, ${dias}`;
  }

  estado(quando = new Date()) {
    return {
      falar: {
        aberta: this.podeFalar(quando),
        horario: this.descreve('falar'),
        abreEm: this.faltaPara('falar', quando),
      },
      trabalhar: {
        aberta: this.podeTrabalhar(quando),
        horario: this.descreve('trabalhar'),
        abreEm: this.faltaPara('trabalhar', quando),
      },
    };
  }
}
