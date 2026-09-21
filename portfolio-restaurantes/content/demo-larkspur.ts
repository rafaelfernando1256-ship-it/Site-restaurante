/* ═══════════════════════════════════════════════════════════════
   DEMO PROJECT 1 — LARKSPUR
   Fictional restaurant. Nothing here matches a real business.
   Phone numbers use 555-01xx, reserved for fiction.
   ═══════════════════════════════════════════════════════════════ */

export const larkspur = {
  nome: "Larkspur",
  descritor: "Tasting Room",
  slogan: "Twenty-two seats, one seating a night.",
  telefone: "+15035550119",
  telefoneVisivel: "(503) 555-0119",
  /* TROCAR: cole aqui o link da plataforma de reserva do cliente
     (Resy, OpenTable, Tock). Enquanto for "#reserve", o botão apenas
     rola até a seção de reserva da própria página. */
  reservaUrl: "#reserve",
  endereco: {
    linha1: "119 Alder Court",
    linha2: "Portland, OR 97209",
    referencia: "Unmarked door beside the flower shop",
    estacionamento: "Street parking after 6pm, garage on NW 13th",
  },

  hero: {
    etiqueta: "Portland · Pearl District",
    titulo: "Larkspur",
    subtitulo:
      "One menu, served once a night, to twenty-two people. It changes when the farms change, which is to say constantly.",
    cta: "Reserve a table",
    ctaSecundario: "See the menu",
  },

  cozinha: {
    etiqueta: "The kitchen",
    titulo: "We buy first and write the menu after.",
    texto:
      "There is no fixed card. Whatever came in from the coast and the valley that morning decides what you eat that night, which is why the menu you see here is last night's and not a promise.",
    passos: [
      { numero: "I", titulo: "The morning call", texto: "Six growers, one boat. Whatever is best goes on the board." },
      { numero: "II", titulo: "One seating", texto: "Everyone sits at seven. The kitchen cooks one service, not four hours of them." },
      { numero: "III", titulo: "Seven courses", texto: "Small, in order, paced so the table still talks between them." },
      { numero: "IV", titulo: "The pour", texto: "Old-world by the glass, poured to the course rather than the bottle." },
      { numero: "V", titulo: "The walk out", texto: "We hand you the night's menu on the way out. People keep them." },
    ],
  },

  menu: {
    etiqueta: "Last night",
    titulo: "The tasting menu",
    texto: "Seven courses, $145 a person. Wine pairing $85. Dietary restrictions with 48 hours' notice.",
    cursos: [
      { nome: "Oyster, cucumber, elderflower", nota: "Netarts Bay", vinho: "Muscadet" },
      { nome: "Chilled pea, mint, cured yolk", nota: "Sauvie Island", vinho: "Grüner Veltliner" },
      { nome: "Halibut, brown butter, green almond", nota: "Line-caught, Pacific City", vinho: "Chablis" },
      { nome: "Morels, farro, spring onion", nota: "Foraged, Mount Hood", vinho: "Jura Chardonnay" },
      { nome: "Duck, cherry, turnip", nota: "Dry-aged sixteen days", vinho: "Barbera" },
      { nome: "Chèvre, honeycomb, walnut", nota: "Willamette Valley", vinho: "Vin Jaune" },
      { nome: "Plum, buttermilk, lemon verbena", nota: "From the tree out back", vinho: "Moscato d'Asti" },
    ],
    observacao: "One seating at 7:00pm, Wednesday through Sunday. The menu changes most days.",
  },

  equipe: {
    etiqueta: "The room",
    titulo: "Four people run this restaurant.",
    lista: [
      { nome: "Nora Whitfield", papel: "Chef and owner", anos: "Opened Larkspur in 2019", especialidade: "Cooks the fish course herself, every night" },
      { nome: "Elias Mbeki", papel: "Sous chef", anos: "Six years in the kitchen", especialidade: "Pastry and the bread program" },
      { nome: "Junia Castellanos", papel: "Wine director", anos: "Certified Sommelier", especialidade: "Old-world, low intervention" },
    ],
  },

  privado: {
    etiqueta: "Private dining",
    titulo: "The whole room, if you want it.",
    texto:
      "Twenty-two seats, bought out for the night. We write a menu against your budget and there is no room fee — you pay for the food and the wine.",
    cta: "Inquire about a buyout",
  },

  presente: {
    titulo: "Gift cards",
    texto:
      "Issued in any amount, delivered by email or on a card we'll mail for you. No expiry, because an expiring gift is not a gift.",
    cta: "Buy a gift card",
  },

  reserva: {
    etiqueta: "Reservations",
    titulo: "Bookings open thirty days out",
    texto:
      "Tables are released at 10am on the first of the month and usually go the same week. Cancellations show up here, so it's worth checking back.",
    cta: "Reserve a table",
    nota: "In the published site this button hands off to your booking system — Resy, Tock or OpenTable.",
  },

  horarios: [
    { dia: "Wednesday – Saturday", hora: "One seating, 7:00pm" },
    { dia: "Sunday", hora: "One seating, 6:00pm" },
    { dia: "Monday – Tuesday", hora: "Closed" },
  ],
};
