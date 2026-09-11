/* ═══════════════════════════════════════════════════════════════
   PROJETO DEMONSTRATIVO 1 — CASA VALÉRIO
   Barbearia fictícia. Nenhum dado corresponde a negócio real.
   ═══════════════════════════════════════════════════════════════ */

export const valerio = {
  nome: "Casa Valério",
  descritor: "Barbearia Privê",
  slogan: "O tempo que você reserva para si.",
  whatsapp: "5511900000000",
  telefoneVisivel: "(11) 90000-0000",
  endereco: {
    linha1: "Rua Dom Gastão, 218 — Jardim Paulista",
    linha2: "São Paulo · SP",
    referencia: "Manobrista na porta, das 9h às 21h",
  },

  hero: {
    etiqueta: "São Paulo · Jardim Paulista",
    titulo: "Casa Valério",
    subtitulo:
      "Uma hora reservada só para você, com hora marcada e sem pressa. Atendimento individual, em sala privativa.",
    cta: "Reservar horário",
    ctaSecundario: "Conhecer o clube",
  },

  ritual: {
    etiqueta: "O ritual",
    titulo: "Aqui não existe fila. Existe hora marcada.",
    texto:
      "Cada reserva ocupa uma hora inteira da agenda. É o tempo de fazer bem feito e ainda tomar um café sem olhar o relógio.",
    passos: [
      { numero: "I", titulo: "Recepção", texto: "Café, água com gás ou um dedo de whisky. Você escolhe antes de sentar." },
      { numero: "II", titulo: "Consultoria", texto: "Cinco minutos entendendo seu cabelo, sua rotina e o que você não quer." },
      { numero: "III", titulo: "Toalha quente", texto: "A pele abre, o pelo amolece. É o que faz a navalha deslizar sem repuxar." },
      { numero: "IV", titulo: "Navalha", texto: "Barba feita no fio, no sentido certo, com produto de alfaiataria." },
      { numero: "V", titulo: "Finalização", texto: "Você sai pronto para o compromisso, não para passar em casa antes." },
    ],
  },

  servicos: {
    etiqueta: "Serviços",
    titulo: "Nossa carta",
    texto: "Todos os atendimentos incluem consultoria, bebida e finalização.",
    lista: [
      { nome: "Corte Valério", descricao: "Consultoria, corte na tesoura e finalização", preco: "R$ 120", duracao: "60 min" },
      { nome: "Barba Tradicional", descricao: "Toalha quente, navalha e óleo de finalização", preco: "R$ 90", duracao: "45 min" },
      { nome: "Corte + Barba", descricao: "O atendimento completo, sem pressa", preco: "R$ 190", duracao: "90 min" },
      { nome: "Tratamento Capilar", descricao: "Diagnóstico do couro e protocolo em três etapas", preco: "R$ 140", duracao: "60 min" },
      { nome: "Pigmentação", descricao: "Cobertura de falhas na barba ou no cabelo", preco: "R$ 70", duracao: "30 min" },
      { nome: "Dia do Noivo", descricao: "Duas horas, com acompanhante e brinde da casa", preco: "R$ 450", duracao: "120 min" },
    ],
  },

  mestres: {
    etiqueta: "Os mestres",
    titulo: "Nenhum barbeiro nosso tem menos de dez anos de navalha.",
    lista: [
      { nome: "Aurélio Valério", papel: "Mestre-barbeiro e fundador", anos: "28 anos de ofício", especialidade: "Navalha clássica" },
      { nome: "Tomás Ferrari", papel: "Barbeiro sênior", anos: "16 anos de ofício", especialidade: "Cortes sociais e tesoura" },
      { nome: "Igor Salles", papel: "Barbeiro sênior", anos: "12 anos de ofício", especialidade: "Tratamento capilar" },
    ],
  },

  clube: {
    etiqueta: "Clube Valério",
    titulo: "Para quem já sabe que volta.",
    texto:
      "Assinatura mensal com horário garantido, sem precisar disputar agenda. Cancele quando quiser.",
    planos: [
      { nome: "Essencial", preco: "R$ 249", periodo: "/mês", inclui: ["2 cortes por mês", "10% em produtos", "Reserva com 7 dias"], destaque: false },
      { nome: "Clube", preco: "R$ 389", periodo: "/mês", inclui: ["4 cortes por mês", "2 barbas por mês", "15% em produtos", "Reserva com 15 dias"], destaque: true },
      { nome: "Privê", preco: "R$ 690", periodo: "/mês", inclui: ["Atendimentos ilimitados", "Horário fixo reservado", "20% em produtos", "Convidado uma vez por mês"], destaque: false },
    ],
  },

  presente: {
    titulo: "Vale-presente",
    texto:
      "Um cartão nominal, entregue em envelope de linho, válido por doze meses para qualquer serviço da carta.",
    cta: "Presentear alguém",
  },

  reserva: {
    etiqueta: "Reserva",
    titulo: "Sua hora, reservada",
    texto:
      "A agenda costuma fechar com cinco dias de antecedência. Escolha o serviço e nós confirmamos por WhatsApp.",
    cta: "Reservar pelo WhatsApp",
    mensagem: "Olá! Gostaria de reservar um horário na Casa Valério.",
  },

  horarios: [
    { dia: "Terça a sexta", hora: "10h às 21h" },
    { dia: "Sábado", hora: "9h às 19h" },
    { dia: "Domingo e segunda", hora: "Fechado" },
  ],
};
