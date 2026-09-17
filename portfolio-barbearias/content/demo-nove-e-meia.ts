/* ═══════════════════════════════════════════════════════════════
   DEMO PROJECT 2 — NINE THIRTY
   Fictional barbershop. Nothing here matches a real business.
   Phone numbers use the ranges Ofcom reserves for fiction.
   ═══════════════════════════════════════════════════════════════ */

export const noveMeia = {
  nome: "Nine Thirty",
  descritor: "Barbershop",
  slogan: "Diary open. Look locked in.",
  whatsapp: "447700900940",
  telefoneVisivel: "07700 900940",
  instagram: "@ninethirty.barber",
  endereco: {
    linha1: "940 Kingsland High Street — Shoreditch",
    linha2: "London · E2",
    referencia: "Above the sandwich shop, side door",
  },

  hero: {
    linha1: "Your cut",
    linha2: "doesn't wait",
    subtitulo:
      "Book from your phone, pick your barber, and we're open until nine. No messing about and no queue.",
    cta: "Book now",
    ctaSecundario: "See the work",
  },

  /* Scrolling strip of social proof */
  marquee: [
    "★ 4.9 on Google",
    "2,000+ cuts a year",
    "Open until 9pm",
    "Booked in 30 seconds",
    "6 barbers in the shop",
  ],

  barbeiros: {
    etiqueta: "The team",
    titulo: "Pick who's cutting",
    texto: "Everyone here has their own hand. Book straight in with the one you trust.",
    lista: [
      { nome: "Deco", especialidade: "Fades and razor work", instagram: "@deco.cuts", agenda: "Tue–Sat · 10am–9pm", corte: "Fade" },
      { nome: "Vinni", especialidade: "Business cuts and scissor work", instagram: "@vinni.barber", agenda: "Tue–Sat · 12pm–9pm", corte: "Classic" },
      { nome: "Kaio", especialidade: "Bleach and colour", instagram: "@kaio.hair", agenda: "Wed–Sat · 10am–7pm", corte: "Colour" },
      { nome: "Leo", especialidade: "Beards and cut-throat", instagram: "@leo.razor", agenda: "Tue–Sat · 10am–9pm", corte: "Beard" },
    ],
  },

  servicos: {
    etiqueta: "Services",
    titulo: "Prices on screen, no surprises",
    lista: [
      { nome: "Classic Cut", preco: "£25", tempo: "30 min", tag: "Most booked" },
      { nome: "Skin Fade", preco: "£30", tempo: "40 min", tag: "" },
      { nome: "Cut & Beard", preco: "£42", tempo: "60 min", tag: "Combo" },
      { nome: "Cut-throat Beard", preco: "£22", tempo: "30 min", tag: "" },
      { nome: "Bleach", preco: "£75", tempo: "120 min", tag: "" },
      { nome: "Freestyle (hair design)", preco: "£35", tempo: "50 min", tag: "" },
      { nome: "Eyebrows", preco: "£8", tempo: "10 min", tag: "" },
      { nome: "Neck Tidy", preco: "£10", tempo: "15 min", tag: "" },
    ],
  },

  comoFunciona: {
    etiqueta: "How it works",
    titulo: "Three steps and you're in",
    passos: [
      { numero: "1", titulo: "Pick your barber", texto: "Look at what each one does and decide who's cutting your hair." },
      { numero: "2", titulo: "Pick your slot", texto: "The live diary, including today." },
      { numero: "3", titulo: "Turn up", texto: "Get here five minutes early. We'll handle the rest." },
    ],
  },

  galeria: {
    etiqueta: "Work",
    titulo: "What leaves this shop",
    texto: "Updated every week. Tag us and we'll repost you.",
  },

  horariosLivres: {
    titulo: "Free today",
    texto: "Slots you can still grab:",
    /* In production this comes from the booking system. */
    slots: ["2:30pm", "3:10pm", "5:40pm", "6:20pm", "7:00pm"],
  },

  avaliacao: { nota: "4.9", quantidade: "182" },

  horarios: [
    { dia: "Tuesday to Friday", hora: "10am – 9pm" },
    { dia: "Saturday", hora: "9am – 8pm" },
    { dia: "Sunday", hora: "10am – 4pm" },
    { dia: "Monday", hora: "Closed" },
  ],

  playlist: "Shop playlist on Spotify: Nine Thirty Cuts",
};
