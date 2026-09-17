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
  tipografia: string;
  /** Colour used on the portfolio card. */
  corCard: string;
  corTexto: string;
  mockup: string;
};

export const demos: ResumoDemo[] = [
  {
    slug: "casa-valerio",
    nome: "Casa Valerio",
    arquetipo: "Premium · Private barbershop",
    slogan: "The hour you set aside for yourself.",
    objetivo:
      "Built to justify a high price and sell the monthly membership before the first cut.",
    prova: "Proves I can build a luxury brand, not just a good-looking site.",
    publico: "Professionals 30–55, average spend £110",
    destaques: [
      "A section on the appointment ritual",
      "Services laid out like a restaurant menu",
      "Three-tier membership club",
      "Gift cards for buying on someone else's behalf",
    ],
    paleta: [
      { nome: "Ink black", hex: "#0D0D0F" },
      { nome: "Brass", hex: "#C4A867" },
      { nome: "Marble", hex: "#EDE8E0" },
      { nome: "Bottle green", hex: "#17372E" },
    ],
    tipografia: "Marcellus + Jost",
    corCard: "#0D0D0F",
    corTexto: "#EDE8E0",
    mockup: "/mockups/casa-valerio.jpg",
  },
  {
    slug: "nine-thirty",
    nome: "Nine Thirty",
    arquetipo: "Urban · Young barbershop",
    slogan: "Diary open. Look locked in.",
    objetivo:
      "Built to turn an Instagram follower into a booked slot inside the same minute.",
    prova: "Proves I handle online booking and social integration.",
    publico: "18–35, average spend £30, high volume",
    destaques: [
      "Pick the barber before the service",
      "Scrolling strip of social proof",
      "Feed-style gallery grid",
      "Today's free slots pulled to the top",
    ],
    paleta: [
      { nome: "Asphalt", hex: "#101114" },
      { nome: "Electric lime", hex: "#C6F24E" },
      { nome: "Signal orange", hex: "#FF5A1F" },
      { nome: "Ice", hex: "#F2F2EF" },
    ],
    tipografia: "Archivo Black + Space Grotesk",
    corCard: "#101114",
    corTexto: "#C6F24E",
    mockup: "/mockups/nove-e-meia.jpg",
  },
  {
    slug: "aurelio-and-sons",
    nome: "Aurelio & Sons",
    arquetipo: "Classic · Neighbourhood barbershop",
    slogan: "Three generations cutting this neighbourhood's hair.",
    objetivo:
      "Built for people who decide by phone: calling is the main button, not booking.",
    prova: "Proves I design for the client's customer, not for my portfolio.",
    publico: "35–70, average spend £22, loyal regulars",
    destaques: [
      "Calling as the main action",
      "18px body text for readability",
      "A three-generation timeline",
      "An enlarged directions section",
    ],
    paleta: [
      { nome: "Cream paper", hex: "#F7F1E3" },
      { nome: "Enamel red", hex: "#B22B2B" },
      { nome: "Navy", hex: "#1F3A5F" },
      { nome: "Walnut", hex: "#6B4A2F" },
    ],
    tipografia: "Alfa Slab One + Libre Baskerville",
    corCard: "#F7F1E3",
    corTexto: "#B22B2B",
    mockup: "/mockups/dom-aurelio.jpg",
  },
];

export function acharDemo(slug: string) {
  return demos.find((d) => d.slug === slug);
}
