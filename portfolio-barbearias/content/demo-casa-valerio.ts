/* ═══════════════════════════════════════════════════════════════
   DEMO PROJECT 1 — CASA VALERIO
   Fictional barbershop. Nothing here matches a real business.
   Phone numbers use the ranges Ofcom reserves for fiction.
   ═══════════════════════════════════════════════════════════════ */

export const valerio = {
  nome: "Casa Valerio",
  descritor: "Private Barbershop",
  slogan: "The hour you set aside for yourself.",
  whatsapp: "447700900218",
  telefoneVisivel: "020 7946 0218",
  endereco: {
    linha1: "218 Wardell Street — Marylebone",
    linha2: "London · W1",
    referencia: "Doorman on the street, 9am to 9pm",
  },

  hero: {
    etiqueta: "London · Marylebone",
    titulo: "Casa Valerio",
    subtitulo:
      "One hour held for you alone, by appointment, with nobody rushing. Seen one at a time, in a private room.",
    cta: "Book your hour",
    ctaSecundario: "About the club",
  },

  ritual: {
    etiqueta: "The ritual",
    titulo: "There's no queue here. There's an appointment.",
    texto:
      "Every booking takes a full hour of the diary. That's the time it takes to do it properly and still have a coffee without watching the clock.",
    passos: [
      { numero: "I", titulo: "Welcome", texto: "Coffee, sparkling water or a finger of whisky. You choose before you sit down." },
      { numero: "II", titulo: "Consultation", texto: "Five minutes on your hair, your routine and what you don't want." },
      { numero: "III", titulo: "Hot towel", texto: "The skin opens, the beard softens. It's what lets the blade glide without pulling." },
      { numero: "IV", titulo: "The razor", texto: "Shaved with the grain, properly, with products worthy of a tailor." },
      { numero: "V", titulo: "Finishing", texto: "You leave ready for wherever you're going, not needing to stop at home first." },
    ],
  },

  servicos: {
    etiqueta: "Services",
    titulo: "Our list",
    texto: "Every appointment includes the consultation, a drink and finishing.",
    lista: [
      { nome: "The Valerio Cut", descricao: "Consultation, scissor cut and finishing", preco: "£70", duracao: "60 min" },
      { nome: "Traditional Shave", descricao: "Hot towel, cut-throat razor and finishing oil", preco: "£55", duracao: "45 min" },
      { nome: "Cut & Shave", descricao: "The full appointment, unhurried", preco: "£110", duracao: "90 min" },
      { nome: "Scalp Treatment", descricao: "Scalp diagnosis and a three-stage protocol", preco: "£80", duracao: "60 min" },
      { nome: "Pigmentation", descricao: "Filling gaps in the beard or hairline", preco: "£40", duracao: "30 min" },
      { nome: "Groom's Morning", descricao: "Two hours, bring a guest, with a gift from the house", preco: "£260", duracao: "120 min" },
    ],
  },

  mestres: {
    etiqueta: "The masters",
    titulo: "No barber here has fewer than ten years on the razor.",
    lista: [
      { nome: "Aurelio Valerio", papel: "Master barber and founder", anos: "28 years in the trade", especialidade: "Classic cut-throat" },
      { nome: "Tomas Ferrari", papel: "Senior barber", anos: "16 years in the trade", especialidade: "Business cuts and scissor work" },
      { nome: "Igor Salles", papel: "Senior barber", anos: "12 years in the trade", especialidade: "Scalp treatments" },
    ],
  },

  clube: {
    etiqueta: "The Valerio Club",
    titulo: "For the ones who already know they're coming back.",
    texto:
      "A monthly membership with your slot held, so you're never fighting for the diary. Cancel whenever you like.",
    planos: [
      { nome: "Essential", preco: "£140", periodo: "/month", inclui: ["2 cuts a month", "10% off products", "Book 7 days ahead"], destaque: false },
      { nome: "Club", preco: "£220", periodo: "/month", inclui: ["4 cuts a month", "2 shaves a month", "15% off products", "Book 15 days ahead"], destaque: true },
      { nome: "Privé", preco: "£390", periodo: "/month", inclui: ["Unlimited appointments", "A standing slot, held for you", "20% off products", "Bring a guest once a month"], destaque: false },
    ],
  },

  presente: {
    titulo: "Gift card",
    texto:
      "A named card, delivered in a linen envelope, valid for twelve months against anything on the list.",
    cta: "Buy one as a gift",
  },

  reserva: {
    etiqueta: "Booking",
    titulo: "Your hour, held",
    texto:
      "The diary usually fills five days out. Pick a service and we'll confirm over WhatsApp.",
    cta: "Book over WhatsApp",
    mensagem: "Hello! I'd like to book an appointment at Casa Valerio.",
  },

  horarios: [
    { dia: "Tuesday to Friday", hora: "10am – 9pm" },
    { dia: "Saturday", hora: "9am – 7pm" },
    { dia: "Sunday and Monday", hora: "Closed" },
  ],
};
