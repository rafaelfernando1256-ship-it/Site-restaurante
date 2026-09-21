/* ═══════════════════════════════════════════════════════════════
   DEMO PROJECT INDEX
   Metadata used on the portfolio home (cards and navigation).
   Each site's own content lives in content/demo-<slug>.ts
   ═══════════════════════════════════════════════════════════════ */

export type ResumoDemo = {
  slug: string;
  nome: string;
  arquetipo: string;
  slogan: string;
  /** The line you use in outreach when showing this project. */
  objetivo: string;
  /** What this demo proves to the prospect. */
  prova: string;
  publico: string;
  destaques: string[];
  paleta: { nome: string; hex: string }[];
  /** Cor de marca usada sobre o FUNDO ESCURO do portfólio (tabela de
      preços). É separada da paleta porque nem toda cor da paleta tem
      contraste suficiente no escuro — esta precisa passar em 4,5:1
      sobre #1a1a1d. */
  acento: string;
  tipografia: string;
  /** Color used on the portfolio card. */
  corCard: string;
  corTexto: string;
  mockup: string;
};

export const demos: ResumoDemo[] = [
  {
    slug: "larkspur",
    nome: "Larkspur",
    arquetipo: "Reservation · Chef-driven",
    slogan: "Twenty-two seats, one seating a night.",
    objetivo:
      "Built to justify the check average before anyone books, and to fill the room from the site instead of the waitlist.",
    prova: "Proves I can build a fine-dining brand, not just a good-looking page.",
    publico: "Special occasion, check average $145",
    destaques: [
      "Reserve as the only action above the fold",
      "Tasting menu with the wine pairing beside it",
      "Private dining and buyout inquiry",
      "Gift cards",
    ],
    paleta: [
      { nome: "Char", hex: "#12120F" },
      { nome: "Copper", hex: "#B87333" },
      { nome: "Bone", hex: "#E8E3D7" },
      { nome: "Moss", hex: "#2C3A2A" },
    ],
    acento: "#B87333",
    tipografia: "Playfair Display + Karla",
    corCard: "#12120F",
    corTexto: "#E8E3D7",
    mockup: "/mockups/larkspur.jpg",
  },
  {
    slug: "comal-taqueria",
    nome: "Comal Street Tacos",
    arquetipo: "Counter · Fast casual",
    slogan: "Order ahead. Skip the line.",
    objetivo:
      "Built to move the order off the delivery apps and onto the restaurant's own page, where the margin stays.",
    prova: "Proves I handle order-ahead, live specials and high-volume menus.",
    publico: "Lunch rush and late night, average ticket $17",
    destaques: [
      "Order-ahead as the fixed action",
      "Photo-first menu built for thumbs",
      "Today's specials, editable from a phone",
      "Catering and large-order inquiries",
    ],
    paleta: [
      { nome: "Comal black", hex: "#141210" },
      { nome: "Chile", hex: "#D6402A" },
      { nome: "Masa", hex: "#E9B44C" },
      { nome: "Lime", hex: "#9BBF3F" },
    ],
    acento: "#E9B44C",
    tipografia: "Archivo Black + Space Grotesk",
    corCard: "#141210",
    corTexto: "#E9B44C",
    mockup: "/mockups/comal-taqueria.jpg",
  },
  {
    slug: "blue-plate-diner",
    nome: "Blue Plate Diner",
    arquetipo: "Classic · Neighborhood",
    slogan: "Breakfast all day, since 1961.",
    objetivo:
      "Built for the customer who calls before driving over: open or closed, what's the special, where do I park.",
    prova: "Proves I design for the client's customer, not for my portfolio.",
    publico: "Regulars and families, average check $16",
    destaques: [
      "Call as the main action",
      "18px body text, and the menu in full",
      "Hours with holiday closures, said plainly",
      "Parking and the cross street up front",
    ],
    paleta: [
      { nome: "Cream", hex: "#F6F0E2" },
      { nome: "Diner red", hex: "#B62F27" },
      { nome: "Navy", hex: "#1D3557" },
      { nome: "Chrome", hex: "#8A8F98" },
    ],
    acento: "#8A8F98",
    tipografia: "Alfa Slab One + Libre Baskerville",
    corCard: "#F6F0E2",
    corTexto: "#B62F27",
    mockup: "/mockups/blue-plate-diner.jpg",
  },
];

export function acharDemo(slug: string) {
  return demos.find((d) => d.slug === slug);
}
