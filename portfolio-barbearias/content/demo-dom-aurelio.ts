/* ═══════════════════════════════════════════════════════════════
   PROJETO DEMONSTRATIVO 3 — BARBEARIA DOM AURÉLIO
   Barbearia fictícia. Nenhum dado corresponde a negócio real.
   ═══════════════════════════════════════════════════════════════ */

export const domAurelio = {
  nome: "Barbearia Dom Aurélio",
  descritor: "Desde 1978",
  slogan: "Três gerações cortando o cabelo do bairro.",
  whatsapp: "5511900000000",
  telefone: "+551140000000",
  telefoneVisivel: "(11) 4000-0000",
  endereco: {
    linha1: "Rua Coronel Bento, 45 — Centro",
    linha2: "Jundiaí · SP",
    referencia: "Na esquina com a praça, em frente à padaria",
    estacionamento: "Estacionamento gratuito na praça, em frente",
  },

  hero: {
    selo: "Desde 1978",
    titulo: "Barbearia Dom Aurélio",
    subtitulo:
      "Corte na tesoura, barba na navalha e conversa boa. Do mesmo jeito há 47 anos, na mesma esquina.",
    cta: "Ligar agora",
    ctaSecundario: "Como chegar",
  },

  historia: {
    etiqueta: "Nossa história",
    titulo: "Seu Aurélio abriu em 78. Hoje quem passa a navalha é o neto.",
    marcos: [
      { ano: "1978", titulo: "A primeira cadeira", texto: "Seu Aurélio abre a barbearia com uma cadeira emprestada e um espelho comprado no ferro-velho." },
      { ano: "1996", titulo: "Chega o Marinho", texto: "O filho mais velho larga o emprego na fábrica e entra para o negócio do pai." },
      { ano: "2019", titulo: "A terceira geração", texto: "Gabriel assume a segunda cadeira e traz o degradê para a casa, sem tirar a navalha da primeira." },
    ],
  },

  servicos: {
    etiqueta: "Preços",
    titulo: "Preço de bairro, sem surpresa na hora de pagar",
    lista: [
      { nome: "Corte Tradicional", preco: "R$ 35" },
      { nome: "Barba na Navalha", preco: "R$ 30" },
      { nome: "Corte + Barba", preco: "R$ 60" },
      { nome: "Corte Infantil", preco: "R$ 25" },
      { nome: "Corte 3ª Idade", preco: "R$ 25" },
      { nome: "Pezinho", preco: "R$ 15" },
    ],
    observacao: "Dinheiro, Pix e cartão. Sem taxa em nenhuma forma de pagamento.",
  },

  oficio: {
    etiqueta: "O que fazemos",
    titulo: "O básico, muito bem feito",
    itens: [
      { titulo: "Tesoura e máquina", texto: "Corte clássico, social, militar ou o que você trouxer na cabeça." },
      { titulo: "Navalha de verdade", texto: "Toalha quente, espuma batida na hora e fio afiado todo dia." },
      { titulo: "Criança sem drama", texto: "Cadeirinha de cavalinho, paciência e bala no fim." },
    ],
  },

  familia: {
    etiqueta: "Quem te atende",
    titulo: "Pai, filho e neto",
    lista: [
      { nome: "Seu Aurélio", papel: "Fundador", desde: "Desde 1978", nota: "Atende às terças e quintas" },
      { nome: "Marinho", papel: "Filho", desde: "Desde 1996", nota: "De terça a sábado" },
      { nome: "Gabriel", papel: "Neto", desde: "Desde 2019", nota: "De terça a sábado, degradê e barba" },
    ],
  },

  avaliacao: { nota: "4,8", quantidade: "127" },

  localizacao: {
    etiqueta: "Onde estamos",
    titulo: "Não precisa marcar. Chegou, sentou.",
    texto:
      "A gente atende por ordem de chegada. Se estiver cheio, o café é por nossa conta enquanto espera.",
  },

  horarios: [
    { dia: "Segunda", hora: "Fechado", dataDia: 1 },
    { dia: "Terça", hora: "08:00 – 19:00", dataDia: 2 },
    { dia: "Quarta", hora: "08:00 – 19:00", dataDia: 3 },
    { dia: "Quinta", hora: "08:00 – 19:00", dataDia: 4 },
    { dia: "Sexta", hora: "08:00 – 20:00", dataDia: 5 },
    { dia: "Sábado", hora: "08:00 – 17:00", dataDia: 6 },
    { dia: "Domingo", hora: "Fechado", dataDia: 0 },
  ],
};
