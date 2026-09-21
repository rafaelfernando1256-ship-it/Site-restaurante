/* ═══════════════════════════════════════════════════════════════
   DEMO PROJECT 2 — COMAL STREET TACOS
   Fictional restaurant. Nothing here matches a real business.
   Phone numbers use 555-01xx, reserved for fiction.
   ═══════════════════════════════════════════════════════════════ */

export const comal = {
  nome: "Comal Street Tacos",
  nomeCurto: "Comal",
  descritor: "Taquería",
  slogan: "Order ahead. Skip the line.",
  telefone: "+15125550188",
  telefoneVisivel: "(512) 555-0188",
  /* TROCAR: cole aqui o link de pedido online do cliente (Toast,
     Square, ChowNow). Enquanto for "#menu", o botão apenas rola até
     o cardápio da própria página. */
  pedidoUrl: "#menu",
  instagram: "@comalstreettacos",
  endereco: {
    linha1: "1880 East Cesar Chavez",
    linha2: "Austin, TX 78702",
    referencia: "Order at the window, eat at the picnic tables",
    estacionamento: "Lot behind the building, free",
  },

  hero: {
    linha1: "Order ahead.",
    linha2: "Skip the line.",
    subtitulo:
      "Tortillas pressed to order on a 400-degree comal. Ready in twelve minutes, waiting on the warmer when you get here.",
    cta: "Order now",
    ctaSecundario: "See the menu",
  },

  /* Scrolling strip of social proof */
  marquee: [
    "Tortillas pressed to order",
    "Ready in 12 minutes",
    "Open until 2am Thursday–Saturday",
    "Order ahead, skip the line",
    "Al pastor off the trompo",
  ],

  menu: {
    etiqueta: "The menu",
    titulo: "Prices on the page, no surprises",
    texto: "Every taco comes on two corn tortillas pressed when you order. Flour on request.",
    grupos: [
      {
        nome: "Tacos",
        itens: [
          { nome: "Al Pastor", descricao: "Off the trompo, pineapple, onion, cilantro", preco: "$4.25", tag: "Most ordered" },
          { nome: "Carne Asada", descricao: "Skirt steak, charred scallion, salsa verde", preco: "$4.75", tag: "" },
          { nome: "Barbacoa", descricao: "Beef cheek, eight hours, consomé on the side", preco: "$5.00", tag: "Weekends only" },
          { nome: "Pescado", descricao: "Fried gulf snapper, cabbage, chipotle crema", preco: "$5.25", tag: "" },
          { nome: "Nopal", descricao: "Grilled cactus, queso fresco, pepita salsa", preco: "$3.75", tag: "Vegetarian" },
          { nome: "Huevo con Chorizo", descricao: "Until 11am, or all day if you ask nicely", preco: "$3.95", tag: "" },
        ],
      },
      {
        nome: "Plates & sides",
        itens: [
          { nome: "Three-taco plate", descricao: "Any three, rice, charro beans", preco: "$14.50", tag: "" },
          { nome: "Queso fundido", descricao: "Chihuahua cheese, chorizo, warm tortillas", preco: "$9.00", tag: "" },
          { nome: "Elote", descricao: "Off the cob, crema, cotija, lime, chile", preco: "$5.50", tag: "" },
          { nome: "Chips & salsa trio", descricao: "Verde, roja, and the habanero one", preco: "$7.00", tag: "" },
        ],
      },
      {
        nome: "Drinks",
        itens: [
          { nome: "Agua fresca", descricao: "Horchata, jamaica, or whatever fruit came in", preco: "$4.00", tag: "" },
          { nome: "Mexican Coke", descricao: "Glass bottle, cane sugar", preco: "$3.50", tag: "" },
          { nome: "Michelada", descricao: "Beer, lime, clamato, tajín rim", preco: "$8.00", tag: "" },
        ],
      },
    ],
  },

  especiais: {
    etiqueta: "Today",
    titulo: "On the board right now",
    texto: "Changes daily. In the published site the owner edits this from a phone.",
    lista: [
      { nome: "Barbacoa Sunday", descricao: "Beef cheek plate with consomé, until it's gone", preco: "$16.00" },
      { nome: "Late-night 3-for-$11", descricao: "Any three tacos after 10pm", preco: "$11.00" },
    ],
  },

  comoFunciona: {
    etiqueta: "How ordering works",
    titulo: "Three steps and it's on the warmer",
    passos: [
      { numero: "1", titulo: "Build the order", texto: "Pick your tacos, tell us mild or the habanero one." },
      { numero: "2", titulo: "Pay on the page", texto: "Card or Apple Pay. No app to download, no account to make." },
      { numero: "3", titulo: "Walk past the line", texto: "Twelve minutes. Your name is on the bag at the pickup window." },
    ],
    nota: "In the published site this hands off to your POS — Toast, Square or Clover.",
  },

  catering: {
    etiqueta: "Catering",
    titulo: "Taco bar for twenty or two hundred",
    texto:
      "We bring the comal and press tortillas on site. Two days' notice for anything under fifty, a week over that.",
    cta: "Ask about catering",
  },

  galeria: {
    etiqueta: "The food",
    titulo: "What comes off the comal",
    texto: "Shot on a phone, on the pass, mid-service. Nothing styled.",
  },

  avaliacao: { nota: "4.7", quantidade: "1,240" },

  horarios: [
    { dia: "Monday – Wednesday", hora: "11am – 10pm" },
    { dia: "Thursday – Saturday", hora: "11am – 2am" },
    { dia: "Sunday", hora: "9am – 9pm" },
  ],
};
