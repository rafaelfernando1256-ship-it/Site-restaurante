/* ═══════════════════════════════════════════════════════════════
   DEMO PROJECT 3 — AURELIO & SONS
   Fictional barbershop. Nothing here matches a real business.
   Phone numbers use the ranges Ofcom reserves for fiction.
   ═══════════════════════════════════════════════════════════════ */

export const domAurelio = {
  nome: "Aurelio & Sons",
  descritor: "Since 1978",
  slogan: "Three generations cutting this neighbourhood's hair.",
  whatsapp: "447700900045",
  telefone: "+442079460045",
  telefoneVisivel: "020 7946 0045",
  endereco: {
    linha1: "45 Colonel Bent Road — Walthamstow",
    linha2: "London · E17",
    referencia: "On the corner by the green, opposite the bakery",
    estacionamento: "Free parking on the green, right opposite",
  },

  hero: {
    selo: "Since 1978",
    titulo: "Aurelio & Sons",
    subtitulo:
      "Scissor cuts, cut-throat shaves and decent conversation. Same way for 47 years, on the same corner.",
    cta: "Call now",
    ctaSecundario: "Find us",
  },

  historia: {
    etiqueta: "Our story",
    titulo: "Old Aurelio opened in '78. These days it's his grandson on the razor.",
    marcos: [
      { ano: "1978", titulo: "The first chair", texto: "Aurelio opens up with a borrowed chair and a mirror bought from a scrapyard." },
      { ano: "1996", titulo: "Martin joins", texto: "The eldest son leaves his job at the factory and comes into his father's trade." },
      { ano: "2019", titulo: "The third generation", texto: "Gabriel takes the second chair and brings the skin fade in, without taking the razor off the first." },
    ],
  },

  servicos: {
    etiqueta: "Prices",
    titulo: "Neighbourhood prices, no surprise at the till",
    lista: [
      { nome: "Traditional Cut", preco: "£18" },
      { nome: "Cut-throat Shave", preco: "£16" },
      { nome: "Cut & Shave", preco: "£30" },
      { nome: "Children's Cut", preco: "£13" },
      { nome: "Over-65s Cut", preco: "£13" },
      { nome: "Neck Tidy", preco: "£7" },
    ],
    observacao: "Cash, card and contactless. No surcharge on any of them.",
  },

  oficio: {
    etiqueta: "What we do",
    titulo: "The basics, done properly",
    itens: [
      { titulo: "Scissors and clippers", texto: "Classic, smart, short back and sides, or whatever you walk in with." },
      { titulo: "A real razor", texto: "Hot towel, lather whipped on the spot and a blade stropped every day." },
      { titulo: "Children, no drama", texto: "The little horse seat, plenty of patience and a sweet at the end." },
    ],
  },

  familia: {
    etiqueta: "Who'll see you",
    titulo: "Father, son and grandson",
    lista: [
      { nome: "Old Aurelio", papel: "Founder", desde: "Since 1978", nota: "In on Tuesdays and Thursdays" },
      { nome: "Martin", papel: "Son", desde: "Since 1996", nota: "Tuesday to Saturday" },
      { nome: "Gabriel", papel: "Grandson", desde: "Since 2019", nota: "Tuesday to Saturday, fades and beards" },
    ],
  },

  avaliacao: { nota: "4.8", quantidade: "127" },

  localizacao: {
    etiqueta: "Where we are",
    titulo: "No need to book. Walk in, sit down.",
    texto:
      "We take people in the order they arrive. If it's busy, the tea is on us while you wait.",
  },

  horarios: [
    { dia: "Monday", hora: "Closed", dataDia: 1 },
    { dia: "Tuesday", hora: "8:00am – 7:00pm", dataDia: 2 },
    { dia: "Wednesday", hora: "8:00am – 7:00pm", dataDia: 3 },
    { dia: "Thursday", hora: "8:00am – 7:00pm", dataDia: 4 },
    { dia: "Friday", hora: "8:00am – 8:00pm", dataDia: 5 },
    { dia: "Saturday", hora: "8:00am – 5:00pm", dataDia: 6 },
    { dia: "Sunday", hora: "Closed", dataDia: 0 },
  ],
};
