/**
 * A REGRA DAS 8 HORAS, e o calendário que obedece a ela.
 *
 * Tudo aqui é função pura que recebe `agora` de fora. Isso deixa os
 * testes escolherem o relógio, e deixa a página recalcular sozinha
 * quando fica aberta por muito tempo: basta chamar de novo com a hora
 * nova.
 *
 * Horário de Sarandi, não do aparelho. Uma data de entrega é escrita
 * como 'AAAA-MM-DD' e um horário como 'HH:MM', sempre no fuso da loja
 * (America/Sao_Paulo). Para comparar com `agora`, convertemos esse
 * relógio de parede para um instante absoluto. Assim um cliente com o
 * celular em outro fuso vê os mesmos horários que um cliente de Sarandi,
 * e a conta das 8 horas é feita em milissegundos reais, sem confundir
 * hora local com UTC.
 */
import { negocio } from '@/content/negocio';

export type ConfigAgenda = {
  fusoHorario: string;
  diasDeAtendimento: readonly number[];
  primeiraEntrega: string;
  ultimaEntrega: string | null;
  intervaloMinutos: number;
  antecedenciaHoras: number;
  diasNoCalendario: number;
};

export const configPadrao: ConfigAgenda = negocio.agenda;

/** Sem horário de encerramento definido, a lista de horários vai até aqui. */
const FIM_DO_DIA = '23:30';

const HORA = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATA = /^(\d{4})-(\d{2})-(\d{2})$/;

export const MENSAGEM_ANTECEDENCIA = 'Para garantir o preparo do seu churrasco, precisamos de '
  + 'pelo menos 8 horas de antecedência. Escolha outro horário disponível.';

/* ── relógio ─────────────────────────────────────────────────────── */

type Partes = { ano: number; mes: number; dia: number; hora: number; minuto: number };

const formatadores = new Map<string, Intl.DateTimeFormat>();
function formatador(fuso: string) {
  let f = formatadores.get(fuso);
  if (!f) {
    f = new Intl.DateTimeFormat('en-US', {
      timeZone: fuso, hourCycle: 'h23',
      year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    formatadores.set(fuso, f);
  }
  return f;
}

/** O relógio de parede do fuso naquele instante. */
export function partesNoFuso(instante: Date, fuso: string): Partes {
  const p: Record<string, number> = {};
  for (const { type, value } of formatador(fuso).formatToParts(instante)) {
    if (type !== 'literal') p[type] = Number(value);
  }
  return { ano: p.year, mes: p.month, dia: p.day, hora: p.hour, minuto: p.minute };
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');
const dataDe = (p: Pick<Partes, 'ano' | 'mes' | 'dia'>) =>
  `${p.ano}-${doisDigitos(p.mes)}-${doisDigitos(p.dia)}`;

/** O dia de hoje no fuso da loja, 'AAAA-MM-DD'. */
export function hojeNoFuso(agora: Date, fuso = configPadrao.fusoHorario) {
  return dataDe(partesNoFuso(agora, fuso));
}

/**
 * O instante absoluto de um relógio de parede no fuso. Calcula o
 * deslocamento do fuso naquele momento (em vez de supor -03:00), então
 * continua certo se o Brasil voltar a ter horário de verão.
 */
export function instanteDe(data: string, hora: string, fuso = configPadrao.fusoHorario): Date {
  const [, a, m, d] = DATA.exec(data)!.map(Number);
  const [h, mi] = hora.split(':').map(Number);
  const comoUtc = Date.UTC(a, m - 1, d, h, mi);
  let palpite = comoUtc;
  for (let i = 0; i < 2; i += 1) {
    const p = partesNoFuso(new Date(palpite), fuso);
    const visto = Date.UTC(p.ano, p.mes - 1, p.dia, p.hora, p.minuto);
    palpite += comoUtc - visto;
  }
  return new Date(palpite);
}

/** 0 = domingo … 6 = sábado, de uma data de calendário. */
export function diaDaSemana(data: string) {
  const [, a, m, d] = DATA.exec(data)!.map(Number);
  return new Date(Date.UTC(a, m - 1, d, 12)).getUTCDay();
}

/** Soma dias a uma data de calendário. */
export function somaDias(data: string, dias: number) {
  const [, a, m, d] = DATA.exec(data)!.map(Number);
  const x = new Date(Date.UTC(a, m - 1, d + dias, 12));
  return dataDe({ ano: x.getUTCFullYear(), mes: x.getUTCMonth() + 1, dia: x.getUTCDate() });
}

const emMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
};
const deMinutos = (min: number) => `${doisDigitos(Math.floor(min / 60))}:${doisDigitos(min % 60)}`;

/* ── o calendário ────────────────────────────────────────────────── */

/** Os horários que a loja oferece num dia de atendimento. */
export function horariosOferecidos(cfg: ConfigAgenda = configPadrao) {
  const inicio = emMinutos(cfg.primeiraEntrega);
  const fim = emMinutos(cfg.ultimaEntrega ?? FIM_DO_DIA);
  const saida: string[] = [];
  for (let m = inicio; m <= fim; m += cfg.intervaloMinutos) saida.push(deMinutos(m));
  return saida;
}

export type Horario = { hora: string; disponivel: boolean };

/** Os horários de um dia, cada um dizendo se ainda dá tempo. */
export function horariosDoDia(data: string, agora: Date, cfg: ConfigAgenda = configPadrao): Horario[] {
  if (!cfg.diasDeAtendimento.includes(diaDaSemana(data))) return [];
  return horariosOferecidos(cfg).map((hora) => ({
    hora,
    disponivel: validaAgendamento(data, hora, agora, cfg).ok,
  }));
}

export type Dia = { data: string; diaDaSemana: number; temHorario: boolean };

/** Os dias de atendimento dos próximos `diasNoCalendario` dias, a partir de hoje. */
export function diasDoCalendario(agora: Date, cfg: ConfigAgenda = configPadrao): Dia[] {
  const hoje = hojeNoFuso(agora, cfg.fusoHorario);
  const dias: Dia[] = [];
  for (let i = 0; i < cfg.diasNoCalendario; i += 1) {
    const data = somaDias(hoje, i);
    const semana = diaDaSemana(data);
    if (!cfg.diasDeAtendimento.includes(semana)) continue;
    dias.push({
      data,
      diaDaSemana: semana,
      temHorario: horariosDoDia(data, agora, cfg).some((h) => h.disponivel),
    });
  }
  return dias;
}

/** A entrega mais cedo que ainda respeita a antecedência. */
export function primeiraEntregaPossivel(agora: Date, cfg: ConfigAgenda = configPadrao) {
  for (const dia of diasDoCalendario(agora, cfg)) {
    const horario = horariosDoDia(dia.data, agora, cfg).find((h) => h.disponivel);
    if (horario) return { data: dia.data, hora: horario.hora };
  }
  return null;
}

/* ── a validação ─────────────────────────────────────────────────── */

export type Validacao =
  | { ok: true }
  | { ok: false; motivo: 'formato' | 'dia' | 'horario' | 'passado' | 'antecedencia' | 'longe'; mensagem: string };

/**
 * A regra inteira, num lugar só. O seletor usa para apagar horários, e
 * o fechamento usa de novo, com a hora daquele segundo, antes de abrir
 * o WhatsApp.
 */
export function validaAgendamento(
  data: string, hora: string, agora: Date, cfg: ConfigAgenda = configPadrao,
): Validacao {
  if (!DATA.test(data || '') || !HORA.test(hora || '')) {
    return { ok: false, motivo: 'formato', mensagem: 'Escolha o dia e o horário da entrega.' };
  }
  if (!cfg.diasDeAtendimento.includes(diaDaSemana(data))) {
    return { ok: false, motivo: 'dia', mensagem: 'Entregamos às quintas, sextas e sábados. Escolha um desses dias.' };
  }
  if (!horariosOferecidos(cfg).includes(hora)) {
    return { ok: false, motivo: 'horario', mensagem: 'As entregas são a partir das 20h. Escolha um dos horários da lista.' };
  }
  const entrega = instanteDe(data, hora, cfg.fusoHorario).getTime();
  const falta = entrega - agora.getTime();
  if (falta <= 0) {
    return { ok: false, motivo: 'passado', mensagem: 'Esse horário já passou. Escolha outro dia ou horário.' };
  }
  if (falta < cfg.antecedenciaHoras * 3_600_000) {
    return { ok: false, motivo: 'antecedencia', mensagem: MENSAGEM_ANTECEDENCIA };
  }
  const limite = instanteDe(somaDias(hojeNoFuso(agora, cfg.fusoHorario), cfg.diasNoCalendario), '00:00',
    cfg.fusoHorario).getTime();
  if (entrega >= limite) {
    return { ok: false, motivo: 'longe', mensagem: `Aceitamos encomendas para os próximos ${cfg.diasNoCalendario} dias.` };
  }
  return { ok: true };
}

/* ── escrita ─────────────────────────────────────────────────────── */

const SEMANA = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto',
  'setembro', 'outubro', 'novembro', 'dezembro'];

/** 'sexta-feira, 24 de outubro' */
export function dataPorExtenso(data: string) {
  const [, , m, d] = DATA.exec(data)!.map(Number);
  return `${SEMANA[diaDaSemana(data)]}, ${d} de ${MESES[m - 1]}`;
}

/** 'sex', 'sáb'… para os botões do calendário. */
export function diaCurto(data: string) {
  return ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'][diaDaSemana(data)];
}

/** '24/10' */
export function dataCurta(data: string) {
  const [, , m, d] = DATA.exec(data)!.map(Number);
  return `${doisDigitos(d)}/${doisDigitos(m)}`;
}

/** '20h' ou '20h30' */
export function horaFalada(hora: string) {
  const [h, m] = hora.split(':');
  return m === '00' ? `${Number(h)}h` : `${Number(h)}h${m}`;
}

/** 'hoje', 'amanhã' ou o dia por extenso, para a frase da primeira entrega. */
export function quandoFalado(data: string, agora: Date, fuso = configPadrao.fusoHorario) {
  const hoje = hojeNoFuso(agora, fuso);
  if (data === hoje) return 'hoje';
  if (data === somaDias(hoje, 1)) return 'amanhã';
  return dataPorExtenso(data);
}
