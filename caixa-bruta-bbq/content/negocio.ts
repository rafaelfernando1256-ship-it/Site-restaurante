/**
 * Tudo o que é regra do negócio mora aqui. Mudou um horário, a taxa ou
 * o número do WhatsApp? É neste arquivo, e o site inteiro acompanha.
 */
export const negocio = {
  nome: 'Caixa Bruta BBQ',
  slogan: 'Amor na Brasa, Sabor de Verdade!',
  cidade: 'Sarandi',
  estado: 'PR',

  /** Endereço público do site, usado no sitemap e nas prévias de link.
   *  Troque pelo domínio definitivo quando houver um. */
  url: 'https://caixabrutabbq.netlify.app',

  whatsapp: {
    /** Só dígitos, com 55 e DDD: é o formato do wa.me. */
    numero: '5544998780479',
    exibicao: '(44) 99878-0479',
  },

  agenda: {
    fusoHorario: 'America/Sao_Paulo',
    /** 0 = domingo … 6 = sábado. Quinta, sexta e sábado. */
    diasDeAtendimento: [4, 5, 6] as readonly number[],
    /** Primeira entrega do dia. */
    primeiraEntrega: '20:00',
    /**
     * Último horário de entrega aceito. A empresa ainda não definiu, por
     * isso fica em branco (null): os horários vão de 20h até 23h30, de
     * meia em meia hora, e o atendimento confirma cada pedido. Quando
     * houver um horário de encerramento, escreva aqui, ex.: '22:30'.
     */
    ultimaEntrega: null as string | null,
    /** De quanto em quanto tempo aparecem os horários para escolher. */
    intervaloMinutos: 30,
    /** Antecedência mínima entre o pedido e a entrega. */
    antecedenciaHoras: 8,
    /** Quantos dias para a frente o calendário mostra. */
    diasNoCalendario: 21,
  },

  entrega: {
    /** Em centavos. */
    taxaDemaisRegioes: 1500,
    raioGratisMaringaKm: 10,
  },
} as const;
