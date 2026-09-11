/* ═══════════════════════════════════════════════════════════════
   PROJETO DEMONSTRATIVO 2 — NOVE & MEIA
   Barbearia fictícia. Nenhum dado corresponde a negócio real.
   ═══════════════════════════════════════════════════════════════ */

export const noveMeia = {
  nome: "Nove & Meia",
  descritor: "Barbearia",
  slogan: "Agenda aberta. Estilo fechado.",
  whatsapp: "5511900000000",
  telefoneVisivel: "(11) 90000-0000",
  instagram: "@noveemeia.barber",
  endereco: {
    linha1: "Av. Sete de Abril, 940 — Vila Matilde",
    linha2: "São Paulo · SP",
    referencia: "Em cima da lanchonete, entrada pela lateral",
  },

  hero: {
    linha1: "Seu corte",
    linha2: "não espera",
    subtitulo:
      "Agendamento pelo celular, barbeiro que você escolhe e a gente abre até as 21h. Sem enrolação e sem fila.",
    cta: "Agendar agora",
    ctaSecundario: "Ver cortes",
  },

  /* Faixa rolante de prova social */
  marquee: [
    "★ 4,9 no Google",
    "+2.000 cortes por ano",
    "Aberto até 21h",
    "Agendamento em 30 segundos",
    "6 barbeiros na casa",
  ],

  barbeiros: {
    etiqueta: "A equipe",
    titulo: "Escolhe quem vai te atender",
    texto: "Cada um tem a sua mão. Agenda direto com quem você já confia.",
    lista: [
      { nome: "Deco", especialidade: "Degradê e navalhado", instagram: "@deco.corta", agenda: "Ter a sáb · 10h–21h", corte: "Fade" },
      { nome: "Vinni", especialidade: "Social e tesoura", instagram: "@vinni.barber", agenda: "Ter a sáb · 12h–21h", corte: "Social" },
      { nome: "Kaio", especialidade: "Platinado e coloração", instagram: "@kaio.hair", agenda: "Qua a sáb · 10h–19h", corte: "Color" },
      { nome: "Léo", especialidade: "Barba e navalha", instagram: "@leo.navalha", agenda: "Ter a sáb · 10h–21h", corte: "Barba" },
    ],
  },

  servicos: {
    etiqueta: "Serviços",
    titulo: "Preço na tela, sem surpresa",
    lista: [
      { nome: "Corte Social", preco: "R$ 45", tempo: "30 min", tag: "Mais pedido" },
      { nome: "Degradê / Fade", preco: "R$ 55", tempo: "40 min", tag: "" },
      { nome: "Corte + Barba", preco: "R$ 80", tempo: "60 min", tag: "Combo" },
      { nome: "Barba na Navalha", preco: "R$ 40", tempo: "30 min", tag: "" },
      { nome: "Platinado", preco: "R$ 150", tempo: "120 min", tag: "" },
      { nome: "Freestyle (desenho)", preco: "R$ 70", tempo: "50 min", tag: "" },
      { nome: "Sobrancelha", preco: "R$ 15", tempo: "10 min", tag: "" },
      { nome: "Pezinho", preco: "R$ 20", tempo: "15 min", tag: "" },
    ],
  },

  comoFunciona: {
    etiqueta: "Como funciona",
    titulo: "Três passos e pronto",
    passos: [
      { numero: "1", titulo: "Escolhe o barbeiro", texto: "Olha o trabalho de cada um e decide com quem quer cortar." },
      { numero: "2", titulo: "Escolhe o horário", texto: "Agenda aberta em tempo real, inclusive para hoje." },
      { numero: "3", titulo: "Aparece", texto: "Chega cinco minutos antes. O resto é com a gente." },
    ],
  },

  galeria: {
    etiqueta: "Trabalhos",
    titulo: "O que sai daqui",
    texto: "Atualizado toda semana. Marca a gente que a gente reposta.",
  },

  horariosLivres: {
    titulo: "Livre hoje",
    texto: "Horários que ainda dá para pegar:",
    /* Em produção isto vem do sistema de agendamento. */
    slots: ["14:30", "15:10", "17:40", "18:20", "19:00"],
  },

  avaliacao: { nota: "4,9", quantidade: "182" },

  horarios: [
    { dia: "Terça a sexta", hora: "10h às 21h" },
    { dia: "Sábado", hora: "9h às 20h" },
    { dia: "Domingo", hora: "10h às 16h" },
    { dia: "Segunda", hora: "Fechado" },
  ],

  playlist: "Playlist da casa no Spotify: Nove & Meia Cortes",
};
