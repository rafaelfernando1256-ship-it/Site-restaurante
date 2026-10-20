import { describe, expect, it } from 'vitest';

import {
  configPadrao, diasDoCalendario, horariosDoDia, horariosOferecidos, instanteDe,
  MENSAGEM_ANTECEDENCIA, primeiraEntregaPossivel, validaAgendamento,
} from '@/lib/agenda';

/** Um instante dito no relógio de Sarandi (UTC-3). */
const emSarandi = (texto: string) => new Date(`${texto}-03:00`);

// Outubro de 2026: quinta 22, sexta 23, sábado 24, domingo 25.
const QUINTA = '2026-10-22';
const SEXTA = '2026-10-23';
const SABADO = '2026-10-24';
const DOMINGO = '2026-10-25';

describe('a regra das 8 horas', () => {
  it('sexta às 15h não pode pedir para sexta às 20h (só 5 horas)', () => {
    const r = validaAgendamento(SEXTA, '20:00', emSarandi('2026-10-23T15:00:00'));
    expect(r).toEqual({ ok: false, motivo: 'antecedencia', mensagem: MENSAGEM_ANTECEDENCIA });
  });

  it('sexta às 10h pode pedir para sexta às 20h (10 horas)', () => {
    expect(validaAgendamento(SEXTA, '20:00', emSarandi('2026-10-23T10:00:00'))).toEqual({ ok: true });
  });

  it('exatamente 8 horas antes vale', () => {
    expect(validaAgendamento(SEXTA, '20:00', emSarandi('2026-10-23T12:00:00')).ok).toBe(true);
  });

  it('um segundo depois do limite já não vale', () => {
    const r = validaAgendamento(SEXTA, '20:00', emSarandi('2026-10-23T12:00:01'));
    expect(r.ok).toBe(false);
  });

  it('passado o limite das 20h, o das 20h30 ainda vale', () => {
    const agora = emSarandi('2026-10-23T12:10:00');
    expect(validaAgendamento(SEXTA, '20:00', agora).ok).toBe(false);
    expect(validaAgendamento(SEXTA, '20:30', agora).ok).toBe(true);
  });

  it('pedido de quinta à noite para sexta às 20h vale', () => {
    expect(validaAgendamento(SEXTA, '20:00', emSarandi('2026-10-22T23:00:00')).ok).toBe(true);
  });

  it('sábado às 16h já não alcança nenhum horário do sábado', () => {
    const horarios = horariosDoDia(SABADO, emSarandi('2026-10-24T16:00:00'));
    expect(horarios.length).toBeGreaterThan(0);
    expect(horarios.every((h) => !h.disponivel)).toBe(true);
  });

  it('horário que já passou é recusado como passado', () => {
    const r = validaAgendamento(QUINTA, '20:00', emSarandi('2026-10-22T21:00:00'));
    expect(r.ok === false && r.motivo).toBe('passado');
  });
});

describe('dias e horários de atendimento', () => {
  it('domingo não é dia de entrega', () => {
    const r = validaAgendamento(DOMINGO, '20:00', emSarandi('2026-10-20T08:00:00'));
    expect(r.ok === false && r.motivo).toBe('dia');
    expect(horariosDoDia(DOMINGO, emSarandi('2026-10-20T08:00:00'))).toEqual([]);
  });

  it('antes das 20h não há entrega', () => {
    const r = validaAgendamento(SEXTA, '19:30', emSarandi('2026-10-20T08:00:00'));
    expect(r.ok === false && r.motivo).toBe('horario');
  });

  it('horário fora da grade de meia em meia hora é recusado', () => {
    const r = validaAgendamento(SEXTA, '20:10', emSarandi('2026-10-20T08:00:00'));
    expect(r.ok === false && r.motivo).toBe('horario');
  });

  it('sem horário de encerramento definido, a grade vai das 20h às 23h30', () => {
    const horas = horariosOferecidos();
    expect(horas[0]).toBe('20:00');
    expect(horas.at(-1)).toBe('23:30');
    expect(horas).toHaveLength(8);
  });

  it('o horário de encerramento, quando definido, corta a grade', () => {
    const cfg = { ...configPadrao, ultimaEntrega: '22:00' };
    expect(horariosOferecidos(cfg).at(-1)).toBe('22:00');
    const r = validaAgendamento(SEXTA, '22:30', emSarandi('2026-10-20T08:00:00'), cfg);
    expect(r.ok === false && r.motivo).toBe('horario');
  });

  it('o calendário só traz quinta, sexta e sábado', () => {
    const dias = diasDoCalendario(emSarandi('2026-10-20T09:00:00'));
    expect(dias.slice(0, 3).map((d) => d.data)).toEqual([QUINTA, SEXTA, SABADO]);
    expect(dias.every((d) => [4, 5, 6].includes(d.diaDaSemana))).toBe(true);
  });

  it('o calendário marca o dia sem horário possível', () => {
    const dias = diasDoCalendario(emSarandi('2026-10-24T17:00:00'));
    expect(dias[0]).toMatchObject({ data: SABADO, temHorario: false });
    expect(dias[1].temHorario).toBe(true);
  });

  it('não aceita encomenda além do calendário', () => {
    const r = validaAgendamento('2026-12-31', '20:00', emSarandi('2026-10-20T08:00:00'));
    expect(r.ok === false && r.motivo).toBe('longe');
  });
});

describe('primeira entrega possível', () => {
  it('terça de manhã: quinta às 20h', () => {
    expect(primeiraEntregaPossivel(emSarandi('2026-10-20T09:00:00'))).toEqual({ data: QUINTA, hora: '20:00' });
  });

  it('sexta às 13h: sexta às 21h', () => {
    expect(primeiraEntregaPossivel(emSarandi('2026-10-23T13:00:00'))).toEqual({ data: SEXTA, hora: '21:00' });
  });

  it('sábado às 18h: só na quinta seguinte', () => {
    expect(primeiraEntregaPossivel(emSarandi('2026-10-24T18:00:00'))).toEqual({ data: '2026-10-29', hora: '20:00' });
  });
});

describe('fuso horário', () => {
  it('20h em Sarandi é 23h em UTC', () => {
    expect(instanteDe(SEXTA, '20:00').toISOString()).toBe('2026-10-23T23:00:00.000Z');
  });

  it('a conta usa o relógio de Sarandi mesmo perto da meia-noite UTC', () => {
    // 22h de quinta em Sarandi já é sexta em UTC: o dia de "hoje" tem de
    // continuar sendo quinta.
    const dias = diasDoCalendario(emSarandi('2026-10-22T22:00:00'));
    expect(dias[0].data).toBe(QUINTA);
    expect(dias[0].temHorario).toBe(false);
  });
});
