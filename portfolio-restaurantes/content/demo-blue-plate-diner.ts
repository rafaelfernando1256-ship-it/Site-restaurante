/* ═══════════════════════════════════════════════════════════════
   DEMO PROJECT 3 — BLUE PLATE DINER
   Fictional restaurant. Nothing here matches a real business.
   Phone numbers use 555-01xx, reserved for fiction.
   ═══════════════════════════════════════════════════════════════ */

export const bluePlate = {
  nome: "Blue Plate Diner",
  descritor: "Since 1961",
  slogan: "Breakfast all day, since 1961.",
  telefone: "+19375550161",
  telefoneVisivel: "(937) 555-0161",
  endereco: {
    linha1: "1961 Wayne Avenue",
    linha2: "Dayton, OH 45410",
    referencia: "Corner of Wayne and Fifth, blue awning",
    estacionamento: "Free lot on the Fifth Street side, twelve spaces",
  },

  hero: {
    selo: "Since 1961",
    titulo: "Blue Plate Diner",
    subtitulo:
      "Eggs any way you want them, coffee that keeps coming, and pie that gets made on Tuesdays. Same corner for sixty-five years.",
    cta: "Call us",
    ctaSecundario: "See the menu",
  },

  historia: {
    etiqueta: "Our story",
    titulo: "Three families have run this counter. Two of them were the same one.",
    marcos: [
      { ano: "1961", titulo: "Hal opens the doors", texto: "Hal Brennan buys a failing lunch counter for $4,000 and keeps the stools." },
      { ano: "1988", titulo: "Dottie takes over", texto: "His daughter puts pie on the menu and refuses to take it off." },
      { ano: "2014", titulo: "The Floreses buy in", texto: "Marisol and Andrés keep every recipe, add huevos rancheros, change nothing else." },
    ],
  },

  menu: {
    etiqueta: "The menu",
    titulo: "Breakfast all day. We mean all day.",
    grupos: [
      {
        nome: "Breakfast",
        itens: [
          { nome: "Two eggs, any style", descricao: "Home fries, toast", preco: "$8.50" },
          { nome: "The Blue Plate", descricao: "Two eggs, bacon or sausage, home fries, pancakes", preco: "$13.25" },
          { nome: "Biscuits and gravy", descricao: "Sausage gravy, two biscuits", preco: "$9.75" },
          { nome: "Huevos rancheros", descricao: "Two eggs, salsa ranchera, beans, corn tortillas", preco: "$11.50" },
          { nome: "Buttermilk pancakes", descricao: "Short stack of three", preco: "$8.00" },
          { nome: "Corned beef hash", descricao: "Made here, not from a can", preco: "$12.00" },
        ],
      },
      {
        nome: "Lunch & supper",
        itens: [
          { nome: "Patty melt", descricao: "Rye, grilled onion, Swiss, fries", preco: "$12.50" },
          { nome: "Hot turkey sandwich", descricao: "White bread, gravy, mashed potatoes", preco: "$12.75" },
          { nome: "Meatloaf plate", descricao: "Two sides, roll", preco: "$14.00" },
          { nome: "Grilled cheese and soup", descricao: "Whatever's on today", preco: "$9.50" },
          { nome: "Chef salad", descricao: "Ham, turkey, egg, cheddar", preco: "$11.00" },
        ],
      },
      {
        nome: "Pie & coffee",
        itens: [
          { nome: "Pie by the slice", descricao: "Baked Tuesdays. Call to hear the flavors", preco: "$5.25" },
          { nome: "Pie à la mode", descricao: "Same slice, with vanilla", preco: "$6.75" },
          { nome: "Bottomless coffee", descricao: "As long as you're sitting", preco: "$2.75" },
        ],
      },
    ],
    observacao: "Cash and cards, no surcharge either way. Seniors and kids under 10 take $2 off any plate.",
  },

  oficio: {
    etiqueta: "How we do it",
    titulo: "Nothing clever, done right",
    itens: [
      { titulo: "The grill is never off", texto: "Breakfast runs until we close, because someone always wants eggs at 4pm." },
      { titulo: "Pie on Tuesdays", texto: "Dottie's crust recipe, made by hand, gone by Thursday most weeks." },
      { titulo: "Kids eat easy", texto: "Booster seats, crayons, and a short stack that costs three dollars." },
    ],
  },

  familia: {
    etiqueta: "Who's here",
    titulo: "The people behind the counter",
    lista: [
      { nome: "Marisol Flores", papel: "Owner", desde: "Since 2014", nota: "Opens at 6, most days" },
      { nome: "Andrés Flores", papel: "Grill", desde: "Since 2014", nota: "Mornings, Tuesday through Sunday" },
      { nome: "Dottie Brennan", papel: "Pie", desde: "Since 1988", nota: "Tuesdays, and she still checks the crust" },
    ],
  },

  /* Nota e quantidade são FICTÍCIAS. Ficam marcadas como demonstração
     na própria seção — não só no rodapé — porque número de avaliação
     é a linha que mais se confunde com dado real. */
  avaliacao: {
    nota: "4.6",
    quantidade: "894",
    aviso: "Demonstration only — this rating is fictional.",
  },

  localizacao: {
    etiqueta: "Find us",
    titulo: "No reservations. Come in and sit down.",
    texto:
      "Twelve booths and a counter. Sunday mornings there's a wait, and the coffee is free while you stand.",
  },

  horarios: [
    { dia: "Monday", hora: "Closed", dataDia: 1 },
    { dia: "Tuesday", hora: "6:00am – 8:00pm", dataDia: 2 },
    { dia: "Wednesday", hora: "6:00am – 8:00pm", dataDia: 3 },
    { dia: "Thursday", hora: "6:00am – 8:00pm", dataDia: 4 },
    { dia: "Friday", hora: "6:00am – 9:00pm", dataDia: 5 },
    { dia: "Saturday", hora: "6:00am – 9:00pm", dataDia: 6 },
    { dia: "Sunday", hora: "7:00am – 3:00pm", dataDia: 0 },
  ],

  feriados: "Closed Thanksgiving, Christmas Day and the Fourth of July.",
};
